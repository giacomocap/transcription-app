import { Router, Response } from 'express';
import multer from 'multer';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { refineTranscription } from './refinement';
import { isAuthenticated, isResourceOwner, isAdmin, hasJobAccess } from './auth';
import { AuthenticatedRequest } from './types/auth';
import { generateURLSafeToken } from './helper/helper';
import { storageService } from './services/storage-service';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { access, mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { supabaseAdmin } from './utils/supabase';
import { createWriteStream, existsSync } from 'fs';
import { pipeline } from 'stream/promises';
import { creditTransactionService } from './services/credit-transaction-service';

dotenv.config();

const router = Router();

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
        await access(tempDir);
    } catch {
        await mkdir(tempDir);
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
// router.post('/upload', isAuthenticated, upload.single('file'), async (req: AuthenticatedRequest, res) => {
//     console.log(`File upload request received from user ${req.user?.id}`);
//     const file = req.file;
//     const jobId = uuidv4();
//     const diarizationEnabled = req.body.diarization === 'true';
//     const language = req.body.language !== 'auto' ? req.body.language : undefined;
//     const userId = req.user?.id;

//     if (!userId) {
//         res.status(400).json({ error: 'User not found' });
//         return;
//     }

//     if (!file) {
//         res.status(400).json({ error: 'No file uploaded' });
//         return;
//     }


//     try {
//         const tempDir = await ensureTempDir();
//         const tempFilePath = path.join(tempDir, `${jobId}${path.extname(file.originalname)}`);

//         // Save the uploaded file locally
//         await writeFile(tempFilePath, file.buffer);

//         let audioFilePath = tempFilePath;
//         let finalBuffer = file.buffer;

//         // Get audio duration using ffmpeg
//         const getDuration = (): Promise<number> => {
//             return new Promise((resolve, reject) => {
//                 ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
//                     if (err) reject(err);
//                     resolve(metadata.format.duration || 0);
//                 });
//             });
//         };

//         const durationInSeconds = await getDuration();
//         const durationInMinutes = Math.ceil(durationInSeconds / 60);
//         const requiredCredits = await calculateRequiredCredits(durationInMinutes, diarizationEnabled);

//         // Check if user has enough credits
//         const hasEnoughCredits = await checkAndReserveCredits(userId, requiredCredits);
//         if (!hasEnoughCredits) {
//             await unlink(tempFilePath);
//             res.status(402).json({ error: 'Insufficient credits' });
//             return;
//         }

//         // If it's a video file, extract the audio
//         if (ACCEPTED_MIME_TYPES.video.includes(file.mimetype)) {
//             try {
//                 audioFilePath = await extractAudioFromVideo(tempFilePath);
//                 finalBuffer = await readFile(audioFilePath);
//                 await unlink(tempFilePath);
//             } catch (error) {
//                 console.error('Error extracting audio:', error);
//                 await unlink(tempFilePath);
//                 throw new Error('Failed to extract audio from video');
//             }
//         }





//         // Upload file to B2
//         const fileKey = await storageService.uploadFile(finalBuffer, file.originalname, userId);

//         // await prisma.jobs.create({
//         //     data: {
//         //         id: jobId,
//         //         user_id: userId,
//         //         file_name: file.originalname,
//         //         file_url: fileKey,
//         //         status: 'queued',
//         //         diarization_enabled: diarizationEnabled,
//         //         diarization_status: diarizationEnabled ? 'pending' : null
//         //     }
//         // });

//         await supabaseAdmin.from('jobs').insert({
//             id: jobId,
//             user_id: userId,
//             file_name: file.originalname,
//             file_url: fileKey,
//             status: 'queued',
//             diarization_enabled: diarizationEnabled,
//             diarization_status: diarizationEnabled ? 'pending' : null,
//             credits_required: requiredCredits,
//             language: language
//         });

//         // Create credit transaction
//         const { data: transaction } = await supabaseAdmin
//             .from('credit_transactions')
//             .insert({
//                 user_id: userId,
//                 job_id: jobId,
//                 amount: -requiredCredits,
//                 type: diarizationEnabled ? 'transcription_with_diarization' : 'transcription',
//                 status: 'pending',
//                 description: `Transcription of ${file.originalname} (${durationInMinutes} minutes)`
//             })
//             .select()
//             .single();

//         await transcriptionQueue.add('transcribe', {
//             jobId,
//             audioFilePath,
//             fileName: file?.originalname,
//             diarizationEnabled,
//             userId: userId,
//             language
//         });

//         console.log(`Job ${jobId} created successfully for file ${file?.originalname}`);
//         res.json({ jobId });
//     } catch (error) {
//         console.error('Error creating job:', error);
//         res.status(500).json({ error: 'Failed to create job' });
//     }
// });

router.post('/upload/verify', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    const { durationInMinutes, diarizationEnabled, fileName, mimeType } = req.body;
    const userId = req.user?.id;
    console.log('upload verify', durationInMinutes, diarizationEnabled, fileName, mimeType, userId);

    if (!userId) {
        res.status(400).json({ error: 'User not found' });
        return;
    }

    try {
        // Validate file type
        const isAcceptedType = [...ACCEPTED_MIME_TYPES.audio, ...ACCEPTED_MIME_TYPES.video].includes(mimeType);
        if (!isAcceptedType) {
            res.status(400).json({
                error: 'Invalid file type. Only the following formats are accepted: ' +
                    'FLAC, MP3, MP4, MPEG, MPGA, M4A, OGG, WAV, WEBM for audio; and ' +
                    'MP4, WEBM, OGG, QuickTime, AVI, MKV, FLV, 3GP, 3G2, WMV, M4V, MPEG, DV, ASF for video.'
            });
            return;
        }

        const requiredCredits = await calculateRequiredCredits(durationInMinutes, diarizationEnabled);
        const hasEnoughCredits = await checkAndReserveCredits(userId, requiredCredits);

        if (!hasEnoughCredits) {
            console.log('Insufficient credits');
            res.status(402).json({ error: 'Insufficient credits' });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Credit verification failed:', error);
        res.status(500).json({ error: 'Credit verification failed' });
    }
});

router.post('/upload/start', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    const { fileName, diarization, language, singlePart } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        res.status(400).json({ error: 'User not found' });
        return;
    }

    try {
        const jobId = uuidv4();
        const key = `uploads/${userId}-${Date.now()}-${fileName}`;
        let responseData;
        if (singlePart) {
            // Get direct upload URL for single-part
            const { uploadUrl, authorizationToken } = await storageService.getDirectUploadUrl(key);
            responseData = { jobId, uploadUrl, authorizationToken, fileUrl: key };
        } else {

            // Get single upload URL and file ID for the entire multipart upload
            const { fileId, uploadUrl, authorizationToken } = await storageService.startMultipartUpload(key);
            responseData = { jobId, fileId, uploadUrl, authorizationToken };
        }

        // Create pending job record
        await supabaseAdmin.from('jobs').insert({
            id: jobId,
            user_id: userId,
            file_name: fileName,
            file_url: key,
            status: 'uploading',
            diarization_enabled: diarization || diarization === 'true',
            language: language !== 'auto' ? language : null
        });

        res.json(responseData);
    } catch (error) {
        console.error('Failed to start upload:', error);
        res.status(500).json({ error: 'Failed to start upload' });
    }
});

