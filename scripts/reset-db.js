
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
    console.log('Clearing movement_transactions...');
    const { error: movError } = await supabase.from('movement_transactions').delete().neq('transaction_id', 0); // Delete all
    if (movError) console.error('Error clearing movements:', movError);
    else console.log('Movements cleared.');

    console.log('Clearing employee_master...');
    const { error: empError } = await supabase.from('employee_master').delete().neq('employee_id', '0');
    if (empError) console.error('Error clearing employees:', empError);
    else console.log('Employees cleared.');
}

reset();
