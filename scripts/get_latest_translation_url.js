const supabase = require('../config/supabase');

const getLatestUrl = async () => {
    try {
        const { data, error } = await supabase
            .from('translations')
            .select('id, target_language')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            console.log("\n❌ No translations found in the database yet.");
            console.log("👉 URL Format: http://localhost:5000/api/videos/translations/<TRANSLATION_UUID>/download");
            return;
        }

        console.log("\n✅ Found Latest Translation!");
        console.log("----------------------------------------");
        console.log(`ID:       ${data.id}`);
        console.log(`Language: ${data.target_language}`);
        console.log("\n📋 COPY THIS URL FOR POSTMAN:");
        console.log(`http://localhost:5000/api/videos/translations/${data.id}/download?format=srt`);
        console.log("----------------------------------------");

    } catch (err) {
        console.error("Error:", err.message);
    }
};

getLatestUrl();
