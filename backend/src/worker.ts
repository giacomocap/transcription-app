// backend/src/worker.ts  
import { Worker, Queue } from 'bullmq';
import pool from './db';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { RefinementConfig, TranscriptionConfig } from './types';
import { TranscriptionSegment } from 'openai/resources/audio/transcriptions';
import { convertToOpus } from './converter';
import crypto from 'crypto';

dotenv.config();

const redisOptions = {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
};
const DIARIZATION_URL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : 'http://diarization:8000';
const ENHANCEMENT_SERVICE_URL = 'http://audio-enhancement:3003';

interface EnhancementJob {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
}

async function pollDiarizationStatus(jobId: string, maxAttempts = 360): Promise<any> {
    let attempts = 0;

    while (attempts < maxAttempts) {
        const response = await fetch(`${DIARIZATION_URL}/status/${jobId}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Diarization job not found');
            }
            throw new Error(`Failed to get diarization status: ${response.statusText}`);
        }

        const status = await response.json();

        if (status.status === 'completed') {
            console.log('Diarization completed for job:', jobId);
            return status.result;
        }

        if (status.status === 'failed') {
            throw new Error(`Diarization failed: ${status.error}`);
        }

        await pool.query(
            'UPDATE jobs SET diarization_progress = $1 WHERE id = $2',
            [status.progress, jobId]
        );

        // Wait for 10 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
    }

    throw new Error('Diarization timed out');
}

async function processAudioEnhancement(audioPath: string): Promise<string> {
    try {
        // Create enhancement job
        const jobId = crypto.randomUUID();
        const createResponse = await fetch(`${ENHANCEMENT_SERVICE_URL}/enhance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                job_id: jobId,
                file_path: audioPath,
            }),
        });

        if (!createResponse.ok) {
            throw new Error(`Enhancement job creation failed: ${createResponse.statusText}`);
        }

        // Poll for job completion
        while (true) {
            const statusResponse = await fetch(`${ENHANCEMENT_SERVICE_URL}/status/${jobId}`);

            if (!statusResponse.ok) {
                throw new Error(`Failed to get job status: ${statusResponse.statusText}`);
            }

            const status = await statusResponse.json();

            if (status.status === 'completed') {
                return `${ENHANCEMENT_SERVICE_URL}/download/${jobId}`;
            } else if (status.status === 'failed') {
                throw new Error(`Enhancement failed: ${status.error}`);
            }

            // Wait before next poll
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error('Audio enhancement failed:', error);
        throw error;
    }
}

async function downloadFile(url: string, filePath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await fs.promises.writeFile(filePath, Buffer.from(buffer));
}

