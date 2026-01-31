const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = 'uploads/';

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Downloads a video from a YouTube URL.
 * @param {string} url - YouTube video URL.
 * @returns {Promise<string>} - Path to the downloaded video file.
 */
const downloadVideoFromUrl = (url) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ytdl.validateURL(url)) {
                return reject(new Error('Invalid YouTube URL'));
            }

            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title.replace(/[^\w\s]/gi, '_'); // Sanitize title
            const filePath = path.join(UPLOAD_DIR, `${title}.mp4`);

            console.log(`Downloading: ${title}`);

            ytdl(url, { quality: 'highestaudio' }) // Downloading audio only for efficiency if we just need script
                .pipe(fs.createWriteStream(filePath))
                .on('finish', () => {
                    console.log(`Download completed: ${filePath}`);
                    resolve(filePath);
                })
                .on('error', (err) => {
                    console.error('Download error:', err);
                    reject(err);
                });

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    downloadVideoFromUrl
};
