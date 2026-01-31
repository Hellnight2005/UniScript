const supabase = require('../config/supabase');
const { extractAudio, splitAudio } = require('../services/audioService');
const fs = require('fs');

const uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }

        const videoPath = req.file.path;
        const { title } = req.body;

        console.log(`Video uploaded: ${req.file.originalname} (${videoPath})`);

        // 1. Save metadata to Supabase
        const { data: videoData, error: dbError } = await supabase
            .from('videos')
            .insert([
                {
                    title: title || req.file.originalname,
                    video_url: videoPath, // Storing local path for now
                    original_language: 'en' // Default
                }
            ])
            .select()
            .single();

        if (dbError) {
            console.error('Supabase Error:', dbError);
            throw new Error('Failed to save video metadata: ' + dbError.message);
        }

        if (!videoData) {
            console.error('Supabase returned no data. Check RLS policies.');
            throw new Error('Failed to save video metadata: No data returned from Supabase. Ensure RLS policies allow insertion and selection.');
        }

        // 2. Process Video (Async)
        // In a real app, this should be a background job
        processVideo(videoData.id, videoPath);

        res.status(201).json({
            message: 'Video uploaded successfully. Processing started.',
            video: videoData
        });

    } catch (error) {
        console.error('Upload Error:', error);
        // Clean up uploaded file if error occurs
        if (req.file && fs.existsSync(req.file.path)) {
            // fs.unlinkSync(req.file.path); // Optional: keep for debugging
        }
        res.status(500).json({ error: error.message });
    }
};

const processVideo = async (videoId, videoPath) => {
    try {
        console.log(`Processing video ${videoId}...`);

        // Extract Audio
        const audioPath = await extractAudio(videoPath);

        // Split Audio (if needed)
        const audioChunks = await splitAudio(audioPath);

        console.log(`Video ${videoId} processed. Audio chunks: ${audioChunks.length}`);

        // TODO: Create entries in 'scripts' table or queue for ASR

    } catch (error) {
        console.error(`Error processing video ${videoId}:`, error);
    }
};

const { downloadVideoFromUrl } = require('../services/urlService');

const processUrl = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // 1. Download Video
        const videoPath = await downloadVideoFromUrl(url);
        const fileName = require('path').basename(videoPath);

        // 2. Save Metadata
        const { data: videoData, error: dbError } = await supabase
            .from('videos')
            .insert([
                {
                    title: fileName,
                    video_url: url,
                    original_language: 'en'
                }
            ])
            .select()
            .single();

        if (dbError) {
            // If DB fails, we might want to delete the file
            console.error('Supabase Error:', dbError);
            // Non-blocking error for now or handle appropriately
        }

        const videoId = videoData ? videoData.id : 'temp-id-' + Date.now();

        // 3. Start Processing (Async)
        processVideo(videoId, videoPath);

        res.status(200).json({
            message: 'Video URL accepted. Processing started.',
            video: videoData || { id: videoId, title: fileName }
        });

    } catch (error) {
        console.error('URL Processing Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    uploadVideo,
    processUrl
};
