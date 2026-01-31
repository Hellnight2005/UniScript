/**
 * Translates text into the target language.
 * Currently a MOCK implementation for verification.
 * 
 * @param {string} text - Text to translate.
 * @param {string} targetLang - Target language code (e.g., 'es', 'hi', 'fr').
 * @returns {Promise<string>} - Translated text (Mocked).
 */
const translateText = async (text, targetLang) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simple mock translation logic
    const mockTranslations = {
        'es': (t) => `[Spanish] ${t}`,
        'hi': (t) => `[Hindi] ${t}`,
        'fr': (t) => `[French] ${t}`,
        'de': (t) => `[German] ${t}`
    };

    const translator = mockTranslations[targetLang] || ((t) => `[${targetLang}] ${t}`);
    return translator(text);
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
    console.log(`Translating script to ${targetLang}...`);

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
    if (scriptContent.raw_transcript && scriptContent.raw_transcript.segments) {
        for (const segment of scriptContent.raw_transcript.segments) {
            const translatedText = await translateText(segment.text, targetLang);
            translatedContent.segments.push({
                start: segment.start,
                end: segment.end,
                text: translatedText
            });
        }
    }

    return translatedContent;
};

module.exports = {
    translateText,
    translateScript
};
