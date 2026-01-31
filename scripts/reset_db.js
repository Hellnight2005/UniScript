const supabase = require('../config/supabase');
const fs = require('fs');
const path = require('path');

const clearDirectory = (dirPath) => {
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            // Keep .gitkeep if it exists, delete everything else
            if (file !== '.gitkeep') {
                fs.unlinkSync(path.join(dirPath, file));
            }
        }
        console.log(`✅ Cleared directory: ${dirPath}`);
    }
};

const resetDb = async () => {
    console.log('🗑️  Clearing all entries from "translations", "scripts", and "videos" tables...');

    // Delete in order to respect foreign keys (though cascade should handle it, explicit is safer for debugging)
    const { error: error1 } = await supabase.from('translations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: error2 } = await supabase.from('scripts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: error3 } = await supabase.from('videos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (error1 || error2 || error3) {
        console.error('❌ Error clearing database:', error1 || error2 || error3);
    } else {
        console.log('✅ Database cleared successfully.');

        // Clear file system
        clearDirectory(path.join(__dirname, '../uploads'));
        clearDirectory(path.join(__dirname, '../processed'));
    }
};

resetDb();
