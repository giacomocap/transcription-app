// backend/src/refinement.ts  
import OpenAI from 'openai';
import { RefinementConfig } from './types';



export async function refineTranscription(originalText: string, openaiConfig: RefinementConfig): Promise<string> {
    const openai = new OpenAI({
        apiKey: openaiConfig.openai_api_key || process.env.OPENAI_API_KEY || '',
        baseURL: openaiConfig.openai_api_url || process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
    });

    const completion = await openai.chat.completions.create({
        model: openaiConfig.model_name || process.env.REFINEMENT_MODEL || 'llama-3.1-70b-versatile',
        messages: [
            {
                role: 'system',
                content: openaiConfig.system_prompt || 'You are a helpful assistant that refines transcriptions into well-formatted text.',
            },
            {
                role: 'user',
                content: `Please refine the following transcription:\n\n${originalText}`,
            },
        ],
    });

    const refinedText = completion.choices[0]?.message?.content || '';
    return refinedText.trim();
}  