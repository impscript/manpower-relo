
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Or service role if needed, but anon should work for reading if RLS allows or using service role from env

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('Inspecting movement_transactions...');

    const { data: movements, error } = await supabase
        .from('movement_transactions')
        .select('transaction_id, movement_type, reason_code, reason_detail')
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${movements.length} records.`);
    movements.forEach(m => {
        console.log(`ID: ${m.transaction_id}, Type: ${m.movement_type}, Code: ${JSON.stringify(m.reason_code)}, Detail: ${JSON.stringify(m.reason_detail)}`);
    });

    // Count non-null reasons
    const { count, error: countError } = await supabase
        .from('movement_transactions')
        .select('*', { count: 'exact', head: true })
        .not('reason_code', 'is', null);

    console.log(`Total records with reason_code: ${count}`);
}

inspect();
