const axios = require('axios');

const API_URL = 'http://localhost:5000/api/videos';
const VIDEO_ID = '0e8f2f15-01f2-43bd-a9d1-bd6a091786cf'; // From server logs

const checkScript = async () => {
    try {
        console.log(`Checking script for Video ID: ${VIDEO_ID}`);
        const res = await axios.get(`${API_URL}/${VIDEO_ID}/script`);

        console.log('✅ Script retrieved!');
        const content = res.data.content;
        const segments = content.raw_transcript.segments;

        console.log(`   Segments Count: ${segments ? segments.length : 'N/A'}`);

        if (segments && segments.length > 0) {
            console.log('   First Segment:', segments[0]);
            console.log('🎉 TIMESTAMPS VERIFIED!');
        } else {
            console.error('❌ No segments found.');
        }

    } catch (error) {
        console.error('Error fetching script:', error.message);
        if (error.response) console.error(error.response.data);
    }
};

checkScript();
