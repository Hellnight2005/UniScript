const axios = require('axios');
const supabase = require('../config/supabase');

const API_URL = 'http://localhost:5000/api/videos';

// You can manually set a VIDEO_ID here if you want to test a specific existing video
// Otherwise, it grabs the latest one.
let VIDEO_ID = null;

const runTest = async () => {
    try {
        console.log('🚀 Starting Phase 3 Integration Test: Translation...');

        // 1. Get Latest Video (assuming Phase 2 ran successfully)
        if (!VIDEO_ID) {
            const { data } = await supabase.from('scripts').select('video_id').limit(1).order('created_at', { ascending: false });
            if (data && data.length > 0) {
                VIDEO_ID = data[0].video_id;
                console.log(`ℹ️  Using Latest Video ID: ${VIDEO_ID}`);
            } else {
                throw new Error('No scripts found in DB. Run Phase 2 tests first.');
            }
        }

        // 2. Trigger Translation (Hindi)
        console.log('1️⃣  Triggering Translation to Hindi (hi)...');
        const translateRes = await axios.post(`${API_URL}/${VIDEO_ID}/translate`, {
            targetLang: 'hi'
        });

        console.log('✅ Translation Successful!');
        const translationId = translateRes.data.translation.id;
        console.log(`   Translation ID: ${translationId}`);

        // 3. Verify Download
        console.log('2️⃣  Verifying Download...');
        const downloadRes = await axios.get(`http://localhost:5000/api/videos/translations/${translationId}/download`);
        console.log('✅ Download Successful!');
        console.log('   Translated Content Sample:', downloadRes.data.substring(0, 100));

        console.log('🎉 Phase 3 Verified!');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) console.error(error.response.data);
    }
};

runTest();
