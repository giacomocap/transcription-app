import { Router, Response } from 'express';
import multer from 'multer';
import { Queue } from 'bullmq';
import prisma from './db';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { refineTranscription } from './refinement';
import { isAuthenticated, isResourceOwner, configureAuthRoutes, checkAdmin, hasJobAccess } from './auth';
import { AuthenticatedRequest } from './types/auth';
import { generateURLSafeToken } from './helper/helper';
import { storageService } from './services/storage-service';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';

dotenv.config();

const router = Router();

// Configure auth routes
configureAuthRoutes(router);

const ACCEPTED_MIME_TYPES = {
    audio: [
        'audio/mpeg', // MP3
        'audio/wav',  // WAV
        'audio/ogg',  // OGG
        'audio/x-m4a', // M4A
        'audio/mp3',  // MP3 (alternative)
        'audio/flac', // FLAC
        'audio/mp4',  // MP4 (audio)
        'audio/mpeg', // MPEG
        'audio/mpga', // MPGA
        'audio/webm'  // WEBM (audio)
    ],
    video: [
        'video/mp4',      // MP4
        'video/webm',     // WEBM
        'video/ogg',      // OGG
        'video/quicktime', // QuickTime
        'video/x-msvideo', // AVI
        'video/x-matroska', // MKV
        'video/x-flv',    // FLV
        'video/3gpp',     // 3GP
        'video/3gpp2',    // 3G2
        'video/x-ms-wmv', // WMV
        'video/x-m4v',    // M4V
        'video/x-mpeg',   // MPEG
        'video/x-dv',     // DV
        'video/x-ms-asf'  // ASF
        // Add more video formats if needed
    ]
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const isAcceptedType = [...ACCEPTED_MIME_TYPES.audio, ...ACCEPTED_MIME_TYPES.video].includes(file.mimetype);
        if (!isAcceptedType) {
            cb(new Error('Invalid file type. Only the following audio and video formats are accepted: ' +
                'FLAC, MP3, MP4, MPEG, MPGA, M4A, OGG, WAV, WEBM for audio; and MP4, WEBM, OGG, QuickTime, AVI, MKV, FLV, 3GP, 3G2, WMV, M4V, MPEG, DV, ASF for video.'));
            return;
        }
        cb(null, true);
    }
});
// Helper function to extract audio from video
const extractAudioFromVideo = async (inputPath: string): Promise<string> => {
    const outputPath = inputPath.replace(path.extname(inputPath), '.mp3');

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat('mp3')
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err))
            .save(outputPath);
    });
};

// Helper function to ensure temp directory exists
const ensureTempDir = async () => {
    const tempDir = path.join(process.cwd(), 'uploads');
    try {
        await fs.access(tempDir);
    } catch {
        await fs.mkdir(tempDir);
    }
    return tempDir;
};

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
    console.log(`File upload request received from user ${req.user?.id}`);
    const file = req.file;
    const jobId = uuidv4();
    const diarizationEnabled = req.body.diarization === 'true';
    const language = req.body.language;
    const userId = req.user?.id;

    if (!userId) {
        res.status(400).json({ error: 'User not found' });
        return;
    }

    if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }

    try {
        const tempDir = await ensureTempDir();
        const tempFilePath = path.join(tempDir, `${jobId}${path.extname(file.originalname)}`);

        // Save the uploaded file locally
        await fs.writeFile(tempFilePath, file.buffer);

        let audioFilePath = tempFilePath;
        let finalBuffer = file.buffer;

        // If it's a video file, extract the audio
        if (ACCEPTED_MIME_TYPES.video.includes(file.mimetype)) {
            try {
                audioFilePath = await extractAudioFromVideo(tempFilePath);
                finalBuffer = await fs.readFile(audioFilePath);
            } catch (error) {
                console.error('Error extracting audio:', error);
                throw new Error('Failed to extract audio from video');
            }
        }

        // Upload file to B2
        const fileKey = await storageService.uploadFile(finalBuffer, file.originalname, userId);

        await prisma.jobs.create({
            data: {
                id: jobId,
                user_id: userId,
                file_name: file.originalname,
                file_url: fileKey,
                status: 'queued',
                diarization_enabled: diarizationEnabled,
                diarization_status: diarizationEnabled ? 'pending' : null
            }
        });

        await transcriptionQueue.add('transcribe', {
            jobId,
            audioFilePath,
            fileName: file?.originalname,
            diarizationEnabled,
            userId: userId,
            language
        });

        console.log(`Job ${jobId} created successfully for file ${file?.originalname}`);
        res.json({ jobId });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ error: 'Failed to create job' });
    }
});

