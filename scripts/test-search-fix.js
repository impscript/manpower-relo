require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSearchFix() {
    const query = 'John';
    console.log('Testing search fix with query:', query);

    // Step 1: Find matching employees
    const { data: employees, error: empError } = await supabase
        .from('employee_master')
        .select('employee_id')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);

    if (empError) {
        console.error('Error finding employees:', empError);
        return;
    }

    const empIds = employees.map(e => e.employee_id);
    console.log('Found matching IDs:', empIds);

    // Step 2: Search movements
    let dbQuery = supabase
        .from('movement_transactions')
        .select(`
          *,
          employee:employee_master!inner(first_name, last_name)
        `);

    // Construct OR condition
    // We want: movement_type matches OR employee_id matches OR employee_id IN (matching_ids)

    const conditions = [
        `movement_type.ilike.%${query}%`,
        `employee_id.ilike.%${query}%` // In case they search directly for ID
    ];

    if (empIds.length > 0) {
        // Syntax for IN within OR: employee_id.in.(id1,id2)
        // Note: employee_id is string, so we might need quotes? checking syntax
        // PostgREST: column.in.(val1,val2) - generic values should be url encoded or simple CSV if numbers.
        // For strings, usually (val1,val2) works if no commas in values.

        // Let's try explicit exact match ORs if the list is small, or just IN.
        // But .or() string takes a comma-separated list of conditions.
        // employee_id.in.("id1","id2")
        const idsList = empIds.map(id => `"${id}"`).join(',');
        conditions.push(`employee_id.in.(${idsList})`);
    }

    const orString = conditions.join(',');
    console.log('OR String:', orString);

    dbQuery = dbQuery.or(orString);

    const { data, error } = await dbQuery.range(0, 9);

    if (error) {
        console.error('Supabase Error:', error);
    } else {
        console.log('Success:', data.length, 'records found');
        console.log(data.map(d => `${d.movement_type} - ${d.employee_id}`));
    }
}

testSearchFix();
