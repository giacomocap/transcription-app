import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const SUPPORTED_FORMATS = [
    '.mp4', '.avi', '.mov', '.wav', '.m4a', '.aac',
    '.wma', '.ogg', '.flac', '.mkv', '.webm', '.amr', '.3gp'
];

export async function convertToOpus(inputFile: string): Promise<string> {
    const filename = path.basename(inputFile, path.extname(inputFile));
    const outputFile = path.join(__dirname, '../uploads', `${filename}.opus`);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-i', inputFile,
            // Audio preprocessing filters
            '-af', 'highpass=f=50,lowpass=f=8000,volume=2,afftdn=nf=-20',  // Noise reduction and audio enhancement
            '-c:a', 'libopus',
            '-ac', '1',             // Mono
            '-ar', '24000',         // Higher sample rate for better quality
            '-b:a', '24k',          // Higher bitrate for better quality
            '-vbr', 'on',           // Variable bitrate
            '-compression_level', '8', // Slightly lower compression for better quality
            '-application', 'audio', // Changed to audio mode for better quality
            outputFile
        ]);

        ffmpeg.stderr.on('data', (data) => {
            console.log(`FFmpeg: ${data}`);
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve(outputFile);
            } else {
                reject(new Error(`FFmpeg process exited with code ${code}`));
            }
        });

        ffmpeg.on('error', (err) => {
            reject(err);
        });
    });
}

export async function processFile(filePath: string): Promise<void> {
    const ext = path.extname(filePath).toLowerCase();

    if (SUPPORTED_FORMATS.includes(ext)) {
        try {
            console.log(`Converting ${filePath} to Opus...`);
            const outputFile = await convertToOpus(filePath);
            console.log(`Successfully converted to: ${outputFile}`);
        } catch (error) {
            console.error(`Error converting ${filePath}:`, error);
        }
    }
}

// Example usage:
// processFile('/path/to/your/audio/file.mp4');