router.delete('/jobs/:id', isAuthenticated, isResourceOwner, async (req, res) => {
    console.log(`Deleting job ${req.params.id}`);
    const jobId = req.params.id;

    try {
        const job = await prisma.jobs.findUnique({
            select: { file_url: true },
            where: { id: jobId }
        });

        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        await prisma.jobs.delete({
            where: { id: jobId }
        });

        if (job.file_url) {
            try {
                await storageService.deleteFile(job.file_url);
            } catch (err) {
                console.error('Error deleting file from storage:', err);
            }
        }

        console.log(`Job ${req.params.id} and associated files deleted successfully`);
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
    console.log(`Fetching jobs for user ${req.user?.id}`);
    try {
        const jobs = await prisma.jobs.findMany({
            where: { user_id: req.user?.id },
            orderBy: { created_at: 'desc' }
        });
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
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
    console.log(`Starting refinement for job ${req.params.id}`);
    const jobId = req.params.id;

    try {
        const job = await prisma.jobs.findUnique({
            select: { transcript: true },
            where: {
                id: jobId,
                user_id: req.user?.id
            }
        });

        if (!job?.transcript) {
            res.status(404).json({ error: 'Original transcription not found' });
            return;
        }

        const config = await prisma.refinement_config.findFirst();
        if (!config) {
            res.status(500).json({ error: 'Refinement config not found' });
            return;
        }

        const refinedText = await refineTranscription(job.transcript, config);

        await prisma.jobs.update({
            where: { id: jobId },
            data: { refined_transcript: refinedText }
        });

        console.log(`Refinement completed for job ${req.params.id}`);
        res.json({ success: true, refinedText });
    } catch (error) {
        console.error('Error refining transcription:', error);
        res.status(500).json({ error: 'Failed to refine transcription' });
    }
});

/**
 * @swagger
 * /jobs/{id}/update:
 *   patch:
 *     summary: Update specific fields of a job
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The job ID
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             file_name:
 *               type: string
 *             speaker_profiles:
 *               type: array
 *               items:
 *                 type: object
 *             speaker_segments:
 *               type: array
 *               items:
 *                 type: object
 *     responses:
 *       200:
 *         description: Successfully updated job
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Job not found
 *       500:
 *         description: Failed to update job
 */
router.patch('/jobs/:id/update', isAuthenticated, isResourceOwner, async (req: AuthenticatedRequest, res: Response) => {
    console.log(`Updating job ${req.params.id}`, { updatedFields: Object.keys(req.body) });
    const jobId = req.params.id;
    const { file_name, speaker_profiles, speaker_segments } = req.body;

    if (!file_name && !speaker_profiles && !speaker_segments) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }

    try {
        const job = await prisma.jobs.findUnique({
            select: { refinement_pending: true, subtitle_content: true, transcript: true, speaker_segments: true },
            where: {
                id: jobId,
                user_id: req.user?.id
            }
        });

        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        const updateData: any = { refinement_pending: false };
        if (file_name) updateData.file_name = file_name;
        if (speaker_profiles) updateData.speaker_profiles = speaker_profiles;
        if (speaker_segments) updateData.speaker_segments = speaker_segments;

        await prisma.jobs.update({
            where: { id: jobId },
            data: updateData
        });

        if (job.refinement_pending) {
            const refinementQueue = new Queue('refinementQueue', { connection: redisOptions });

            // Combine transcript segments with speaker segments
            const combineTranscriptAndSpeakers = (transcriptSegments: any[], speakerSegments: any[]): any[] => {
                let diarizationIndex = 0;
                return transcriptSegments.map(segment => {
                    while (diarizationIndex < speakerSegments.length &&
                        speakerSegments[diarizationIndex].end <= segment.start) {
                        diarizationIndex++;
                    }

                    if (diarizationIndex < speakerSegments.length &&
                        speakerSegments[diarizationIndex].start <= segment.end) {
                        return {
                            ...segment,
                            text: `[${speakerSegments[diarizationIndex].speaker}]: ${segment.text}`
                        };
                    }
                    return segment;
                });
            };

            const parseSRT = (srtContent: string): any[] => {
                const segments: any[] = [];
                const blocks = srtContent.trim().split('\n\n');
                blocks.forEach(block => {
                    const lines = block.split('\n');
                    if (lines.length >= 3) {
                        const index = parseInt(lines[0]);
                        const [startTime, endTime] = lines[1].split(' --> ').map(timeStr => {
                            const [h, m, s] = timeStr.split(':');
                            const [seconds, ms] = s.split(',');
                            return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(seconds) + parseInt(ms) / 1000;
                        });
                        const text = lines.slice(2).join('\n');
                        segments.push({ index, start: startTime, end: endTime, text });
                    }
                });
                return segments;
            };

            const transcriptSegments = parseSRT(job.subtitle_content || '');
            const speakerSegments = speaker_segments || job.speaker_segments || [];

            const combinedSegments = combineTranscriptAndSpeakers(transcriptSegments, speakerSegments);

            await refinementQueue.add('refine', {
                jobId,
                segments: combinedSegments,
                fullText: job.transcript
            });
        }

        console.log(`Job ${req.params.id} updated successfully`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'Failed to update job' });
    }
});

