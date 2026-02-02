const supabase = require('../config/supabase');
const { extractAudio, splitAudio, getDuration } = require('../services/audioService'); // Updated import
const fs = require('fs');

const uploadVideo = async (req, res) => {
    try {
        const files = req.files || {};
        const videoFile = files['video'] ? files['video'][0] : null;
        const subtitleFile = files['subtitle'] ? files['subtitle'][0] : null;

        if (!videoFile && !subtitleFile) {
            return res.status(400).json({ error: 'No file uploaded. Please upload a video or a subtitle file.' });
        }

        if (videoFile && subtitleFile) {
            return res.status(400).json({ error: 'Please upload EITHER a video OR a subtitle file, not both.' });
        }

        const { parseSRT } = require('../services/subtitleService');

        // ...

        // --- SUBTITLE UPLOAD FLOW ---
        if (subtitleFile) {
            console.log(`Subtitle uploaded: ${subtitleFile.originalname}`);

            // 1. Read the file content
            const subtitleContent = fs.readFileSync(subtitleFile.path, 'utf-8');

            // 2. Parse Subtitle
            let parsedScript = { text: subtitleContent, segments: [] };
            try {
                // Determine format based on extension or just try SRT
                if (subtitleFile.originalname.toLowerCase().endsWith('.srt') || subtitleFile.originalname.toLowerCase().endsWith('.txt')) {
                    parsedScript = parseSRT(subtitleContent);
                }
            } catch (parseError) {
                console.warn("Failed to parse subtitle structure, falling back to raw text:", parseError);
            }

            // 3. Create "Video" Metadata (Placeholder for Text-Only Project)
            const { data: videoData, error: dbError } = await supabase
                .from('videos')
                .insert([
                    {
                        title: req.body.title || subtitleFile.originalname,
                        video_url: 'SUBTITLE_ONLY_UPLOAD', // Placeholder
                        original_language: 'en'
                    }
                ])
                .select()
                .single();

            if (dbError) {
                console.error('Supabase Error (Video):', dbError);
                throw new Error('Failed to create project from subtitle.');
            }

            // 4. Save Script to DB
            const scriptData = {
                raw_transcript: { text: parsedScript.text, segments: parsedScript.segments },
                cleaned_text: parsedScript.text, // Use parsed full text
                language: 'en'
            };

            const { error: scriptError } = await supabase
                .from('scripts')
                .insert([
                    {
                        video_id: videoData.id,
                        content: JSON.stringify(scriptData),
                        is_cleaned: true
                    }
                ]);

            if (scriptError) {
                console.error('Supabase Error (Script):', scriptError);
                // Rollback video creation ideally, but for now just error
                throw new Error('Failed to save subtitle script.');
            }

            // Clean up uploaded subtitle file
            if (fs.existsSync(subtitleFile.path)) {
                fs.unlinkSync(subtitleFile.path);
            }

            return res.status(201).json({
                message: 'Subtitle uploaded successfully. Project created.',
                video: videoData,
                is_text_only: true
            });
        }

        // --- VIDEO UPLOAD FLOW (Existing) ---
        if (videoFile) {
            const videoPath = videoFile.path;
            const { title } = req.body;

            console.log(`Video uploaded: ${videoFile.originalname} (${videoPath})`);

            // FILE SIZE CHECK
            const ONE_GB = 1024 * 1024 * 1024;
            if (videoFile.size > ONE_GB) {
                // Delete the file immediately
                if (fs.existsSync(videoPath)) {
                    fs.unlinkSync(videoPath);
                }
                return res.status(400).json({
                    error: 'Video file is too large (> 1GB). Please upload a subtitle file instead or compress the video.'
                });
            }

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
                        title: title || videoFile.originalname,
                        video_url: videoPath,
                        original_language: 'en',
                        status: 'PENDING',
                        progress: 0
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

            return res.status(201).json({
                message: 'Video uploaded successfully. Processing started.',
                video: videoData,
                estimated_processing_time: estimatedTimeText,
                estimated_seconds: estimatedTimeSeconds
            });
        }

    } catch (error) {
        console.error('Upload Error:', error);
        // Clean up uploaded file if error occurs
        if (req.files) {
            Object.values(req.files).flat().forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }
        res.status(500).json({ error: error.message });
    }
};



const { transcribeAudio, generateCleanScript } = require('../services/transcriptionService');


