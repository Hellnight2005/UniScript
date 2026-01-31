const { LingoDotDevEngine } = require('lingo.dev/sdk');

// Initialize Lingo.dev Engine
// Note: This requires LINGO_API_KEY in .env
const lingo = new LingoDotDevEngine({
    apiKey: process.env.LINGO_API_KEY,
});

/**
 * Translates text into the target language using Lingo.dev.
 * 
 * @param {string} text - Text to translate.
 * @param {string} targetLang - Target language code (e.g., 'es', 'hi', 'fr').
 * @returns {Promise<string>} - Translated text.
 */
const translateText = async (text, targetLang) => {
    if (!process.env.LINGO_API_KEY) {
        console.warn("⚠️  LINGO_API_KEY is missing. Returning text with [Mock] prefix.");
        return `[Mock Lingo Missing] ${text}`;
    }

    try {
        console.log(`Sending text to Lingo.dev (${targetLang})...`);
        // Lingo.dev usage: await lingo.localizeText(text, { sourceLocale: 'en', targetLocale: targetLang })
        const result = await lingo.localizeText(text, {
            sourceLocale: 'en',
            targetLocale: targetLang
        });

        return result || text; // Fallback if empty
    } catch (error) {
        console.error("❌ Lingo.dev Error:", error.message);
        throw new Error(`Translation Failed: ${error.message}`);
    }
};

/**
 * Translates a complete script object (content).
 * Handles both the full text and individual segments.
 * 
 * @param {Object} scriptContent - The full JSON content of the script (raw_transcript, cleaned_text).
 * @param {string} targetLang - Target language code.
 * @returns {Promise<Object>} - The translated script object.
 */
const translateScript = async (scriptContent, targetLang) => {
    console.log(`Translating script to ${targetLang} using Lingo.dev...`);

    const translatedContent = {
        original_language: 'en',
        target_language: targetLang,
        translated_text: "",
        segments: []
    };

    // 1. Translate Full Cleaned Text
    if (scriptContent.cleaned_text) {
        translatedContent.translated_text = await translateText(scriptContent.cleaned_text, targetLang);
    } else if (scriptContent.raw_transcript && scriptContent.raw_transcript.text) {
        translatedContent.translated_text = await translateText(scriptContent.raw_transcript.text, targetLang);
    }

    // 2. Translate Segments (if available)
    // Optimization: Lingo might handle arrays or batching? 
    // For now, we iterate. Rate limits might apply, so we should be careful.
    // If Lingo supports batch: await lingo.translate([list], ...)
    if (scriptContent.raw_transcript && scriptContent.raw_transcript.segments) {

        // Let's try to map them parallel for speed, assuming Lingo handles concurrency
        const promises = scriptContent.raw_transcript.segments.map(async (segment) => {
            const translatedText = await translateText(segment.text, targetLang);
            return {
                start: segment.start,
                end: segment.end,
                text: translatedText
            };
        });

        translatedContent.segments = await Promise.all(promises);
    }

    return translatedContent;
};

module.exports = {
    translateText,
    translateScript
};
