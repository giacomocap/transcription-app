// backend/src/worker.ts  
import { Worker } from 'bullmq';
import pool from './db';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { TranscriptionConfig } from './types';
import { refineTranscription } from './refinement';
import { TranscriptionSegment } from 'openai/resources/audio/transcriptions';

dotenv.config();

const redisOptions = {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
};

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
            const fileUrl = `/uploads/${path.basename(filePath)}`;

            // Store the file URL
            await pool.query('UPDATE jobs SET file_url = $1 WHERE id = $2', [fileUrl, jobId]);

            // Call OpenAI Whisper API using the official OpenAI Node.js library  
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(absoluteFilePath),
                model: apiModel || process.env.WHISPER_MODEL || 'whisper-1',
                response_format: "verbose_json",
            });

            const transcriptText = transcription.text;
            const srtContent = segmentsToSRT(transcription.segments!);

            // Save result in the database  
            await pool.query(
                'UPDATE jobs SET status = $1, transcript = $2, subtitle_content = $3 WHERE id = $4',
                ['completed', transcriptText, srtContent, jobId]
            );

            // Start automatic refinement
            try {
                const refinementConfig = (await pool.query('SELECT * FROM refinement_config')).rows[0];
                const refinedText = await refineTranscription(transcriptText, refinementConfig);
                await pool.query('UPDATE jobs SET refined_transcript = $1 WHERE id = $2', [refinedText, jobId]);
            } catch (error) {
                console.error('Refinement failed:', error);
            }

            // Don't delete the file if diarization is still pending
            // if (!diarizationEnabled || await isDiarizationComplete(jobId)) {
            //     fs.unlinkSync(absoluteFilePath);
            // }
        } catch (error) {
            console.error('Transcription failed:', error);
            await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', ['failed', jobId]);
        }
    },
    { connection: redisOptions }
);
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