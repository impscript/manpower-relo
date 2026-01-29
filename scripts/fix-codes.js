require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixCodes() {
    console.log('Fixing leaving_reasons codes to fit VARCHAR(10)...');

    const updates = [
        { id: 2, code: 'benefits', name: 'เงินเดือนและสวัสดิการ' }, // Was compensation (12)
        { id: 3, code: 'growth', name: 'ความก้าวหน้า' }, // Was career_growth (13)
        { id: 1, code: 'supervisor', name: 'หัวหน้างาน' }, // 10 chars - verify specific ID
        { id: 4, code: 'job_nature', name: 'ลักษณะงาน' }, // 10 chars
    ];

    for (const update of updates) {
        const { error } = await supabase
            .from('leaving_reasons')
            .update({ code: update.code })
            .eq('id', update.id);

        if (error) {
            console.error(`Failed to update ID ${update.id}:`, error.message);
        } else {
            console.log(`Updated ID ${update.id} to code '${update.code}'`);
        }
    }
}

fixCodes();
