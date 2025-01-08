// backend/src/routes.ts  
import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { Queue } from 'bullmq';
import pool from './db';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { refineTranscription } from './refinement';
import path from 'path';
import { isAuthenticated, isResourceOwner, configureAuthRoutes, checkAdmin } from './auth';
import { AuthenticatedRequest } from './types/auth';
import fs from 'fs/promises';

dotenv.config();

const router = Router();

// Configure auth routes
configureAuthRoutes(router);
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
router.post('/upload', isAuthenticated, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    const file = req.file;
    console.log('Uploaded file:', file?.originalname);
    const jobId = uuidv4();
    const diarizationEnabled = req.body.diarization === 'true';

    // Save job in the database
    await pool.query(
        'INSERT INTO jobs (id, user_id, file_name, status, diarization_enabled, diarization_status) VALUES ($1, $2, $3, $4, $5, $6)',
        [jobId, req.user?.id, file?.originalname, 'queued', diarizationEnabled, diarizationEnabled ? 'pending' : null]
    );

    // Add job to the queue
    await transcriptionQueue.add('transcribe', {
        jobId,
        filePath: file?.path,
        fileName: file?.originalname,
        diarizationEnabled,
        userId: req.user?.id
    });
    console.log('Added job to queue:', jobId);
    res.json({ jobId });
});

