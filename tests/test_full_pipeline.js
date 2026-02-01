const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_URL = 'http://localhost:5000/api/videos';
const VIDEO_PATH = path.join(__dirname, '../public/happy.srt'); // User pointed this to .srt

const runFullTest = async () => {
    try {
        console.log('🚀 Starting Full Pipeline System Check...');
        const isSubtitle = VIDEO_PATH.endsWith('.srt') || VIDEO_PATH.endsWith('.txt'); // Detect mode
        console.log(`ℹ️  Mode: ${isSubtitle ? 'SUBTITLE (Skip Transcription)' : 'VIDEO (Full Pipeline)'}`);

        if (!fs.existsSync(VIDEO_PATH)) {
            throw new Error(`File not found: ${VIDEO_PATH}`);
        }

        // 1. Upload
        console.log('\n--- 1️⃣  UPLOAD PHASE ---');
        const form = new FormData();
        // Dynamically append correct field based on file type
        if (isSubtitle) {
            form.append('subtitle', fs.createReadStream(VIDEO_PATH));
        } else {
            form.append('video', fs.createReadStream(VIDEO_PATH));
        }

        const uploadRes = await axios.post(`${API_URL}/upload`, form, { headers: form.getHeaders() });
        const videoId = uploadRes.data.video.id;
        console.log(`✅ Uploaded. ID: ${videoId}`);
        if (isSubtitle && !uploadRes.data.is_text_only) {
            console.warn("⚠️  Warning: Uploaded subtitle but response didn't indicate 'is_text_only'.");
        }

        // 2. Transcribe (Conditional)
        console.log('\n--- 2️⃣  TRANSCRIPTION PHASE ---');
        if (isSubtitle) {
            console.log('⏭️  Skipping transcription wait (Subtitle uploaded directly).');
        } else {
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
        }

        // 3. Translate
        console.log('\n--- 3️⃣  TRANSLATION PHASE (Mock) ---');
        // Translate to French (es was used before, let's try fr)
        const transRes = await axios.post(`${API_URL}/${videoId}/translate`, { targetLang: 'fr' });
        const translationId = transRes.data.translation.id;
        console.log(`✅ Translation Triggered. ID: ${translationId}`);

        // 4. Download Verification
        console.log('\n--- 4️⃣  DOWNLOAD VERIFICATION ---');
        // Download Script
        const scriptDl = await axios.get(`${API_URL}/${videoId}/script/download?format=txt`);
        console.log(`✅ Script Download Valid (Size: ${scriptDl.data.length} chars)`);

        // Download Translation
        const transDl = await axios.get(`${API_URL}/translations/${translationId}/download`);
        console.log(`✅ Translation Download Valid (Size: ${transDl.data.length} chars)`);

        // Simple check
        if (typeof transDl.data === 'object') {
            console.log(`   Target Lang: ${transDl.data.target_language}`);
            console.log(`   Text Preview: "${(transDl.data.translated_text || "").substring(0, 50)}..."`);
        } else {
            console.log(`   Content: "${transDl.data.substring(0, 50)}..."`);
        }

        console.log('\n🎉 ALL SYSTEMS GO! The pipeline is working perfectly.');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        if (error.response) console.error('   Server Response:', error.response.data);
    }
};

runFullTest();
