require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testExportQuery() {
    console.log('Testing Export Query...');

    const { data, error } = await supabase
        .from('employee_master')
        .select(`
            employee_id,
            first_name,
            last_name,
            department:department_master(name),
            section:section_master(name),
            site:site_master(name),
            company:company_master(name)
        `)
        .limit(5);

    if (error) {
        console.error('❌ Query Failed:', error);
    } else {
        console.log('✅ Query Success!');
        console.log(JSON.stringify(data[0], null, 2));
    }
}

testExportQuery();
