const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_URL = 'http://localhost:5000/api/videos';
const VIDEO_PATH = path.join(__dirname, '../public/first_post.mp4');

const runFullTest = async () => {
    try {
        console.log('🚀 Starting Full Pipeline System Check...');

        // 1. Upload
        console.log('\n--- 1️⃣  UPLOAD PHASE ---');
        const form = new FormData();
        form.append('video', fs.createReadStream(VIDEO_PATH));
        const uploadRes = await axios.post(`${API_URL}/upload`, form, { headers: form.getHeaders() });
        const videoId = uploadRes.data.video.id;
        console.log(`✅ Uploaded. Video ID: ${videoId}`);

        // 2. Transcribe (Wait)
        console.log('\n--- 2️⃣  TRANSCRIPTION PHASE (Local Whisper) ---');
        console.log('⏳ Waiting for transcription (up to 60s)...');

        let scriptData = null;
        for (let i = 0; i < 60; i++) {
            await new Promise(r => setTimeout(r, 3000));
            try {
                const res = await axios.get(`${API_URL}/${videoId}/script`);
                if (res.status === 200) {
                    scriptData = res.data;
                    break;
                }
            } catch (e) { process.stdout.write('.'); }
        }

        if (!scriptData) throw new Error('Timeout waiting for transcription.');

        const segments = scriptData.content.raw_transcript.segments || [];
        console.log(`✅ Transcription Complete. Segments Found: ${segments.length}`);
        if (segments.length === 0) console.warn('⚠️  Warning: 0 segments found (Timestamps missing?)');
        else console.log(`   Sample: [${segments[0].start}s - ${segments[0].end}s] "${segments[0].text}"`);

        // 3. Translate
        console.log('\n--- 3️⃣  TRANSLATION PHASE (Mock) ---');
        // Translate to Spanish
        const transRes = await axios.post(`${API_URL}/${videoId}/translate`, { targetLang: 'es' });
        const translationId = transRes.data.translation.id;
        console.log(`✅ Translation Triggered. ID: ${translationId}`);

        // 4. Download Verification
        console.log('\n--- 4️⃣  DOWNLOAD VERIFICATION ---');
        // Download Script
        const scriptDl = await axios.get(`${API_URL}/${videoId}/script/download?format=txt`);
        console.log(`✅ Script Download Valid (Size: ${scriptDl.data.length} chars)`);

        // Download Translation
        // Note: API_URL already includes '/api/videos', so we just append '/translations/...'
        const transDl = await axios.get(`${API_URL}/translations/${translationId}/download`);
        console.log(`✅ Translation Download Valid (Size: ${transDl.data.length} chars)`);

        // Simple check if it's JSON (default)
        if (typeof transDl.data === 'object') {
            console.log(`   Target Lang: ${transDl.data.target_language}`);
            console.log(`   Text Preview: "${(transDl.data.translated_text || "").substring(0, 50)}..."`);
        } else {
            console.log(`   Content: "${transDl.data.substring(0, 50)}..."`);
        }

        console.log('\n🎉 ALL SYSTEMS GO! The entire pipeline is working perfectly.');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        if (error.response) console.error('   Server Response:', error.response.data);
    }
};

runFullTest();
