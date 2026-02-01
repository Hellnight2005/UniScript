const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api/videos';

async function testUpload(type, filePath) {
    console.log(`\n--- Testing ${type} Upload ---`);
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const form = new FormData();
        if (type === 'video') {
            form.append('video', fs.createReadStream(filePath));
        } else if (type === 'subtitle') {
            form.append('subtitle', fs.createReadStream(filePath));
        } else if (type === 'both') {
            form.append('video', fs.createReadStream(filePath));
            // Just reusing video file as "subtitle" for the "both" fail case to save creating another file
            form.append('subtitle', fs.createReadStream(filePath));
        }

        form.append('title', `Test ${type} Upload`);

        const response = await axios.post(`${API_URL}/upload`, form, {
            headers: { ...form.getHeaders() },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log(`✅ ${type} Upload Success!`);
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        return response.data;

    } catch (error) {
        if (error.response) {
            console.log(`ℹ️ Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            if (type === 'both' && error.response.status === 400) {
                console.log(`✅ Correctly rejected 'both' files.`);
            } else if (type === 'none' && error.response.status === 400) {
                console.log(`✅ Correctly rejected 'no' files.`);
            } else {
                console.error(`❌ Unexpected Error:`, error.response.data);
            }
        } else {
            console.error(`❌ Error:`, error.message);
        }
    }
}

async function runTests() {
    const subtitlePath = path.join(__dirname, '../public/happy.srt');
    // Using a dummy small video if available, or just mocking the file presence check? 
    // We need a real video file for the video path. 
    // Let's check 'public/first_post.mp4' which was in original test.
    const videoPath = path.join(__dirname, '../public/first_post.mp4');

    // 1. Test Subtitle Only
    const subtitleResponse = await testUpload('subtitle', subtitlePath);

    if (subtitleResponse && subtitleResponse.video) {
        const videoId = subtitleResponse.video.id;
        console.log(`\n--- Testing Translation for Video URL: ${subtitleResponse.video.video_url} (ID: ${videoId}) ---`);

        try {
            const translateRes = await axios.post(`${API_URL.replace('/upload', '')}/${videoId}/translate`, { targetLang: 'es' });
            console.log('✅ Translation Request Success');
            console.log('Translation:', JSON.stringify(translateRes.data, null, 2));
        } catch (e) {
            console.error('❌ Translation Failed:', e.response ? e.response.data : e.message);
        }
    }

    // 2. Test Both (Should Fail)
    if (fs.existsSync(videoPath)) {
        await testUpload('both', videoPath); // passing videoPath for both fields just to trigger the "both" check
    } else {
        console.log("Skipping 'Both' and 'Video' tests because public/first_post.mp4 is missing.");
    }
}

runTests();
