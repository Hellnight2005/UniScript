const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api/videos';
const PUBLIC_DIR = path.join(__dirname, '../public');

const testUpload = async (filename) => {
    const filePath = path.join(PUBLIC_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filename}`);
        return;
    }

    console.log(`\n⬆️ Uploading ${filename}...`);
    try {
        const form = new FormData();
        form.append('video', fs.createReadStream(filePath));
        form.append('title', `Test Upload - ${filename}`);

        const response = await axios.post(`${API_URL}/upload`, form, {
            headers: {
                ...form.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log(`✅ Upload Success: ${filename}`);
        console.log('Response:', response.data);

    } catch (error) {
        console.error(`❌ Upload Failed: ${filename}`);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

const runTests = async () => {
    // 1. Test Small Video
    await testUpload('first_post.mp4');

    // 2. Test Large Video (if exists)
    // Note: This might take time and depends on system resources
    await testUpload('Limitless.2011.UNRATED.720p.BluRay.Hindi.English.ESubs.MoviesMod.cafe.mkv');
};

// Wait for server to be ready ideally, but we'll just run
setTimeout(runTests, 2000);
