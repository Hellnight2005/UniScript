const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const PROCESSED_DIR = 'processed/';

if (!fs.existsSync(PROCESSED_DIR)) {
    fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

/**
 * Extracts audio from a video file.
 * @param {string} videoPath - Path to the source video file.
 * @returns {Promise<string>} - Path to the extracted audio file.
 */
const extractAudio = (videoPath) => {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(videoPath, path.extname(videoPath));
        const audioPath = path.join(PROCESSED_DIR, `${fileName}.mp3`);

        console.log(`[MOCK] Extracting audio from ${videoPath} to ${audioPath}`);

        // Create a dummy audio file
        try {
            fs.writeFileSync(audioPath, 'Mock audio content');
            console.log(`[MOCK] Audio extracted: ${audioPath}`);
            resolve(audioPath);
        } catch (err) {
            console.error('[MOCK] Error extracting audio:', err);
            reject(err);
        }
    });
};

/**
 * Splits audio into chunks suitable for ASR (e.g., < 25MB or 10 mins).
 * This is a placeholder for the actual splitting logic.
 * @param {string} audioPath 
 */
const splitAudio = (audioPath) => {
    // TODO: Implement chunking logic based on file size or duration
    return new Promise((resolve) => {
        // For now, just return the original audio path as a single chunk
        resolve([audioPath]);
    });
};

module.exports = {
    extractAudio,
    splitAudio
};
