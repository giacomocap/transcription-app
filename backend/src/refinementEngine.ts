import OpenAI from 'openai';
import { RefinementConfig } from './types';
import { TranscriptionSegment } from 'openai/resources/audio/transcriptions';

const CHUNK_REFINEMENT_PROMPT = `
You are an expert transcription refiner. Your task is to improve the given text segment while:
1. Maintaining the original meaning
2. Fixing grammar and punctuation
3. Keeping it concise
4. If Timecodes are present, keep them as they are

DO NOT add unnecessary words or change the meaning. Keep the refinement focused and precise. Keep the original language.
`;

const FULL_REFINEMENT_PROMPT = `
You are an expert transcription editor. Your task is to refine the complete transcription by:
1. Ensuring consistency across the entire text
2. Improving flow and readability
3. Maintaining the original meaning and key information
4. Fixing any remaining grammar or style issues

Focus on making the text professional and coherent while preserving the original content. Keep the original language.
Immediately respond with the refined text. Do not add anything else.
`;

export async function refineSegment(
    segment: TranscriptionSegment,
    openaiConfig: { openai_api_key: string, openai_api_url: string, model_name: string }
): Promise<TranscriptionSegment> {
    const openai = new OpenAI({
        apiKey: openaiConfig.openai_api_key || process.env.OPENAI_API_KEY || '',
        baseURL: openaiConfig.openai_api_url || process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
    });

    const completion = await openai.chat.completions.create({
        model: openaiConfig.model_name || 'gpt-3.5-turbo', // Using smaller model for individual segments
        messages: [
            {
                role: 'system',
                content: CHUNK_REFINEMENT_PROMPT,
            },
            {
                role: 'user',
                content: `Please refine this transcription segment:\n\n${segment.text}`,
            },
        ],
        temperature: 0.3, // Lower temperature for more consistent output
    });

    return {
        ...segment,
        text: completion.choices[0]?.message?.content?.trim() || segment.text,
    };
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
