require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSearch() {
    const query = 'John';
    console.log('Testing search with query:', query);

    let dbQuery = supabase
        .from('movement_transactions')
        .select(`
          *,
          employee:employee_master!inner(first_name, last_name)
        `, { count: 'exact' });

    // Replicating the logic from lib/actions.ts
    // This syntax is likely the culprit
    const searchCondition = `employee_id.ilike.%${query}%,movement_type.ilike.%${query}%,employee.first_name.ilike.%${query}%,employee.last_name.ilike.%${query}%`;

    dbQuery = dbQuery.or(searchCondition);

    const { data, error } = await dbQuery.range(0, 9);

    if (error) {
        console.error('Supabase Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Success:', data.length, 'records found');
    }
}

testSearch();