router.post('/upload/complete/:id', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    const jobId = req.params.id;
    const userId = req.user?.id;
    const { fileId, partSha1s, singlePart, mimeType } = req.body;
    console.log(`Completing upload for job ${jobId} by user ${userId}`);
    if (!jobId) {
        res.status(400).json({ error: 'Job not found' });
        return;
    }
    if (!userId) {
        res.status(400).json({ error: 'User not found' });
        return
    }

    try {
        if (!singlePart) {
            await storageService.completeMultipartUpload(fileId, partSha1s);
        }

        // Update job status
        await supabaseAdmin.from('jobs')
            .update({ status: 'queued' })
            .eq('id', jobId)

        // Get job details
        const { data: job } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (!job) {
            throw new Error('Job not found');
        }

        // Download file locally for processing
        const tempDir = await ensureTempDir();
        const tempFilePath = path.join(tempDir, `${jobId}${path.extname(job.file_name)}`);

        const fileStream = await storageService.getFileStream(job.file_url);
        const writeStream = createWriteStream(tempFilePath);
        await pipeline(fileStream, writeStream);

        let audioFilePath = tempFilePath;
        let finalFileUrl = job.file_url;

        // Check if it's a video file and convert to audio if needed
        const isVideo = ACCEPTED_MIME_TYPES.video.includes(mimeType);

        if (isVideo) {
            try {
                audioFilePath = await extractAudioFromVideo(tempFilePath);
                // Upload the converted audio file
                const audioBuffer = await readFile(audioFilePath);
                const audioFileName = path.basename(audioFilePath);
                finalFileUrl = await storageService.uploadFile(audioBuffer, audioFileName, userId);

                // Update the job with the new audio file URL
                await supabaseAdmin.from('jobs')
                    .update({ file_url: finalFileUrl })
                    .eq('id', jobId);

                // Clean up original video file from storage
                await storageService.deleteFile(job.file_url);

                // Clean up temporary files if file exists in fs
                if (existsSync(tempFilePath)) {
                    await unlink(tempFilePath);
                }
            } catch (error) {
                console.error('Error processing video:', error);
                await unlink(tempFilePath);
                throw new Error('Failed to process video file');
            }
        }

        // Get duration using ffmpeg
        const getDuration = (): Promise<number> => {
            return new Promise((resolve, reject) => {
                ffmpeg.ffprobe(audioFilePath, (err, metadata) => {
                    if (err) reject(err);
                    resolve(metadata.format.duration || 0);
                });
            });
        };

        const durationInSeconds = await getDuration();
        const durationInMinutes = Math.ceil(durationInSeconds / 60);

        const requiredCredits = await calculateRequiredCredits(durationInMinutes, job.diarization_enabled);
        const hasEnoughCredits = await checkAndReserveCredits(userId, requiredCredits);

        if (!hasEnoughCredits) {
            await unlink(tempFilePath);
            res.status(402).json({ error: 'Insufficient credits' });
            return;
        }

        // Create credit transaction using the service
        await creditTransactionService.createTranscriptionTransaction(
            userId,
            jobId,
            requiredCredits,
            job.file_name,
            durationInMinutes,
            job.diarization_enabled
        );

        // Add to transcription queue
        await transcriptionQueue.add('transcribe', {
            jobId,
            audioFilePath: audioFilePath,
            fileName: job.file_name,
            diarizationEnabled: job.diarization_enabled,
            userId,
            language: job.language
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to complete upload:', error);
        res.status(500).json({ error: 'Failed to complete upload' });
    }
});

router.delete('/jobs/:id', isAuthenticated, isResourceOwner, async (req, res) => {
    console.log(`Deleting job ${req.params.id}`);
    const jobId = req.params.id;

    try {
        const { data: job } = await supabaseAdmin.from('jobs').select('file_url').eq('id', jobId).single();

        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        const { error } = await supabaseAdmin.from('jobs').delete().eq('id', jobId);

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
        const { data: jobs } = await supabaseAdmin.from('jobs').select('*').eq('user_id', req.user?.id).order('created_at', { ascending: false });
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

        const { data: job } = await supabaseAdmin.from('jobs').select('transcript').eq('id', jobId).eq('user_id', req.user?.id).single();

        if (!job?.transcript) {
            res.status(404).json({ error: 'Original transcription not found' });
            return;
        }

        const { data: config } = await supabaseAdmin.from('refinement_config').select('*').single();

        if (!config) {
            res.status(500).json({ error: 'Refinement config not found' });
            return;
        }

        const refinedText = await refineTranscription(job.transcript, config);

        await supabaseAdmin.from('jobs').update({ refined_transcript: refinedText }).eq('id', jobId).single();

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

        const { data: job } = await supabaseAdmin.from('jobs').select('refinement_pending, subtitle_content, transcript, speaker_segments, language').eq('id', jobId).eq('user_id', req.user?.id).single();

        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        const updateData: any = { refinement_pending: false };
        if (file_name) updateData.file_name = file_name;
        if (speaker_profiles) updateData.speaker_profiles = speaker_profiles;
        if (speaker_segments) updateData.speaker_segments = speaker_segments;

        await supabaseAdmin.from('jobs').update(updateData).eq('id', jobId).single();

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
                fullText: job.transcript,
                language: job.language
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

        const { data: job } = await supabaseAdmin.from('jobs').select('file_url').eq('id', jobId).single();
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
        const { data: job } = await supabaseAdmin
            .from('jobs')
            .select(`id,
            user_id,
            job_shares(*)`)
            .eq('id', jobId)
            .single();


        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return
        }

        const publicShare = job.job_shares.find(share =>
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
    console.log(`Fetching job ${jobId} for user ${req.user?.id}`);
    try {
        const { data: job } = await supabaseAdmin
            .from('jobs')
            .select(`
                *,
                job_shares!left(*)
            `)
            .eq('id', jobId)
            .single();

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

router.get('/config/transcription', isAuthenticated, isAdmin, async (req, res) => {
    console.log('Fetching transcription config');
    try {
        const { data: config } = await supabaseAdmin
            .from('transcription_config')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        res.json(config);
    } catch (error) {
        console.error('Error fetching transcription config:', error);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

router.get('/config/refinement', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { data: config } = await supabaseAdmin
            .from('refinement_config')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        res.json(config);
    } catch (error) {
        console.error('Error fetching refinement config:', error);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

router.post('/config/transcription', isAuthenticated, isAdmin, async (req, res) => {
    console.log('Updating transcription config');
    const { openai_api_url, openai_api_key, model_name, max_concurrent_jobs } = req.body;

    try {
        const { data: config } = await supabaseAdmin
            .from('transcription_config')
            .update({
                openai_api_url,
                openai_api_key,
                model_name,
                max_concurrent_jobs
            })
            .neq('id', 0) // Update all records
            .select();
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
router.post('/config/refinement', isAuthenticated, isAdmin, async (req, res) => {
    const { openai_api_url, openai_api_key, model_name, system_prompt } = req.body;

    try {
        const { data: config } = await supabaseAdmin
            .from('refinement_config')
            .update({
                openai_api_url,
                openai_api_key,
                model_name,
                system_prompt
            })
            .neq('id', 0) // Update all records
            .select();
        res.json(config);
    } catch (error) {
        console.error('Error updating refinement config:', error);
        res.status(500).json({ error: 'Failed to update config' });
    }
});


router.get('/admin/stats', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    console.log('Fetching admin statistics');
    try {
        const { data: jobStats } = await supabaseAdmin
            .from('jobs')
            .select('status, transcription_progress');

        const { data: userStats } = await supabaseAdmin
            .from('users')
            .select('created_at');

        // Calculate job statistics
        const totalJobs = jobStats?.length || 0;
        const successfulJobs = jobStats?.filter(job => job.status === 'transcribed').length || 0;
        const failedJobs = jobStats?.filter(job => job.status === 'failed').length || 0;

        // Calculate timing statistics
        const progressValues = jobStats?.map(job => job.transcription_progress).filter(Boolean) || [];
        const avgDuration = progressValues.length ?
            (progressValues.reduce((a, b) => (a || 0) + (b || 0), 0) / progressValues.length).toFixed(2) : '0';
        const minDuration = Math.min(...progressValues, 0).toFixed(2);
        const maxDuration = Math.max(...progressValues, 0).toFixed(2);

        // Calculate user statistics
        const totalUsers = userStats?.length || 0;
        const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
        const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));

        const newUsersLast7Days = userStats?.filter(user =>
            new Date(user.created_at) >= sevenDaysAgo
        ).length || 0;

        const newUsersLast30Days = userStats?.filter(user =>
            new Date(user.created_at) >= thirtyDaysAgo
        ).length || 0;

        const successRate = totalJobs > 0 ? (successfulJobs / totalJobs) * 100 : 0;
        const errorRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;

        res.json({
            totalJobs,
            successfulJobs,
            failedJobs,
            successRate: successRate.toFixed(2) + '%',
            errorRate: errorRate.toFixed(2) + '%',
            timings: {
                avgDuration,
                minDuration,
                maxDuration
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
        const { data: share } = await supabaseAdmin
            .from('job_shares')
            .insert({
                id: uuidv4(),
                job_id: jobId,
                type,
                email,
                token,
                created_by: userId!,
                status: 'pending'
            })
            .select()
            .single();

        res.json(share);
    } catch (error) {
        console.error('Error creating share:', error);
        res.status(500).json({ error: 'Failed to create share' });
    }
});

router.get('/jobs/:id/shares', isAuthenticated, isResourceOwner, async (req: AuthenticatedRequest, res) => {
    console.log(`Fetching shares for job ${req.params.id}`);
    const jobId = req.params.id;

    try {
        const { data: shares } = await supabaseAdmin
            .from('job_shares')
            .select('*')
            .eq('job_id', jobId);

        res.json(shares);
    } catch (error) {
        console.error('Error fetching shares:', error);
        res.status(500).json({ error: 'Failed to fetch shares' });
    }
});

router.delete('/jobs/:id/shares/:shareId', isAuthenticated, isResourceOwner, async (req: AuthenticatedRequest, res) => {
    console.log(`Deleting share ${req.params.shareId} for job ${req.params.id}`);
    const { id: jobId, shareId } = req.params;

    try {
        await supabaseAdmin
            .from('job_shares')
            .delete()
            .eq('id', shareId)
            .eq('job_id', jobId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting share:', error);
        res.status(500).json({ error: 'Failed to delete share' });
    }
});

// User Settings Routes
router.get('/user/settings', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    console.log(`Fetching settings for user ${req.user?.id}`);
    try {
        const { data: settings } = await supabaseAdmin
            .from('user_settings')
            .select('*')
            .eq('user_id', req.user?.id)
            .single();

        // if (!settings) {
        //     res.status(404).json({ error: 'Settings not found' });
        //     return;
        // }

        res.json(settings);
    } catch (error) {
        console.error('Error fetching user settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.put('/user/settings', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    console.log(`Updating settings for user ${req.user?.id}`);
    const userId = req.user?.id;
    const settings = req.body;

    try {
        const { data: updatedSettings, error } = await supabaseAdmin
            .from('user_settings')
            .upsert({
                user_id: userId,
                ...settings
            })
            .select()
            .single();

        if (error) throw error;

        res.json(updatedSettings);
    } catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Delete user account
router.delete('/user/delete', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(400).json({ error: 'User not found' });
        return;
    }

    try {
        // 1. Delete user's files from storage
        const { data: jobs } = await supabaseAdmin
            .from('jobs')
            .select('id, file_url')
            .eq('user_id', userId);

        if (jobs) {
            await Promise.all(jobs.map(async (job) => {
                if (job.file_url) {
                    try {
                        await storageService.deleteFile(job.file_url);
                    } catch (err) {
                        console.error(`Error deleting file for job ${job.id}:`, err);
                    }
                }
            }));
        }

        // 2. Delete all user data in a transaction (via stored procedure)
        const { error: deleteDataError } = await supabaseAdmin.rpc('delete_user_data', { p_user_id: userId });
        if (deleteDataError) throw deleteDataError;

        // 3. Delete auth user
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteUserError) throw deleteUserError;

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user account:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

async function calculateRequiredCredits(durationInMinutes: number, diarizationEnabled: boolean): Promise<number> {
    const baseCredits = Math.floor(durationInMinutes);
    return diarizationEnabled ? Math.floor(durationInMinutes * 1.5) : baseCredits;
}

async function checkAndReserveCredits(userId: string, credits: number): Promise<boolean> {
    const { data: userCredits } = await supabaseAdmin
        .from('user_credits')
        .select('credits_balance')
        .eq('user_id', userId)
        .single();

    if (!userCredits || userCredits.credits_balance < credits) {
        return false;
    }

    return true;
}

// Add credit management endpoints
router.get('/credits/balance', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
        const { data: credits } = await supabaseAdmin
            .from('user_credits')
            .select('credits_balance')
            .eq('user_id', req.user?.id)
            .single();

        res.json({ balance: credits?.credits_balance || 0 });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch credit balance' });
    }
});

router.get('/credits/history', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
        const { data: transactions } = await supabaseAdmin
            .from('credit_transactions')
            .select('*')
            .eq('user_id', req.user?.id)
            .order('created_at', { ascending: false });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch credit history' });
    }
});

// Add these new endpoints
router.get('/admin/credits/usage', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const { start_date, end_date } = req.query;
        let query = supabaseAdmin
            .from('credit_transactions')
            .select(`
                *,
                jobs(file_name)
            `)
            .order('created_at', { ascending: false });

        if (start_date && end_date) {
            query = query.gte('created_at', start_date).lte('created_at', end_date);
        }

        const { data: transactions } = await query;

        const usageStats = {
            total_credits_used: 0,
            transcription_credits: 0,
            diarization_credits: 0,
            transactions_by_day: {} as Record<string, number>,
            users_by_usage: {}
        };

        transactions?.forEach(transaction => {
            if (transaction.status === 'completed' && transaction.amount < 0) {
                usageStats.total_credits_used += Math.abs(transaction.amount);

                if (transaction.type === 'transcription') {
                    usageStats.transcription_credits += Math.abs(transaction.amount);
                } else if (transaction.type === 'transcription_with_diarization') {
                    usageStats.diarization_credits += Math.abs(transaction.amount);
                }

                // Group by day
                const date = new Date(transaction.created_at).toISOString().split('T')[0];
                usageStats.transactions_by_day[date] = (usageStats.transactions_by_day[date] || 0) + Math.abs(transaction.amount);

                // Group by useì
                //                 usageStats.users_by_usage[transaction.user_id] = (usageStats.users_by_usage[transaction.user_id] || 0) + Math.abs(transaction.amount);
            }
        });

        res.json(usageStats);
    } catch (error) {
        console.error('Error fetching credit usage:', error);
        res.status(500).json({ error: 'Failed to fetch credit usage' });
    }
});

router.post('/admin/credits/adjust', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res) => {
    const { user_id, amount, description } = req.body;

    try {
        const { data: currentBalance } = await supabaseAdmin
            .from('user_credits')
            .select('credits_balance')
            .eq('user_id', user_id)
            .single();

        // Create transaction first
        const { data: transaction } = await supabaseAdmin
            .from('credit_transactions')
            .insert({
                user_id,
                amount,
                type: amount > 0 ? 'admin_credit' : 'admin_debit',
                status: 'completed',
                description: description || `Admin ${amount > 0 ? 'credit' : 'debit'} adjustment`
            })
            .select()
            .single();

        // // Update user's credit balance
        // await supabaseAdmin
        //     .from('user_credits')
        //     .update({
        //         credits_balance: (currentBalance?.credits_balance || 0) + amount
        //     })
        //     .eq('user_id', user_id);

        res.json({ success: true, transaction });
    } catch (error) {
        console.error('Error adjusting credits:', error);
        res.status(500).json({ error: 'Failed to adjust credits' });
    }
});

// Get all users with their credit balances
router.get('/admin/users/credits', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const { data: users, error } = await supabaseAdmin
            .from('user_credits')
            .select(`
                *,
                users(email)
            `);

        res.json(users);
    } catch (error) {
        console.error('Error fetching user credits:', error);
        res.status(500).json({ error: 'Failed to fetch user credits' });
    }
});

export { router };
