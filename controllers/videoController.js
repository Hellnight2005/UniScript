const supabase = require('../config/supabase');
const { extractAudio, splitAudio, getDuration } = require('../services/audioService'); // Updated import
const fs = require('fs');

const uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }

        const videoPath = req.file.path;
        const { title } = req.body;

        console.log(`Video uploaded: ${req.file.originalname} (${videoPath})`);

        // 1. Get Duration and Calculate ETA
        let estimatedTimeSeconds = 0;
        let estimatedTimeText = "Calculating...";
        try {
            const duration = await getDuration(videoPath);
            if (duration > 0) {
                // Formula: 0.3x RTF (from benchmark) + 20s overhead/translation
                estimatedTimeSeconds = Math.ceil(duration * 0.3) + 20;
                const mins = Math.floor(estimatedTimeSeconds / 60);
                const secs = estimatedTimeSeconds % 60;
                estimatedTimeText = mins > 0 ? `~${mins}m ${secs}s` : `~${secs}s`;
            }
        } catch (e) {
            console.warn("Could not calculate duration:", e);
        }

        // 2. Save metadata to Supabase
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

        // 3. Process Video (Async)
        processVideo(videoData.id, videoPath);

        res.status(201).json({
            message: 'Video uploaded successfully. Processing started.',
            video: videoData,
            estimated_processing_time: estimatedTimeText,
            estimated_seconds: estimatedTimeSeconds
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

            // Adjust and append segments (timestamp offset handling would be needed for precise multi-chunk)
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
            language: 'en'
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

        // NEW: Calculate Estimate
        let estimatedTimeSeconds = 0;
        let estimatedTimeText = "Calculating...";
        try {
            const duration = await getDuration(videoPath);
            if (duration > 0) {
                estimatedTimeSeconds = Math.ceil(duration * 0.3) + 20;
                const mins = Math.floor(estimatedTimeSeconds / 60);
                const secs = estimatedTimeSeconds % 60;
                estimatedTimeText = mins > 0 ? `~${mins}m ${secs}s` : `~${secs}s`;
            }
        } catch (e) { console.warn(e); }

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
            video: videoData,
            estimated_processing_time: estimatedTimeText,
            estimated_seconds: estimatedTimeSeconds
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const { translateScript } = require('../services/translationService');

const translateVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetLang } = req.body;

        if (!targetLang) {
            return res.status(400).json({ error: 'Target language (targetLang) is required' });
        }

        // 1. Fetch original script
        const { data: scriptData, error: scriptError } = await supabase
            .from('scripts')
            .select('*')
            .eq('video_id', id)
            .single();

        if (scriptError || !scriptData) {
            return res.status(404).json({ error: 'Original script not found. Please process the video first.' });
        }

        const content = typeof scriptData.content === 'string' ? JSON.parse(scriptData.content) : scriptData.content;

        // 2. Perform Translation
        const translatedContent = await translateScript(content, targetLang);

        // 3. Store in 'translations' table
        const { data: translationData, error: dbError } = await supabase
            .from('translations')
            .insert([
                {
                    script_id: scriptData.id,
                    target_language: targetLang,
                    translated_text: translatedContent.translated_text,
                    segments: translatedContent.segments
                }
            ])
            .select()
            .single();

        if (dbError) {
            console.error('Translation DB Error:', dbError);
            throw new Error('Failed to save translation.');
        }

        res.status(201).json({
            message: `Translation to ${targetLang} successful`,
            translation: translationData
        });

    } catch (error) {
        console.error('Translation Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getTranslations = async (req, res) => {
    try {
        const { id } = req.params; // video_id

        // 1. Get Script ID first
        const { data: scriptData, error: scriptError } = await supabase
            .from('scripts')
            .select('id')
            .eq('video_id', id)
            .single();

        if (scriptError || !scriptData) {
            return res.json([]); // No script means no translations
        }

        // 2. Get Translations
        const { data, error } = await supabase
            .from('translations')
            .select('*')
            .eq('script_id', scriptData.id);

        if (error) {
            throw error;
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const downloadTranslation = async (req, res) => {
    try {
        const { translationId } = req.params; // Note: using translation UUID, not video ID
        const { format } = req.query;

        const { data, error } = await supabase
            .from('translations')
            .select('*')
            .eq('id', translationId)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Translation not found' });
        }

        let fileContent = "";
        let contentType = "text/plain";
        let extension = "txt";

        if (format === 'json') {
            fileContent = JSON.stringify({
                target_language: data.target_language,
                translated_text: data.translated_text,
                segments: data.segments
            }, null, 2);
            contentType = "application/json";
            extension = "json";
        } else {
            fileContent = data.translated_text || "";
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="translation-${data.language}-${translationId}.${extension}"`);
        res.send(fileContent);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    uploadVideo,
    processUrl,
    getScript,
    downloadScript,
    translateVideo,
    getTranslations,
    downloadTranslation
};
