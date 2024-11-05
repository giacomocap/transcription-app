// backend/src/routes.ts  
import { Router } from 'express';
import multer from 'multer';
import { Queue } from 'bullmq';
import pool from './db';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { refineTranscription } from './refinement';
import path from 'path';

dotenv.config();

const router = Router();
//preserve original extension
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

const redisOptions = {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
};

const transcriptionQueue = new Queue('transcriptionQueue', { connection: redisOptions });

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a file
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         description: The file to upload
 *     responses:
 *       200:
 *         description: Successfully uploaded
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    const jobId = uuidv4();

    // Save job in the database  
    await pool.query(
        'INSERT INTO jobs (id, file_name, status) VALUES ($1, $2, $3)',
        [jobId, file?.originalname, 'queued']
    );

    // Add job to the queue  
    await transcriptionQueue.add('transcribe', { jobId, filePath: file?.path, fileName: file?.originalname, mimeType: file?.mimetype });

    res.json({ jobId });
});

router.delete('/jobs/:id', async (req, res) => {
    const jobId = req.params.id;
    await pool.query('DELETE FROM jobs WHERE id = $1', [jobId]);
    res.json({ success: true });
});

router.get('/jobs', async (req, res) => {
    const result = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
    res.json(result.rows);
});

router.get('/config/transcription', async (req, res) => {
    const result = await pool.query('SELECT * FROM transcription_config ORDER BY created_at DESC');
    res.json(result.rows[0]);
});

router.get('/config/refinement', async (req, res) => {
    const result = await pool.query('SELECT * FROM refinement_config ORDER BY created_at DESC');
    res.json(result.rows[0]);
});

router.post('/config/transcription', async (req, res) => {
    const { openai_api_url, openai_api_key, model_name, max_concurrent_jobs } = req.body;
    const result = await pool.query('INSERT INTO transcription_config (openai_api_url, openai_api_key, model_name, max_concurrent_jobs) VALUES ($1, $2, $3, $4) RETURNING *', [openai_api_url, openai_api_key, model_name, max_concurrent_jobs]);
    res.json(result.rows[0]);
});

/**
 * @swagger
 * /config/refinement:
 *   post:
 *     summary: Add refinement configuration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               openai_api_url:
 *                 type: string
 *               openai_api_key:
 *                 type: string
 *               model_name:
 *                 type: string
 *               system_prompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully added refinement configuration
 */
router.post('/config/refinement', async (req, res) => {
    const { openai_api_url, openai_api_key, model_name, system_prompt } = req.body;
    const result = await pool.query('INSERT INTO refinement_config (openai_api_url, openai_api_key, model_name, system_prompt) VALUES ($1, $2, $3, $4) RETURNING *', [openai_api_url, openai_api_key, model_name, system_prompt]);
    res.json(result.rows[0]);
});

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The job ID
 *     responses:
 *       200:
 *         description: Successfully retrieved job
 */
router.get('/jobs/:id', async (req, res) => {
    const jobId = req.params.id;
    const result = await pool.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    res.json(result.rows[0]);
});

/**
 * @swagger
 * /jobs/{id}/refine:
 *   post:
 *     summary: Refine transcription for a job
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The job ID
 *     responses:
 *       200:
 *         description: Successfully refined transcription
 *       404:
 *         description: Original transcription not found
 *       500:
 *         description: Transcription refinement failed
 */
router.post('/jobs/:id/refine', async (req: any, res: any) => {
    const jobId = req.params.id;
    // Add the refinement job to the queue or handle directly  
    // For simplicity, we'll handle directly here  
    const jobResult = await pool.query('SELECT transcript FROM jobs WHERE id = $1', [jobId]);
    const originalText = jobResult.rows[0]?.transcript;

    if (!originalText) {
        return res.status(404).json({ error: 'Original transcription not found' });
    }

    // Use OpenAI API to refine the transcription  
    try {
        const openaiConfig = await pool.query('SELECT * FROM refinement_config');

        const refinedText = await refineTranscription(originalText, openaiConfig.rows[0]);

        // Optionally, update the job with the refined result or create a new entry  
        await pool.query('UPDATE jobs SET refined_transcript = $1 WHERE id = $2', [refinedText, jobId]);

        res.json({ success: true, refinedText });
    } catch (error) {
        console.error('Transcription refinement failed:', error);
        res.status(500).json({ error: 'Transcription refinement failed' });
    }
});

export { router };
