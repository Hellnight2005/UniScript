const fs = require('fs');
const wav = require('wavefile');
const { pipeline } = require('@xenova/transformers');

// Lazy load the pipeline to avoid heavy startup if not needed immediately
let transcriber = null;

const getTranscriber = async () => {
    if (!transcriber) {
        console.log("⏳ Loading Local Whisper Model (Xenova/whisper-tiny.en)... this may take a moment.");
        // Use 'tiny.en' for speed, or 'base.en' for better accuracy
        transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
        console.log("✅ Local Whisper Model Loaded.");
    }
    return transcriber;
};

/**
 * Transcribes an audio file using Local Whisper (Transformers.js).
 * @param {string} audioPath - Path to audio file.
 * @returns {Promise<Object>} - Raw transcription result (mimicking OpenAI format).
 */
const transcribeAudio = async (audioPath) => {
    console.log(`Transcribing locally: ${audioPath}`);
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
