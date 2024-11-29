import OpenAI from 'openai';
import { RefinementConfig } from './types';
import { TranscriptionSegment } from 'openai/resources/audio/transcriptions';

const BATCH_REFINEMENT_PROMPT = `
You are an expert transcription refiner. Your task is to improve the given transcription segments while:
1. Maintaining the original meaning and timestamps
2. Fixing grammar and punctuation
3. Keeping it concise
4. Adding minimal context in brackets [like this] when necessary
5. Do not stop until all segments are improved

IMPORTANT: Each segment is marked with its index. You MUST return the refined text in the EXACT same format:
[0] Original text here
[1] Another segment here

Your response should follow the same format with the same indices. DO NOT change the order or remove any segments.
`;

const FULL_REFINEMENT_PROMPT = `
You are an expert transcription editor. Your task is to refine the complete transcription by:
1. Ensuring consistency across the entire text
2. Improving flow and readability
3. Maintaining the original meaning and key information
4. Fixing any remaining grammar or style issues
5. Do not stop until the entire transcription is improved

Focus on making the text professional and coherent while preserving the original content. Keep the original language.
Immediately respond with the refined text. Do not add anything else.
`;

export async function refineSegmentsBatch(
    segments: TranscriptionSegment[],
    openaiConfig: { openai_api_key: string, openai_api_url: string, model_name: string },
    batchSize: number = 50
): Promise<TranscriptionSegment[]> {
    const openai = new OpenAI({
        apiKey: openaiConfig.openai_api_key || process.env.OPENAI_API_KEY || '',
        baseURL: openaiConfig.openai_api_url || process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
    });

    // Process segments in batches
    const batches: TranscriptionSegment[][] = [];
    for (let i = 0; i < segments.length; i += batchSize) {
        batches.push(segments.slice(i, i + batchSize));
    }

    const refinedSegments: TranscriptionSegment[] = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchText = batch.map((segment, idx) => `[${idx}] ${segment.text}`).join('\n');

        const completion = await openai.chat.completions.create({
        model: openaiConfig.model_name || 'gpt-3.5-turbo', // Using smaller model for individual segments
            messages: [
                {
                    role: 'system',
                    content: BATCH_REFINEMENT_PROMPT,
                },
                {
                    role: 'user',
                    content: batchText,
                },
            ],
            temperature: 0.3,
        });

        const refinedText = completion.choices[0]?.message?.content?.trim() || '';
        const refinedLines = refinedText.split('\n').filter(line => line.trim());

        // Parse refined segments and maintain original timestamps
        for (let i = 0; i < batch.length; i++) {
            const originalSegment = batch[i];
            const refinedLine = refinedLines.find(line => line.startsWith(`[${i}]`));
            
            if (refinedLine) {
                const refinedText = refinedLine.replace(/^\[\d+\]\s*/, '').trim();
                refinedSegments.push({
                    ...originalSegment,
                    text: refinedText,
                });
            } else {
                // Fallback to original if something went wrong
                refinedSegments.push(originalSegment);
            }
        }
    }

    return refinedSegments;
}

export async function refineFullTranscript(
    segments: TranscriptionSegment[],
    openaiConfig: { openai_api_key: string, openai_api_url: string, model_name: string }
): Promise<string> {
    const openai = new OpenAI({
        apiKey: openaiConfig.openai_api_key || process.env.OPENAI_API_KEY || '',
        baseURL: openaiConfig.openai_api_url || process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
    });

    // Combine all segments into one text
    const fullText = segments.map(s => s.text).join(' ');
    
    // Split into chunks of roughly 2000 characters to stay well within token limits
    const chunks = splitIntoChunks(fullText, 2000);
    
    // Refine each chunk
    const refinedChunks = await Promise.all(chunks.map(async chunk => {
        const completion = await openai.chat.completions.create({
            model: openaiConfig.model_name || 'gpt-4', // Using more powerful model for final refinement
            messages: [
                {
                    role: 'system',
                    content: FULL_REFINEMENT_PROMPT,
                },
                {
                    role: 'user',
                    content: `Please refine this part of the transcription:\n\n${chunk}`,
                },
            ],
            temperature: 0.3,
        });
        return completion.choices[0]?.message?.content?.trim() || chunk;
    }));

    // Combine refined chunks
    return refinedChunks.join(' ');
}

function splitIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    const sentences = text.split(/(?<=[.!?])\s+/);

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
    }
    
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
}
