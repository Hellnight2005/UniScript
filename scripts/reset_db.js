const supabase = require('../config/supabase');

const resetDb = async () => {
    console.log('🗑️  Clearing all entries from "videos" table...');

    const { error } = await supabase
        .from('videos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (error) {
        console.error('❌ Error clearing database:', error);
    } else {
        console.log('✅ Database cleared successfully.');
    }
};

resetDb();
