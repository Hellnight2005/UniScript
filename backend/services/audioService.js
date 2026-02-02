const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// Try/Catch for ffprobe in case install failed or is pending
let ffprobePath;
try {
    ffprobePath = require('@ffprobe-installer/ffprobe').path;
    ffmpeg.setFfprobePath(ffprobePath);
} catch (e) {
    console.warn("⚠️ ffprobe not found. Duration estimation may fail.");
}

ffmpeg.setFfmpegPath(ffmpegPath);

const path = require('path');
const fs = require('fs');

const PROCESSED_DIR = 'processed/';

if (!fs.existsSync(PROCESSED_DIR)) {
    fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

/**
 * Gets duration of a media file in seconds.
 * @param {string} filePath 
 * @returns {Promise<number>} Duration in seconds
 */
const getDuration = (filePath) => {
    return new Promise((resolve, reject) => {
        if (!ffprobePath) return resolve(0); // Fallback if no ffprobe

        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration || 0);
        });
    });
};

/**
 * Extracts audio from a video file.
 * @param {string} videoPath - Path to the source video file.
 * @returns {Promise<string>} - Path to the extracted audio file.
 */
const extractAudio = (videoPath) => {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(videoPath, path.extname(videoPath));
        // Whisper prefers 16kHz mono WAV
        const audioPath = path.join(PROCESSED_DIR, `${fileName}.wav`);

        console.log(`Starting audio extraction for: ${videoPath}`);

        ffmpeg(videoPath)
            .toFormat('wav')
            .audioFrequency(16000)
            .audioChannels(1)
            .on('end', () => {
                console.log(`Audio extracted successfully: ${audioPath}`);
                resolve(audioPath);
            })
            .on('error', (err) => {
                console.error('Error extracting audio:', err);
                reject(err);
            })
            .save(audioPath);
    });
};

/**
 * Splits audio into chunks suitable for ASR (e.g., < 25MB).
 * Uses ffmpeg segment muxer to split by time (e.g., every 10 minutes) as a proxy for size.
 * @param {string} audioPath 
 * @returns {Promise<string[]>} Array of paths to split files.
 */
const splitAudio = (audioPath) => {
    return new Promise((resolve, reject) => {
        const stats = fs.statSync(audioPath);
        const fileSizeInBytes = stats.size;
        const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

        // OpenAI limit is 25MB. If smaller, return original.
        if (fileSizeInMB < 24) {
            console.log(`Audio file size (${fileSizeInMB.toFixed(2)}MB) is within limits.`);
            return resolve([audioPath]);
        }

        console.log(`Audio file size (${fileSizeInMB.toFixed(2)}MB) exceeds limit. Splitting...`);

        const fileName = path.basename(audioPath, path.extname(audioPath));
        const outputPattern = path.join(PROCESSED_DIR, `${fileName}_%03d.wav`);

        // Split into 10-minute chunks (approx 10-15MB for MP3 standard quality)
        const segmentTime = 600;

        ffmpeg(audioPath)
            .outputOptions([
                '-f segment',
                `-segment_time ${segmentTime}`,
                '-c copy' // Copy codec for speed (assuming mp3 input)
            ])
            .output(outputPattern)
            .on('end', () => {
                console.log('Audio splitting completed.');
                // Find generated files
                const dirFiles = fs.readdirSync(PROCESSED_DIR);
                const splitFiles = dirFiles
                    .filter(f => f.startsWith(`${fileName}_`) && f.endsWith('.wav'))
                    .map(f => path.join(PROCESSED_DIR, f))
                    .sort(); // Ensure order

                resolve(splitFiles);
            })
            .on('error', (err) => {
                console.error('Error splitting audio:', err);
                reject(err);
            })
            .run();
    });
};

module.exports = {
    extractAudio,
    splitAudio,
    getDuration
};