router.delete('/jobs/:id', isAuthenticated, isResourceOwner, async (req, res) => {
    const jobId = req.params.id;

    try {
        // Get file path before deleting the job
        const result = await pool.query('SELECT file_name FROM jobs WHERE id = $1', [jobId]);
        const fileName = result.rows[0]?.file_name;

        // Delete from database
        await pool.query('DELETE FROM jobs WHERE id = $1', [jobId]);

        // Delete file from filesystem if it exists
        if (fileName) {
            const filePath = path.join('uploads', fileName);
            try {
                await fs.unlink(filePath);
            } catch (err) {
                console.error('Error deleting file:', err);
                // Continue even if file deletion fails
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
});

/**
 * @swagger
 * /jobs:
 *  get:
 *   summary: Get all jobs for authenticated user
 *  responses:
 *   200:
 *   description: Successfully retrieved jobs
 *  401:
 *   description: Unauthorized
 *  500:
 *   description: Failed to retrieve jobs
 */
router.get('/jobs', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    console.log('/api/jobs');
    const result = await pool.query(
        'SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC',
        [req.user?.id]
    );
    res.json(result.rows);
});

router.get('/config/transcription', isAuthenticated, async (req, res) => {
    console.log('/api/config/transcription');
    const result = await pool.query('SELECT * FROM transcription_config ORDER BY created_at DESC');
    res.json(result.rows[0]);
});

router.get('/config/refinement', async (req, res) => {
    console.log('/api/config/refinement');
    const result = await pool.query('SELECT * FROM refinement_config ORDER BY created_at DESC');
    res.json(result.rows[0]);
});


router.post('/config/transcription', async (req, res) => {
    console.log('/api/config/transcription POST', req.body);
    const { openai_api_url, openai_api_key, model_name, max_concurrent_jobs } = req.body;
    const result = await pool.query('UPDATE transcription_config SET openai_api_url = $1, openai_api_key = $2, model_name = $3, max_concurrent_jobs = $4', [openai_api_url, openai_api_key, model_name, max_concurrent_jobs]);
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
    console.log('/api/config/refinement POST', req.body);
    const { openai_api_url, openai_api_key, model_name, system_prompt } = req.body;
    const result = await pool.query('UPDATE refinement_config SET openai_api_url = $1, openai_api_key = $2, model_name = $3, system_prompt = $4', [openai_api_url, openai_api_key, model_name, system_prompt]);
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
router.get('/jobs/:id', isAuthenticated, isResourceOwner, async (req: AuthenticatedRequest, res: Response) => {
    const jobId = req.params.id;
    const result = await pool.query('SELECT * FROM jobs WHERE id = $1 AND user_id = $2', [jobId, req.user?.id]);
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
router.post('/jobs/:id/refine', isAuthenticated, isResourceOwner, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const jobId = req.params.id;
        const jobResult = await pool.query('SELECT transcript FROM jobs WHERE id = $1 AND user_id = $2', [jobId, req.user?.id]);
        const originalText = jobResult.rows[0]?.transcript;

        if (!originalText) {
            res.status(404).json({ error: 'Original transcription not found' });
            return;
        }

        const openaiConfig = await pool.query('SELECT * FROM refinement_config');
        const refinedText = await refineTranscription(originalText, openaiConfig.rows[0]);

        await pool.query(
            'UPDATE jobs SET refined_transcript = $1 WHERE id = $2 AND user_id = $3',
            [refinedText, jobId, req.user?.id]
        );

        res.json({ success: true, refinedText });
    } catch (error) {
        console.error('Transcription refinement failed:', error);
        res.status(500).json({ error: 'Transcription refinement failed' });
    }
});

// Admin stats route
router.get('/admin/stats', isAuthenticated, checkAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Query to get total number of jobs
        const totalJobsQuery = await pool.query('SELECT COUNT(*) FROM jobs');
        const totalJobs = parseInt(totalJobsQuery.rows[0].count, 10);

        // Query to get number of successful jobs (assuming 'success' is a status)
        const successfulJobsQuery = await pool.query("SELECT COUNT(*) FROM jobs WHERE status = 'success'");
        const successfulJobs = parseInt(successfulJobsQuery.rows[0].count, 10);

        // Query to get number of failed jobs (assuming 'failed' is a status)
        const failedJobsQuery = await pool.query("SELECT COUNT(*) FROM jobs WHERE status = 'failed'");
        const failedJobs = parseInt(failedJobsQuery.rows[0].count, 10);

        // Calculate success and error rates
        const successRate = totalJobs > 0 ? (successfulJobs / totalJobs) * 100 : 0;
        const errorRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;

        // Query to get average, min, and max timings (assuming `created_at` and `updated_at` are used for timings)
        const timingsQuery = await pool.query(`
            SELECT 
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) AS avg_duration,
                MIN(EXTRACT(EPOCH FROM (updated_at - created_at))) AS min_duration,
                MAX(EXTRACT(EPOCH FROM (updated_at - created_at))) AS max_duration
            FROM jobs
        `);
        const { avg_duration, min_duration, max_duration } = timingsQuery.rows[0];

        // Query to get file size information (assuming `file_url` can be used to infer file size)
        // Note: This is a placeholder, as file size is not directly stored in the database.
        // You might need to fetch this from your storage service (e.g., S3, GCS).
        const fileSizesQuery = await pool.query(`
            SELECT 
                AVG(LENGTH(file_url)) AS avg_file_size,
                MIN(LENGTH(file_url)) AS min_file_size,
                MAX(LENGTH(file_url)) AS max_file_size
            FROM jobs
        `);
        const { avg_file_size, min_file_size, max_file_size } = fileSizesQuery.rows[0];

        // Query to get error details (assuming `transcript` or `refined_transcript` contains error info)
        const errorsQuery = await pool.query(`
            SELECT transcript, refined_transcript
            FROM jobs
            WHERE status = 'failed'
        `);
        const errors = errorsQuery.rows;

        // Compile the stats
        const stats = {
            totalJobs,
            successfulJobs,
            failedJobs,
            successRate: successRate.toFixed(2) + '%',
            errorRate: errorRate.toFixed(2) + '%',
            timings: {
                avgDuration: parseFloat(avg_duration).toFixed(2) + ' seconds',
                minDuration: parseFloat(min_duration).toFixed(2) + ' seconds',
                maxDuration: parseFloat(max_duration).toFixed(2) + ' seconds',
            },
            fileSizes: {
                avgFileSize: parseFloat(avg_file_size).toFixed(2) + ' bytes',
                minFileSize: parseFloat(min_file_size).toFixed(2) + ' bytes',
                maxFileSize: parseFloat(max_file_size).toFixed(2) + ' bytes',
            },
            errors,
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

export { router };
