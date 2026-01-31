const supabase = require('../config/supabase');

const checkLatest = async () => {
    try {
        console.log('Fetching latest script from Supabase...');
        const { data, error } = await supabase
            .from('scripts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching script:', error.message);
            return;
        }

        console.log('Latest Script ID:', data.id);
        console.log('Video ID:', data.video_id);

        const content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
        const segments = content.raw_transcript.segments;

        console.log(`Segments Count: ${segments ? segments.length : 0}`);
        if (segments && segments.length > 0) {
            console.log('Sample Segment:', segments[0]);
        } else {
            console.log('⚠️  Segments are EMPTY in the latest entry.');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
};

checkLatest();
