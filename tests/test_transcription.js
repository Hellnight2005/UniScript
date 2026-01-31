const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api/videos';
const VIDEO_PATH = path.join(__dirname, '../public/first_post.mp4');

const runTest = async () => {
    try {
        console.log('🚀 Starting Phase 2 Integration Test...');

        // 1. Upload Video
        console.log('1️⃣  Uploading video...');
        if (!fs.existsSync(VIDEO_PATH)) {
            throw new Error(`Test file not found: ${VIDEO_PATH}`);
        }

        const form = new FormData();
        form.append('video', fs.createReadStream(VIDEO_PATH));

        const uploadRes = await axios.post(`${API_URL}/upload`, form, {
            headers: { ...form.getHeaders() }
        });

        console.log('✅ Upload Successful!');
        const videoId = uploadRes.data.video.id;
        console.log(`   Video ID: ${videoId}`);

        console.log('⏳ Waiting for background processing (transcription)...');
        // Wait loop to poll for script
        let scriptFound = false;
        let attempts = 0;
        const maxAttempts = 20; // 40 seconds (approx)

        while (!scriptFound && attempts < maxAttempts) {
            attempts++;
            await new Promise(r => setTimeout(r, 2000)); // Wait 2s

            try {
                const scriptRes = await axios.get(`${API_URL}/${videoId}/script`);
                if (scriptRes.status === 200) {
                    console.log('✅ Script generated and retrieved!');
                    console.log('   Script Content Sample:', JSON.stringify(scriptRes.data.content, null, 2).substring(0, 200) + '...');
                    scriptFound = true;
                }
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    process.stdout.write('.');
                } else {
                    throw err;
                }
            }
        }

        if (!scriptFound) {
            throw new Error('Timeout waiting for script generation.');
        }

        // 2. Download Script
        console.log('2️⃣  Testing Download Endpoint...');
        const downloadRes = await axios.get(`${API_URL}/${videoId}/script/download?format=txt`);
        console.log('✅ Download Successful!');
        console.log('   Downloaded Text Length:', downloadRes.data.length);

        console.log('🎉 Phase 2 Verified!');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('   Server Response:', error.response.data);
        }
    }
};

runTest();