router.get('/jobs/:id/presignedaudio', hasJobAccess, async (req: AuthenticatedRequest, res: Response) => {
    const jobId = req.params.id;
    try {
        // Check cache first
        const cacheKey = `presigned_url:${jobId}`;
        const cachedUrl = await (await transcriptionQueue.client).get(cacheKey);

        if (cachedUrl) {
            res.json({ url: cachedUrl });
            return;
        }

        const job = await prisma.jobs.findUnique({
            select: { file_url: true },
            where: { id: jobId },
        });
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        const url = await storageService.getPresignedUrl(job.file_url!);

        // Cache the URL for 1 hour
        await (await transcriptionQueue.client).set(cacheKey, url, 'EX', 3600);

        res.json({ url });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate URL' });
    }
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
// Validate share token
router.get('/jobs/:id/validate-token', async (req: AuthenticatedRequest, res: Response) => {
    const jobId = req.params.id;
    const token = req.query.token as string;

    if (!token) {
        res.status(400).json({ error: 'Token is required' });
        return;
    }

    try {
        const job = await prisma.jobs.findUnique({
            where: { id: jobId },
            include: { shares: true }
        });

        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return
        }

        const publicShare = job.shares.find(share =>
            share.type === 'public' &&
            share.token === token
        );

        if (publicShare) {
            res.json({ valid: true });
            return;
        }

        res.status(403).json({ error: 'Invalid token' });
    } catch (error) {
        console.error('Error validating token:', error);
        res.status(500).json({ error: 'Failed to validate token' });
    }
});

router.get('/jobs/:id', hasJobAccess, async (req: AuthenticatedRequest, res: Response) => {
    const jobId = req.params.id;

    try {
        const job = await prisma.jobs.findUnique({
            where: { id: jobId },
            include: { shares: true }
        });

        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        res.json(job);
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ error: 'Failed to fetch job' });
    }
});

