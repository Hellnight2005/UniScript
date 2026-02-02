const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/videos';

async function testRoutes() {
    console.log('Starting Route Verification...');

    // 1. Test getLatestVideos
    console.log('\nTesting GET / (Latest Videos)...');
    try {
        const response = await axios.get(`${BASE_URL}/`);
        if (Array.isArray(response.data)) {
            console.log('✅ Success: Received an array of videos.');
            console.log(`ℹ️ Count: ${response.data.length}`);
            if (response.data.length > 0) {
                console.log('Sample Video:', JSON.stringify(response.data[0], null, 2));
            }
        } else {
            console.error('❌ Failed: Expected an array, got:', typeof response.data);
        }
    } catch (error) {
        console.error('❌ Error fetching videos:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }

    // 2. Test getAnalytics
    console.log('\nTesting GET /analytics (Analytics)...');
    try {
        const response = await axios.get(`${BASE_URL}/analytics`);
        const data = response.data;
        if (data && typeof data.total_videos === 'number' && typeof data.total_scripts === 'number') {
            console.log('✅ Success: Received analytics data.');
            console.log('Data:', JSON.stringify(data, null, 2));
        } else {
            console.error('❌ Failed: Unexpected data structure:', data);
        }
    } catch (error) {
        console.error('❌ Error fetching analytics:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testRoutes();
