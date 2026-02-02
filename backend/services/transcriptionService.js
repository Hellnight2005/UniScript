const fs = require('fs');
const wav = require('wavefile');
const { pipeline } = require('@xenova/transformers');
const { OpenAI } = require('openai');

// Initialize OpenAI for Cloud Mode
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Transcription Mode Configuration
const TRANSCRIPTION_MODE = process.env.TRANSCRIPTION_MODE || 'openai'; // 'local' or 'openai'

// Lazy load the pipeline to avoid heavy startup if not needed immediately
let transcriber = null;

const getTranscriber = async () => {
    if (TRANSCRIPTION_MODE !== 'local') return null;

    if (!transcriber) {
        console.log("⏳ Loading Local Whisper Model (Xenova/whisper-tiny.en)... this may take a moment.");
        transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
        console.log("✅ Local Whisper Model Loaded.");
    }
    return transcriber;
};

/**
 * Transcribes an audio file. Supports both Local (Transformers.js) and Cloud (OpenAI).
 * @param {string} audioPath - Path to audio file.
 * @returns {Promise<Object>} - Transcription result.
 */
const transcribeAudio = async (audioPath) => {
    if (TRANSCRIPTION_MODE === 'openai') {
        return transcribeWithOpenAI(audioPath);
    } else {
        return transcribeLocally(audioPath);
    }
};

/**
 * Transcribes using OpenAI Whisper API (Memory Efficient).
 */
const transcribeWithOpenAI = async (audioPath) => {
    console.log(`Cloud Transcribing (OpenAI): ${audioPath}`);
    try {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is missing in .env");
        }

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-1",
            response_format: "verbose_json",
            timestamp_granularities: ["segment"],
        });

        return {
            text: transcription.text,
            segments: (transcription.segments || []).map(seg => ({
                start: seg.start,
                end: seg.end,
                text: seg.text.trim()
            }))
        };
    } catch (error) {
        console.error("OpenAI Transcription Error:", error.message);
        throw error;
    }
};

/**
 * Transcribes using Local Whisper (Memory Intensive).
 */
const transcribeLocally = async (audioPath) => {
    console.log(`Local Transcribing (Xenova): ${audioPath}`);
    try {
        const pipe = await getTranscriber();

        // Read the WAV file
        const buffer = fs.readFileSync(audioPath);
        const wavData = new wav.WaveFile(buffer);

        // Convert to Float32Array for Transformers.js
        wavData.toBitDepth('32f'); // Convert to 32-bit float
        let audioData = wavData.getSamples();

        // Handle multi-channel (use first channel if stereo)
        if (Array.isArray(audioData)) {
            if (wavData.fmt.numChannels > 1) { // Check actual number of channels
                // If we somehow got stereo, take left channel. 
                // But extractAudio ensures mono.
                audioData = audioData[0];
            } else {
                // If mono, it might be just TypedArray. Let's check structure more carefully or ensure mono in ffmpeg.
                // wavefile.getSamples() returns data based on format. If mono, it might be just TypedArray.
                // If it's an array containing a single Float32Array (e.g., [[...]]), extract it.
                if (audioData.length === 1 && audioData[0] instanceof Float32Array) {
                    audioData = audioData[0];
                }
            }
        }

        // If audioData is still not a Float32Array (e.g. it was returned as array of arrays), fix it.
        // But assuming defaults:

        const output = await pipe(audioData, {
            chunk_length_s: 30,
            stride_length_s: 5,
            return_timestamps: true // Enable timestamps
        });

        // Normalize output
        // Transformers.js with return_timestamps: true returns { text: "...", chunks: [{ text, timestamp: [start, end] }] }
        const segments = (output.chunks || []).map(chunk => ({
            start: chunk.timestamp[0],
            end: chunk.timestamp[1],
            text: chunk.text.trim()
        }));

        return {
            text: output.text.trim(),
            segments: segments
        };

    } catch (error) {
        console.error("Local Whisper Error:", error);
        // Fallback if local fails for some reason
        return {
            text: `[Local Transcription Failed: ${error.message}]`,
            segments: []
        };
    }
};

/**
 * Cleans the raw transcript.
 * Since we don't have GPT-4, we will use a simple rule-based cleaner or a lighter local model.
 * For now, simple textual cleanup.
 * @param {string} rawText 
 * @returns {Promise<string>}
 */
const generateCleanScript = async (rawText) => {
    // Simple mock cleaning rule-based
    if (!rawText) return "";
    return rawText
        .replace(/\b(um|uh|ah)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
};

module.exports = {
    transcribeAudio,
    generateCleanScript
};
