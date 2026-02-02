/**
 * Parses SRT content into a structured format.
 * @param {string} srtContent 
 * @returns {Object} { text: string, segments: Array<{start: number, end: number, text: string}> }
 */
const parseSRT = (srtContent) => {
    const normalizeLineEndings = (str) => str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const content = normalizeLineEndings(srtContent).trim();

    // Split by double newlines to get blocks
    const blocks = content.split('\n\n');
    const segments = [];
    let fullText = "";

    blocks.forEach(block => {
        const lines = block.split('\n');
        // Standard SRT block:
        // 1
        // 00:00:00,000 --> 00:00:02,720
        // Text content

        if (lines.length >= 3) {
            // Index 0 is ID (ignore)
            // Index 1 is Timecode
            const timecodeLine = lines[1];
            const textLines = lines.slice(2);
            const text = textLines.join(' ').trim();

            if (timecodeLine.includes('-->')) {
                const [startStr, endStr] = timecodeLine.split('-->').map(s => s.trim());
                const start = parseSRTTime(startStr);
                const end = parseSRTTime(endStr);

                if (text) {
                    segments.push({
                        start,
                        end,
                        text
                    });
                    fullText += (fullText ? " " : "") + text;
                }
            }
        }
    });

    return {
        text: fullText,
        segments: segments
    };
};

/**
 * Converts SRT timestamp (00:00:00,000) to seconds (float).
 * @param {string} timeStr 
 * @returns {number}
 */
const parseSRTTime = (timeStr) => {
    // Format: HH:MM:SS,mmm
    const parts = timeStr.split(':');
    if (parts.length < 3) return 0;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const secondsParts = parts[2].split(','); // or .
    const seconds = parseInt(secondsParts[0], 10);
    const milliseconds = parseInt(secondsParts[1] || 0, 10);

    return (hours * 3600) + (minutes * 60) + seconds + (milliseconds / 1000);
};

module.exports = {
    parseSRT
};
