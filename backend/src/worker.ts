// backend/src/worker.ts  
import { Worker, Queue } from 'bullmq';
import pool from './db';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { RefinementConfig, TranscriptionConfig } from './types';
import { refineSegment, refineFullTranscript } from './refinementEngine';
import { TranscriptionSegment } from 'openai/resources/audio/transcriptions';

dotenv.config();

const redisOptions = {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
};
const DIARIZATION_URL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : 'http://diarization:8000';

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
            return JSON.parse(status.result);
        }

        if (status.status === 'failed') {
            throw new Error(`Diarization failed: ${status.error}`);
        }

        // Wait for 10 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
    }

    throw new Error('Diarization timed out');
}

const transcriptionWorker = new Worker(
    'transcriptionQueue',
    async job => {
        const { jobId, filePath, fileName, diarizationEnabled } = job.data;

        //get openai params from transcription_config
        const openaiConfig = (await pool.query('SELECT * FROM transcription_config')).rows[0] as TranscriptionConfig;
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
            const fileUrl = `/api/uploads/${path.basename(filePath)}`;

            // Store the file URL
            await pool.query('UPDATE jobs SET file_url = $1 WHERE id = $2', [fileUrl, jobId]);

            // Start transcription with Whisper
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(absoluteFilePath),
                model: apiModel,
                response_format: 'verbose_json',
            });

            // Save initial transcription result
            const srtContent = segmentsToSRT(transcription.segments!);
            await pool.query(
                'UPDATE jobs SET status = $1, transcript = $2, subtitle_content=$3, updated_at = NOW() WHERE id = $4',
                ['transcribed', transcription.text, srtContent, jobId]
            );

            // Enqueue refinement job
            // await refinementQueue.add('refine', {
            //     jobId,
            //     segments: transcription.segments,
            //     fullText: transcription.text
            // });

            // If diarization is enabled, start it asynchronously
            if (diarizationEnabled) {
                try {
                    // Start diarization
                    const diarizeResponse = await fetch(`${DIARIZATION_URL}/diarize`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            job_id: jobId,
                            file_path: absoluteFilePath,
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
            const finalText = combineTranscriptionAndDiarization(transcriptionSegments, diarizationResult.segments);

            // Update job with diarized result
            await pool.query(
                'UPDATE jobs SET subtitle_content = $1, diarization_status = $2, speaker_profiles = $3 WHERE id = $4',
                [finalText, 'completed', JSON.stringify(diarizationResult.speaker_profiles), jobId]
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

// Create a refinement worker
const refinementWorker = new Worker(
    'refinementQueue',
    async job => {
        const { jobId, segments } = job.data as {
            jobId: string;
            segments: TranscriptionSegment[];
        };

        try {
            // const openaiConfig = (await pool.query('SELECT * FROM refinement_config')).rows[0] as RefinementConfig;

            // // First stage: Refine each segment individually
            // const refinedSegments = await Promise.all(
            //     segments!.map(segment => refineSegment(segment, {
            //         openai_api_key: openaiConfig.openai_api_key,
            //         openai_api_url: openaiConfig.openai_api_url,
            //         model_name: openaiConfig.fast_model_name ?? 'llama-3.1-8b-instant'
            //     }))
            // );
            // const refinedSrtContent = segmentsToSRT(refinedSegments);
            // const fullText = refinedSegments.map(s => s.text).join(' ');

            // await pool.query(
            //     'UPDATE jobs SET status = $1, transcript = $2, subtitle_content = $3, updated_at = NOW() WHERE id = $4',
            //     ['transcribed', fullText, refinedSrtContent, jobId]);



            // // Second stage: Refine the full transcript
            // const finalRefinedText = await refineFullTranscript(refinedSegments, openaiConfig);

            // await pool.query(
            //     'UPDATE jobs SET status = $1, transcript = $2, updated_at = NOW() WHERE id = $3',
            //     ['refined', finalRefinedText, jobId]
            // );

        } catch (error) {
            console.error('Refinement error:', error);
            throw error;
        }
    },
    { connection: redisOptions }
);
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

function combineTranscriptionAndDiarization(transcriptSegments: TranscriptionSegment[], diarizationSegments: any[]): string {
    let combinedSegments: any[] = [];
    let diarizationIndex = 0;

    transcriptSegments.forEach(transcriptSegment => {
        while (diarizationIndex < diarizationSegments.length &&
            diarizationSegments[diarizationIndex].end <= transcriptSegment.start) {
            diarizationIndex++;
        }

        if (diarizationIndex < diarizationSegments.length &&
            diarizationSegments[diarizationIndex].start < transcriptSegment.end) {
            const speaker = diarizationSegments[diarizationIndex].speaker;
            combinedSegments.push({
                ...transcriptSegment,
                text: `[${speaker}] ${transcriptSegment.text}`
            });
        } else {
            combinedSegments.push(transcriptSegment);
        }
    });

    return segmentsToSRT(combinedSegments);
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