const transcriptionWorker = new Worker(
    'transcriptionQueue',
    async job => {
        const { jobId, filePath, fileName, diarizationEnabled } = job.data;

        //get openai params from transcription_config
        const openaiConfig = {
            model_name: process.env.AUDIO_MODEL,
            openai_api_key: process.env.AUDIO_OPENAI_API_KEY,
            openai_api_url: process.env.AUDIO_OPENAI_API_URL,
            max_concurrent_jobs: process.env.MAX_CONCURRENT_JOBS || 3,
        } as TranscriptionConfig;
        console.log('openaiConfig', openaiConfig);
        const apiModel = openaiConfig.model_name;
        const apiKey = openaiConfig.openai_api_key;
        const apiBaseUrl = openaiConfig.openai_api_url;

        const openai = new OpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY || '',
            baseURL: apiBaseUrl || process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
        });

        // Update job status to 'running'  
        await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', ['running', jobId]);

        try {
            // Read the file from disk  
            const absoluteFilePath = path.resolve(filePath);

            // Convert file to Opus if it's not already an Opus
            let transcriptionFilePath = absoluteFilePath;
            // if (!filePath.toLowerCase().endsWith('.opus')) {
            //     console.log(`Converting ${fileName} to Opus format...`);
            //     transcriptionFilePath = await convertToOpus(absoluteFilePath);
            //     console.log(`File converted successfully to: ${transcriptionFilePath}`);
            // }

            let enhancedAudioPath = transcriptionFilePath;
            // First enhance the audio
            // const enhancedAudioUrl = await processAudioEnhancement(transcriptionFilePath);

            // // Download enhanced audio
            // enhancedAudioPath = path.join(
            //   os.tmpdir(),
            //   `enhanced_${path.basename(transcriptionFilePath)}`
            // );
            // await downloadFile(enhancedAudioUrl, enhancedAudioPath);

            const fileUrl = `/api/uploads/${path.basename(filePath)}`;

            // Store the file URL
            await pool.query('UPDATE jobs SET file_url = $1 WHERE id = $2', [fileUrl, jobId]);

            // Start transcription with Whisper
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(enhancedAudioPath),
                model: apiModel,
                response_format: 'verbose_json',
            });

            // Save initial transcription result
            const srtContent = segmentsToSRT(transcription.segments!);
            await pool.query(
                'UPDATE jobs SET status = $1, transcript = $2, subtitle_content=$3, updated_at = NOW() WHERE id = $4',
                ['transcribed', transcription.text, srtContent, jobId]
            );

            // Start refinement immediately if diarization is disabled
            if (!diarizationEnabled) {
                await refinementQueue.add('refine', {
                    jobId,
                    segments: transcription.segments,
                    fullText: transcription.text
                });
            } else {
                // Set needs_user_confirmation flag and wait for user confirmation
                await pool.query(
                    'UPDATE jobs SET refinement_pending = $1 WHERE id = $2',
                    [true, jobId]
                );
                try {
                    // Start diarization
                    const diarizeResponse = await fetch(`${DIARIZATION_URL}/diarize`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            job_id: jobId,
                            file_path: enhancedAudioPath,
                        }),
                    });

                    if (!diarizeResponse.ok) {
                        throw new Error(`Failed to start diarization: ${diarizeResponse.statusText}`);
                    }

                    // Add diarization polling job to separate queue
                    await diarizationQueue.add('pollDiarization', {
                        jobId,
                        transcriptionSegments: transcription.segments,
                    });

                } catch (error: any) {
                    console.error('Diarization error:', error);
                    await pool.query(
                        'UPDATE jobs SET diarization_status = $1 WHERE id = $3',
                        ['failed', jobId]
                    );
                }
            }

            return { jobId, status: 'transcribed' };

        } catch (error: any) {
            console.error('Error processing job:', error);
            await pool.query(
                'UPDATE jobs SET status = $1,transcript = $2 WHERE id = $3',
                ['failed', error.message, jobId]
            );
            throw error;
        }
    },
    { connection: redisOptions }
);

const diarizationQueue = new Queue('diarizationQueue', { connection: redisOptions });

// Separate worker for diarization polling
const diarizationWorker = new Worker(
    'diarizationQueue',
    async job => {
        const { jobId, transcriptionSegments } = job.data;

        try {
            //Update job status to 'diarizing'
            await pool.query('UPDATE jobs SET diarization_status = $1 WHERE id = $2', ['running', jobId]);

            const diarizationResult = await pollDiarizationStatus(jobId);
            // const finalText = combineTranscriptionAndDiarization(transcriptionSegments, diarizationResult.segments);

            // Update job with diarized result and set needs_user_confirmation flag
            await pool.query(
                'UPDATE jobs SET diarization_status = $1, speaker_profiles = $2, speaker_segments = $3, diarization_progress = $4, refinement_pending = true WHERE id = $5',
                ['completed', JSON.stringify(diarizationResult.speaker_profiles), JSON.stringify(diarizationResult.segments), 100, jobId]
            );

            return { jobId, status: 'completed' };
        } catch (error: any) {
            console.error('Diarization polling error:', error);
            await pool.query(
                'UPDATE jobs SET diarization_status = $1, diarization_error = $2 WHERE id = $3',
                ['failed', error.message, jobId]
            );
            throw error;
        }
    },
    { connection: redisOptions }
);

