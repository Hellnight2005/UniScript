const { transcribeAudio } = require('../services/transcriptionService');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const path = require('path');
const fs = require('fs');

const runBenchmark = async () => {
    const audioPath = process.argv[2]; // Expecting the WAV file
    if (!audioPath) {
        console.error("❌ Error: Missing audio file path.");
        console.log("Usage: node scripts/benchmark_transcription.js \"processed/limitless.wav\"");
        process.exit(1);
    }

    // Remove quotes
    const cleanPath = audioPath.replace(/"/g, '');

    if (!fs.existsSync(cleanPath)) {
        console.error(`❌ File not found: ${cleanPath}`);
        console.log("Tip: Run the audio extraction benchmark first to generate the WAV file.");
        process.exit(1);
    }

    const stats = fs.statSync(cleanPath);
    console.log(`\n🚀 Starting Transcription Speed Benchmark`);
    console.log(`----------------------------------------`);
    console.log(`Sound File: ${path.basename(cleanPath)}`);
    console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`\nℹ️  NOTE: Transcribing the full file would take usually take hours on CPU.`);
    console.log(`    We will generate a 60-second sample to calculate your system's "Real-Time Factor" (RTF).`);

    const samplePath = cleanPath.replace('.wav', '_sample_60s.wav');

    // 1. Create a 60s sample
    await new Promise((resolve, reject) => {
        ffmpeg(cleanPath)
            .setStartTime(0)
            .setDuration(60)
            .output(samplePath)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });

    console.log(`\n✅ Sample generated. Transcribing 60 seconds of audio...`);

    const start = Date.now();
    try {
        await transcribeAudio(samplePath);
        const end = Date.now();
        const timeTaken = (end - start) / 1000;

        // Cleanup sample
        if (fs.existsSync(samplePath)) fs.unlinkSync(samplePath);

        // Calculate Stats
        const rtf = timeTaken / 60; // Time taken per second of audio

        // Get total duration of original file (estimate from size for WAV 16khz mono approx)
        // 1 sec of 16khz 16bit mono = 32000 bytes.
        const totalDurationSec = stats.size / 32000;
        const estimatedTotalTimeSec = totalDurationSec * rtf;

        console.log(`\n📊 Benchmark Results`);
        console.log(`----------------------------------------`);
        console.log(`⏱️  Time to transcribe 60s audio: ${timeTaken.toFixed(2)} seconds`);
        console.log(`🐢 Real-Time Factor (RTF): ${rtf.toFixed(2)}x`);
        console.log(`   (It takes ${rtf.toFixed(2)} seconds to process 1 second of audio)`);

        console.log(`\n🔮 Predictive Estimate for Full File:`);
        console.log(`   - Total Audio Duration: ~${(totalDurationSec / 60).toFixed(0)} minutes`);
        console.log(`   - Estimated Wait Time:  ~${(estimatedTotalTimeSec / 60).toFixed(0)} minutes`);

        if (rtf > 1) {
            console.log(`\n⚠️  Assessment: SLOW. Your CPU is processing slower than real-time.`);
            console.log(`    Recommendation: Use GPU acceleration or a Cloud API.`);
        } else {
            console.log(`\n✅ Assessment: FAST. You are processing faster than real-time!`);
        }

    } catch (error) {
        console.error("\n❌ Benchmark Failed:", error);
    }
};

runBenchmark();
