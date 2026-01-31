const OpenAI = require('openai');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Transcribes an audio file using OpenAI Whisper.
 * @param {string} audioPath - Path to audio file.
 * @returns {Promise<Object>} - Raw transcription result (verbose_json).
 */
const transcribeAudio = async (audioPath) => {
    console.log(`Transcribing: ${audioPath}`);
    try {
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-1",
            response_format: "verbose_json",
            timestamp_granularities: ["segment"]
        });
        return transcription;
    } catch (error) {
        console.error("Whisper API Error:", error.message);
        if (error.code === 'insufficient_quota' || error.status === 429) {
            console.warn("⚠️  Quota exceeded. Falling back to MOCK transcription.");
            return {
                text: "This is a mock transcript generated because the OpenAI API quota was exceeded. In a real scenario, this would be the actual spoken text from the video.",
                segments: [
                    { start: 0, end: 5, text: "This is a mock transcript" },
                    { start: 5, end: 10, text: "generated because the OpenAI API quota was exceeded." }
                ]
            };
        }
        throw error;
    }
};

/**
 * Cleans the raw transcript using GPT-4o-mini to remove filler words and fix formatting.
 * @param {string} rawText - Valid raw string text (or processed JSON string).
 * @returns {Promise<string>} - Cleaned text.
 */
const generateCleanScript = async (rawText) => {
    console.log("Cleaning script...");
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an expert editor. Clean the following transcript by removing filler words (um, uh), fixing punctuation, and organizing it into readable paragraphs. Do not change the meaning or remove important information. Output ONLY the cleaned text."
                },
                {
                    role: "user",
                    content: rawText
                }
            ],
            temperature: 0.3,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Script Cleaning Error:", error.message);
        if (error.code === 'insufficient_quota' || error.status === 429) {
            return "Mock Cleaned Script: " + rawText;
        }
        return rawText; // Fallback to raw text if cleaning fails
    }
};

module.exports = {
    transcribeAudio,
    generateCleanScript
};