const refinementQueue = new Queue('refinementQueue', { connection: redisOptions });

async function refineTranscription(segments: TranscriptionSegment[], config: RefinementConfig): Promise<string> {
    const MAX_TOKENS_PER_CHUNK = 4000; // Adjust based on the model's output window and your testing
    const openai = new OpenAI({
        apiKey: config.openai_api_key,
        baseURL: config.openai_api_url,
    });

    const chunks = chunkTranscription(segments, MAX_TOKENS_PER_CHUNK);
    let refinedText = '';
    let previousChunkSummary = '';

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const prompt = buildPrompt(chunk, previousChunkSummary);

        const response = await openai.chat.completions.create({
            model: config.model_name, // or another suitable model
            messages: [
                { role: 'system', content: systemPrompt }, // Your system prompt (see below)
                { role: 'user', content: prompt },
            ],
            temperature: 0.4,
        });

        const refinedChunk = response.choices[0].message.content || '';

        // Summarize the refined chunk for context in the next iteration, only if it's not the last chunk.
        if (i < chunks.length - 1) {
            previousChunkSummary = await summarizeText(refinedChunk, config);
        }

        // Concatenate the refined chunk to the overall result 
        refinedText += refinedChunk;
    }

    return refinedText.trim();
}

// Replace the existing refinement worker with this new implementation
const refinementWorker = new Worker(
    'refinementQueue',
    async job => {
        const { jobId, segments, fullText } = job.data;
        console.log(`Starting refinement for job ${jobId}`);

        try {
            const openaiConfig = {
                model_name: process.env.REFINEMENT_MODEL,
                openai_api_key: process.env.OPENAI_API_KEY,
                openai_api_url: process.env.OPENAI_API_URL,
                fast_model_name: process.env.FAST_REFINEMENT_MODEL,
            } as RefinementConfig;

            // Start refinement
            console.log(`Beginning text refinement for job ${jobId}`);
            const refinedText = await refineTranscription(segments, openaiConfig);
            console.log(`Refinement completed for job ${jobId}`);

            // Generate executive summary
            console.log(`Generating executive summary for job ${jobId}`);
            const executiveSummary = await generateExecutiveSummary(refinedText, openaiConfig);
            console.log(`Executive summary generated for job ${jobId}`);

            // Final update
            await pool.query(
                'UPDATE jobs SET status = $1, refined_transcript = $2, summary = $3, updated_at = NOW() WHERE id = $4',
                ['transcribed', refinedText, executiveSummary, jobId]
            );
            console.log(`Database update completed for job ${jobId}`);

        } catch (error) {
            console.error(`Refinement error for job ${jobId}:`, error);
            throw error;
        }
    },
    { connection: redisOptions }
);


function chunkTranscription(segments: TranscriptionSegment[], maxTokens: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    let currentChunkTokens = 0;

    for (const segment of segments) {
        const segmentText = segment.text;
        const segmentTokens = estimateTokens(segmentText); // Implement your token estimation
        // If adding this segment would exceed maxTokens, start a new chunk
        if (currentChunkTokens + segmentTokens > maxTokens && currentChunk) {
            chunks.push(currentChunk);
            currentChunk = '';
            currentChunkTokens = 0;
        }

        // Add segment to current chunk
        currentChunk += segmentText + ' ';
        currentChunkTokens += segmentTokens;
    }

    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}

async function summarizeText(text: string, config: RefinementConfig): Promise<string> {
    const summaryPrompt = `
    <prompt>
      <task>
        Provide a concise summary of the following text, focusing on the main points and key information. The summary should be no more than 100 words. Directly respond with the summary. Mantain the original language, Do not translate the text ever!!
      </task>
      <text>
        ${text}
      </text>
    </prompt>
    `;

    const openai = new OpenAI({
        apiKey: config.openai_api_key,
        baseURL: config.openai_api_url,
    });

    const response = await openai.chat.completions.create({
        model: config.fast_model_name,
        messages: [
            { role: 'user', content: summaryPrompt },
        ],
        temperature: 0.4,
    });

    return response.choices[0].message.content || '';
}

