const { extractAudio } = require('../services/audioService');
const path = require('path');
const fs = require('fs');

const runBenchmark = async () => {
    const videoPath = process.argv[2];
    if (!videoPath) {
        console.error("❌ Error: Missing file path.");
        console.log("Usage: node scripts/benchmark_audio.js \"C:/path/to/your/limitless.mkv\"");
        process.exit(1);
    }

    // Remove quotes if user pasted them
    const cleanPath = videoPath.replace(/"/g, '');

    if (!fs.existsSync(cleanPath)) {
        console.error(`❌ File not found: ${cleanPath}`);
        process.exit(1);
    }

    const stats = fs.statSync(cleanPath);
    const sizeInGB = stats.size / (1024 * 1024 * 1024);

    console.log(`\n🚀 Starting Audio Extraction Benchmark`);
    console.log(`----------------------------------------`);
    console.log(`📁 File: ${path.basename(cleanPath)}`);
    console.log(`📦 Size: ${sizeInGB.toFixed(2)} GB`);
    console.log(`⚙️  Target: 16kHz Mono WAV (Required for Whisper)`);
    console.log(`⏱️  Extraction started... please wait.`);

    const start = Date.now();
    try {
        const audioPath = await extractAudio(cleanPath);
        const end = Date.now();
        const duration = (end - start) / 1000;

        console.log(`\n✅ Extraction Complete!`);
        console.log(`----------------------------------------`);
        console.log(`📂 Output Audio: ${audioPath}`);
        console.log(`⏱️  Time Taken:  ${duration.toFixed(2)} seconds (${(duration / 60).toFixed(2)} minutes)`);

        // Estimate full processing
        // Rule of thumb: Extraction is ~5% of time, Transcription is ~95% on CPU
        console.log(`\n🔮 Predictive Analysis for this file (Estimates):`);
        console.log(`   - Extraction Speed: ${(stats.size / (1024 * 1024) / duration).toFixed(2)} MB/s`);
        console.log(`   - If extracting took ${duration.toFixed(0)}s, Transcribing on CPU might take ~${(duration * 20 / 60).toFixed(0)}-${(duration * 50 / 60).toFixed(0)} minutes.`);

    } catch (error) {
        console.error("\n❌ Benchmark Failed:", error);
    }
};

runBenchmark();