const processVideo = async (videoId, videoPath) => {
    try {
        console.log(`Processing video ${videoId}...`);

        // Update: EXTRACTING_AUDIO (10%)
        await supabase.from('videos').update({ status: 'EXTRACTING_AUDIO', progress: 10 }).eq('id', videoId);

        // 1. Extract Audio
        const audioPath = await extractAudio(videoPath);

        // Update: AUDIO_EXTRACTED (25%)
        await supabase.from('videos').update({ status: 'AUDIO_EXTRACTED', progress: 25 }).eq('id', videoId);

        // 2. Split Audio (if needed)
        const audioChunks = await splitAudio(audioPath);
        console.log(`Audio chunks to process: ${audioChunks.length}`);

        // Update: TRANSCRIBING (40%)
        await supabase.from('videos').update({ status: 'TRANSCRIBING', progress: 40 }).eq('id', videoId);

        // 3. Transcribe Chunks
        let fullTranscript = { text: "", segments: [] };

        for (let i = 0; i < audioChunks.length; i++) {
            const chunkPath = audioChunks[i];
            console.log(`Transcribing chunk: ${chunkPath}`);
            const result = await transcribeAudio(chunkPath);

            fullTranscript.text += (fullTranscript.text ? " " : "") + result.text;
            if (result.segments) {
                fullTranscript.segments.push(...result.segments);
            }

            // Update Progress incrementally during transcription (40% to 75%)
            const progress = 40 + Math.floor(((i + 1) / audioChunks.length) * 35);
            await supabase.from('videos').update({ progress }).eq('id', videoId);

            if (chunkPath !== audioPath && fs.existsSync(chunkPath)) {
                fs.unlinkSync(chunkPath);
            }
        }

        // Update: FINALIZING (80%)
        await supabase.from('videos').update({ status: 'FINALIZING', progress: 80 }).eq('id', videoId);

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

        if (dbError) throw dbError;

        // Update: DONE (100%)
        await supabase.from('videos').update({ status: 'DONE', progress: 100 }).eq('id', videoId);
        console.log(`Script saved for video ${videoId}`);

        if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
        }

    } catch (error) {
        console.error(`Error processing video ${videoId}:`, error);
        await supabase.from('videos').update({
            status: 'ERROR',
            error_message: error.message
        }).eq('id', videoId);
    }
};

const getVideoStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('videos')
            .select('status, progress, error_message')
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

// Helper to format seconds to SRT timecode (HH:MM:SS,mmm)
const formatSRTTime = (seconds) => {
    const date = new Date(0);
    date.setMilliseconds(seconds * 1000);
    const iso = date.toISOString();
    // ISO is YYYY-MM-DDTHH:mm:ss.sssZ, we take 11-23 (HH:mm:ss.sss)
    let timeCode = iso.substr(11, 12).replace('.', ',');
    return timeCode;
};

const downloadTranslation = async (req, res) => {
    try {
        const { translationId } = req.params;
        const { format } = req.query; // 'srt' or 'txt'

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
        let extension = "srt";

        // Default to SRT unless specified otherwise
        if (format === 'txt') {
            fileContent = data.translated_text || "";
            extension = "txt";
        } else {
            // SRT Generation
            if (!data.segments || !Array.isArray(data.segments)) {
                // Fallback if no segments are available
                fileContent = "1\n00:00:00,000 --> 00:00:10,000\n" + (data.translated_text || "");
            } else {
                fileContent = data.segments.map((seg, index) => {
                    const start = formatSRTTime(seg.start);
                    const end = formatSRTTime(seg.end);
                    return `${index + 1}\n${start} --> ${end}\n${seg.text}\n\n`;
                }).join('');
            }
            extension = "srt";
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="translation-${data.target_language}-${translationId}.${extension}"`);
        res.send(fileContent);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getLatestVideos = async (req, res) => {
    try {
        const { limit } = req.query;
        // Default to fetching last 10 videos
        const limitCount = limit ? parseInt(limit) : 10;

        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limitCount);

        if (error) {
            throw error;
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAnalytics = async (req, res) => {
    try {
        const { count: videoCount, error: videoError } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true });

        const { count: scriptCount, error: scriptError } = await supabase
            .from('scripts')
            .select('*', { count: 'exact', head: true });

        if (videoError) throw videoError;
        if (scriptError) throw scriptError;

        res.json({
            total_videos: videoCount,
            total_scripts: scriptCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    uploadVideo,
    getScript,
    downloadScript,
    translateVideo,
    getTranslations,
    downloadTranslation,
    getLatestVideos,
    getAnalytics,
    getVideoStatus
};
