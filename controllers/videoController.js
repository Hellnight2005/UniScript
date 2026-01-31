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



const { downloadVideoFromUrl } = require('../services/urlService');
const { transcribeAudio, generateCleanScript } = require('../services/transcriptionService');

const processVideo = async (videoId, videoPath) => {
    try {
        console.log(`Processing video ${videoId}...`);

        // 1. Extract Audio
        const audioPath = await extractAudio(videoPath);

        // 2. Split Audio (if needed)
        const audioChunks = await splitAudio(audioPath);
        console.log(`Audio chunks to process: ${audioChunks.length}`);

        // 3. Transcribe Chunks
        let fullTranscript = { text: "", segments: [] };

        for (const chunkPath of audioChunks) {
            console.log(`Transcribing chunk: ${chunkPath}`);
            const result = await transcribeAudio(chunkPath);

            // Append text
            fullTranscript.text += (fullTranscript.text ? " " : "") + result.text;

            // Adjust and append segments (timestamp offset handling would be needed for precise multi-chunk, 
            // but for now simplistic concatenation or assuming single chunk < 25MB for most demos)
            // TODO: Handle timestamp offsets for multiple chunks real implementation
            if (result.segments) {
                fullTranscript.segments.push(...result.segments);
            }

            // Clean up chunk if it's a split file
            if (chunkPath !== audioPath && fs.existsSync(chunkPath)) {
                fs.unlinkSync(chunkPath);
            }
        }

        // 4. Generate Clean Script
        const cleanText = await generateCleanScript(fullTranscript.text);

        // 5. Store in Supabase
        const scriptData = {
            raw_transcript: fullTranscript,
            cleaned_text: cleanText,
            language: 'en' // Assuming EN for now, Whisper detects it but we force EN often
        };

        const { error: dbError } = await supabase
            .from('scripts')
            .insert([
                {
                    video_id: videoId,
                    content: JSON.stringify(scriptData),
                    is_cleaned: true
                }
            ]);

        if (dbError) {
            console.error('Failed to save script to DB:', dbError);
        } else {
            console.log(`Script saved for video ${videoId}`);
        }

        // Clean up extracted audio
        if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
        }

    } catch (error) {
        console.error(`Error processing video ${videoId}:`, error);
    }
};

const getScript = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('scripts')
            .select('*')
            .eq('video_id', id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Script not found' });
        }

        // Parse content if it's stored as text
        const content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
        res.json({ ...data, content });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const downloadScript = async (req, res) => {
    try {
        const { id } = req.params;
        const { format } = req.query; // 'json' or 'txt'

        const { data, error } = await supabase
            .from('scripts')
            .select('*')
            .eq('video_id', id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Script not found' });
        }

        const content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
        let fileContent = "";
        let contentType = "text/plain";
        let extension = "txt";

        if (format === 'json') {
            fileContent = JSON.stringify(content, null, 2);
            contentType = "application/json";
            extension = "json";
        } else {
            // Default to cleaned text for TXT download
            fileContent = content.cleaned_text || content.raw_transcript.text;
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="script-${id}.${extension}"`);
        res.send(fileContent);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

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
            console.error('Supabase Error:', dbError);
            throw new Error('Failed to save video metadata: ' + dbError.message);
        }

        if (!videoData) {
            console.error('Supabase returned no data. Check RLS policies.');
            throw new Error('Failed to save video metadata: No data returned from Supabase. Ensure RLS policies allow insertion and selection.');
        }

        const videoId = videoData.id;

        // 3. Start Processing (Async)
        processVideo(videoId, videoPath);

        res.status(200).json({
            message: 'Video URL accepted. Processing started.',
            video: videoData
        });

    } catch (error) {
        console.error('URL Processing Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    uploadVideo,
    processUrl,
    getScript,
    downloadScript
};
