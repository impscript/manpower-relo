require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    console.log('Checking reason_code column length...');
    const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, character_maximum_length')
        .eq('table_name', 'movement_transactions')
        .eq('column_name', 'reason_code');

    if (error) {
        console.error('Error accessing information_schema:', error.message);
    } else {
        console.log('Column info:', data);
    }
}

check();