function buildPrompt(chunk: string, previousChunkSummary: string): string {
    return `
    <prompt>
      <context>
        ${previousChunkSummary ? `<summary>${previousChunkSummary}</summary>` : ''}
      </context>
      <text>
        ${chunk}
      </text>
    </prompt>
    `;
}

const systemPrompt = `
<prompt>
  <role>
    You are a specialized text refinement assistant. Your primary objective is to meticulously refine and structure raw text transcriptions, enhancing their clarity, coherence, and readability. Your output should be a polished, professional document ready for review and publication. It is imperative that you strictly preserve the original meaning and intent of the text throughout the refinement process.
  </role>
  <tasks>
    <task id="1">
      Correct all grammatical errors, punctuation mistakes, and formatting inconsistencies.
    </task>
    <task id="2">
      Restructure the text to eliminate the informalities typical of spoken language, such as filler words, repetitions, and false starts. Ensure the refined text maintains a formal and professional tone.
    </task>
    <task id="3">
      Address and correct common homophone errors, unclear word choices, and any non-standard language usage.
    </task>
    <task id="4">
      <important>
        Format the refined text into multiple paragraphs to improve readability. Ensure a logical flow between paragraphs, but do not add any titles or headings.
      </important>
      <example input="This is the first point. This is the second point. And this is the third point.">
        Refined: "This is the first point. This is the second point.\n\nAnd this is the third point."
      </example>
    </task>
    <task id="5">
      <important>
         Refine the text without summarizing. All original information and details must be included and accurately represented in the output.
      </important>
    </task>
  </tasks>
  <rules>
    <rule id="1">
      <most-important>
        Do not, under any circumstances, translate the text. Your work must be conducted strictly in the original language of the transcription.
      </most-important>
    </rule>
    <rule id="2">
      Process the entire transcription thoroughly before delivering the final output. Do not submit incomplete or partial refinements.
    </rule>
    <rule id="3">
      Ensure that all original meanings and nuances of the text are maintained without any deviation or alteration.
    </rule>
    <rule id="4">
       Avoid summarizing the content. The refined text should retain all the important information present in the original transcription.
    </rule>
    <rule id="5">
    Already refined and summarized text could be provided as context. Do not include the context in the final output.
    </rule>
  </rules>
  <instruction>
    Refine the following text:
  </instruction>
</prompt>
`

async function generateExecutiveSummary(text: string, config: RefinementConfig): Promise<string> {
    const MAX_TOKENS_PER_SUMMARY_CHUNK = 6000; // Conservative limit for summary generation
    const openai = new OpenAI({
        apiKey: config.openai_api_key,
        baseURL: config.openai_api_url,
    });

    // If text is short enough, process directly
    if (text.length < MAX_TOKENS_PER_SUMMARY_CHUNK * 4) { // Approximate token estimation
        return await generateSingleSummary(text, config);
    }

    // For longer texts, use a two-stage summarization
    const textChunks = chunkText(text, MAX_TOKENS_PER_SUMMARY_CHUNK);
    const intermediateSummaries = await Promise.all(
        textChunks.map(chunk => generateIntermediateSummary(chunk, config))
    );

    // Combine intermediate summaries into final executive summary
    const combinedSummary = intermediateSummaries.join('\n\n');
    return await generateSingleSummary(combinedSummary, config);
}