router.get('/config/transcription', isAuthenticated, checkAdmin, async (req, res) => {
    console.log('Fetching transcription config');
    try {
        const config = await prisma.transcription_config.findFirst({
            orderBy: { created_at: 'desc' }
        });
        res.json(config);
    } catch (error) {
        console.error('Error fetching transcription config:', error);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

router.get('/config/refinement', isAuthenticated, checkAdmin, async (req, res) => {
    try {
        const config = await prisma.refinement_config.findFirst({
            orderBy: { created_at: 'desc' }
        });
        res.json(config);
    } catch (error) {
        console.error('Error fetching refinement config:', error);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

router.post('/config/transcription', isAuthenticated, checkAdmin, async (req, res) => {
    console.log('Updating transcription config');
    const { openai_api_url, openai_api_key, model_name, max_concurrent_jobs } = req.body;

    try {
        const config = await prisma.transcription_config.updateMany({
            data: {
                openai_api_url,
                openai_api_key,
                model_name,
                max_concurrent_jobs
            }
        });
        res.json(config);
    } catch (error) {
        console.error('Error updating transcription config:', error);
        res.status(500).json({ error: 'Failed to update config' });
    }
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
router.post('/config/refinement', isAuthenticated, checkAdmin, async (req, res) => {
    const { openai_api_url, openai_api_key, model_name, system_prompt } = req.body;

    try {
        const config = await prisma.refinement_config.updateMany({
            data: {
                openai_api_url,
                openai_api_key,
                model_name,
                system_prompt
            }
        });
        res.json(config);
    } catch (error) {
        console.error('Error updating refinement config:', error);
        res.status(500).json({ error: 'Failed to update config' });
    }
});



router.get('/admin/stats', isAuthenticated, checkAdmin, async (req: AuthenticatedRequest, res: Response) => {
    console.log('Fetching admin statistics');
    try {
        const stats = await prisma.$transaction([
            prisma.jobs.count(),
            prisma.jobs.count({ where: { status: 'transcribed' } }),
            prisma.jobs.count({ where: { status: 'failed' } }),
            prisma.jobs.aggregate({
                _avg: {
                    transcription_progress: true
                },
                _min: {
                    transcription_progress: true
                },
                _max: {
                    transcription_progress: true
                }
            }),
            prisma.users.count(),
            prisma.users.count({
                where: {
                    created_at: {
                        gte: new Date(new Date().setDate(new Date().getDate() - 7))
                    }
                }
            }),
            prisma.users.count({
                where: {
                    created_at: {
                        gte: new Date(new Date().setDate(new Date().getDate() - 30))
                    }
                }
            })
        ]);

        const [totalJobs, successfulJobs, failedJobs, timings, totalUsers, newUsersLast7Days, newUsersLast30Days] = stats;

        const successRate = totalJobs > 0 ? (successfulJobs / totalJobs) * 100 : 0;
        const errorRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;

        res.json({
            totalJobs,
            successfulJobs,
            failedJobs,
            successRate: successRate.toFixed(2) + '%',
            errorRate: errorRate.toFixed(2) + '%',
            timings: {
                avgDuration: timings._avg.transcription_progress?.toFixed(2) || '0',
                minDuration: timings._min.transcription_progress?.toFixed(2) || '0',
                maxDuration: timings._max.transcription_progress?.toFixed(2) || '0'
            },
            usersStats: {
                totalUsers,
                newUsersLast7Days,
                newUsersLast30Days
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Share management endpoints
router.post('/jobs/:id/shares', isAuthenticated, isResourceOwner, async (req: AuthenticatedRequest, res) => {
    console.log(`Creating share for job ${req.params.id} by user ${req.user?.id}`);
    const jobId = req.params.id;
    const userId = req.user?.id;
    const { type, email } = req.body;
    const token = generateURLSafeToken();

    try {
        // Create share record
        const share = await prisma.job_shares.create({
            data: {
                id: uuidv4(),
                job_id: jobId,
                type,
                email,
                token,
                created_by: userId!,
                status: 'pending'
            }
        });

        res.json(share);
    } catch (error) {
        console.error('Error creating share:', error);
        res.status(500).json({ error: 'Failed to create share' });
    }
});

router.get('/jobs/:id/shares', isAuthenticated, isResourceOwner, async (req: AuthenticatedRequest, res) => {
    console.log(`Fetching shares for job ${req.params.id}`);
    const jobId = req.params.id;
    const userId = req.user?.id;

    try {

        // Get all shares for this job
        const shares = await prisma.job_shares.findMany({
            where: { job_id: jobId }
        });

        res.json(shares);
    } catch (error) {
        console.error('Error fetching shares:', error);
        res.status(500).json({ error: 'Failed to fetch shares' });
    }
});

router.delete('/jobs/:id/shares/:shareId', isAuthenticated, isResourceOwner, async (req: AuthenticatedRequest, res) => {
    console.log(`Deleting share ${req.params.shareId} for job ${req.params.id}`);
    const { id: jobId, shareId } = req.params;
    const userId = req.user?.id;

    try {
        // Delete the share
        await prisma.job_shares.delete({
            where: { id: shareId, job_id: jobId }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting share:', error);
        res.status(500).json({ error: 'Failed to delete share' });
    }
});


export { router };
