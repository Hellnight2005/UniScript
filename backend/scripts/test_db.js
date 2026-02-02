const supabase = require('../config/supabase');

async function testConnection() {
    console.log('Testing Supabase Connection...');
    try {
        // Try to fetch connection info or just list videos (even if empty)
        const { data, error } = await supabase.from('videos').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed or Table Missing.');
            console.error('Error Details:', error);
            if (error.code === 'PGRST205') {
                console.error('\n⚠️  Specific Error: Table "videos" not found.');
                console.error('💡 Solution: Please run the contents of "supabase_schema.sql" in your Supabase SQL Editor.');
            }
        } else {
            console.log('✅ Connection Successful!');
            console.log('✅ Table "videos" exists and is accessible.');
        }

    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

testConnection();