async function generateSingleSummary(text: string, config: RefinementConfig): Promise<string> {
    const openai = new OpenAI({
        apiKey: config.openai_api_key,
        baseURL: config.openai_api_url,
    });

    const summaryPrompt = `
    <prompt>
      <task>
        Create an executive summary of the following text. The summary should:
        - Be approximately 250-300 words
        - Highlight the most important points, key decisions, and main conclusions
        - Be written in a professional, business-appropriate tone
        - Include any critical action items or next steps if present
        - Maintain the original context and intent of the discussion
        - mantain the original language of the transcription, do not translate the text ever!!
      </task>
      <text>
        ${text}
      </text>
    </prompt>
    `;

    const response = await openai.chat.completions.create({
        model: config.model_name,
        messages: [
            { role: 'user', content: summaryPrompt },
        ],
        temperature: 0.3,
    });

    return response.choices[0].message.content || '';
}

async function generateIntermediateSummary(text: string, config: RefinementConfig): Promise<string> {
    const openai = new OpenAI({
        apiKey: config.openai_api_key,
        baseURL: config.openai_api_url,
    });

    const summaryPrompt = `
    <prompt>
      <task>
        Create a detailed summary of this section of text, focusing on:
        - Key points and main ideas
        - Important details and context
        - Any decisions or action items
        - mantain the original language of the transcription, do not translate the text ever!!
        Keep the summary to around 150 words while maintaining all crucial information.
      </task>
      <text>
        ${text}
      </text>
    </prompt>
    `;

    const response = await openai.chat.completions.create({
        model: config.model_name,
        messages: [
            { role: 'user', content: summaryPrompt },
        ],
        temperature: 0.3,
    });

    return response.choices[0].message.content || '';
}

//Helper function to chunk text for summarization
function chunkText(text: string, maxTokens: number): string[] {
    // Rough approximation: 1 token ≈ 4 characters
    const chunkSize = maxTokens * 4;
    const chunks: string[] = [];

    // Split by paragraphs first
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        if ((currentChunk + paragraph).length > chunkSize) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }
            // If a single paragraph is too long, split it by sentences
            if (paragraph.length > chunkSize) {
                const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [];
                for (const sentence of sentences) {
                    if (currentChunk.length + sentence.length > chunkSize) {
                        if (currentChunk) {
                            chunks.push(currentChunk.trim());
                            currentChunk = '';
                        }
                    }
                    currentChunk += sentence;
                }
            } else {
                currentChunk = paragraph;
            }
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

// Placeholder - Implement a proper token estimation strategy for your chosen model
function estimateTokens(text: string): number {
    return text ? Math.round(text.split(/\s+/).length * 1.33) : 0;
}

// Convert SRT format to segments
function srtToSegments(srtContent: string): { start: number, end: number, text: string }[] {
    const blocks = srtContent.trim().split('\n\n');
    return blocks.map(block => {
        const [, timecode, ...textLines] = block.split('\n');
        const [start, end] = timecode.split(' --> ').map(timeToSeconds);
        return {
            start,
            end,
            text: textLines.join(' ').trim()
        };
    });
}

function timeToSeconds(timeString: string): number {
    const [hours, minutes, seconds] = timeString.split(':').map(parseFloat);
    return hours * 3600 + minutes * 60 + seconds;
}

// Convert segments to SRT format
function segmentsToSRT(segments: TranscriptionSegment[]): string {
    return segments?.map((segment, index) => {
        const startTime = formatSRTTime(segment.start);
        const endTime = formatSRTTime(segment.end);
        return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text.trim()}\n`;
    }).join('\n') ?? "";
}

// Format time for SRT (HH:MM:SS,mmm)
function formatSRTTime(seconds: number): string {
    const date = new Date(seconds * 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = date.getUTCMinutes();
    const secs = date.getUTCSeconds();
    const ms = date.getUTCMilliseconds();

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

async function isTranscriptionComplete(jobId: string): Promise<boolean> {
    const result = await pool.query(
        'SELECT status FROM jobs WHERE id = $1',
        [jobId]
    );
    const status = result.rows[0]?.status;
    return status === 'completed' || status === 'failed';
}

transcriptionWorker.on('completed', job => {
    console.log(`Job ${job.id} has completed!`);
});

transcriptionWorker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
});
