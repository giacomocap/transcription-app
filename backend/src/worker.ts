// backend/src/worker.ts  
import { Worker } from 'bullmq';
import pool from './db';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { TranscriptionConfig } from './types';

dotenv.config();

const redisOptions = {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
};

const transcriptionWorker = new Worker(
    'transcriptionQueue',
    async job => {
        const { jobId, filePath } = job.data;

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

            // Call OpenAI Whisper API using the official OpenAI Node.js library  
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(absoluteFilePath),
                model: apiModel || process.env.WHISPER_MODEL || 'whisper-1',
                // Include any additional parameters if needed  
            });

            const transcriptText = transcription.text;

            // Save result in the database  
            await pool.query('UPDATE jobs SET status = $1, transcript = $2 WHERE id = $3', [
                'completed',
                transcriptText,
                jobId,
            ]);

            // Delete the file after processing  
            fs.unlinkSync(absoluteFilePath);
        } catch (error) {
            console.error('Transcription failed:', error);
            await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', ['failed', jobId]);
        }
    },
    { connection: redisOptions }
);

transcriptionWorker.on('completed', job => {
    console.log(`Job ${job.id} has completed!`);
});

transcriptionWorker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
});  