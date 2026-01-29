// Seed script - run once to import raw data
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)


async function main() {
    const rawData = fs.readFileSync('/Users/delta/Documents/-- VibeCode/Hr/Manpower/raw_data.md', 'utf8')
    const lines = rawData.trim().split('\n').slice(1) // Skip header

    const employeeMap = new Map<string, any>()
    const movements: any[] = []

    // Load lookup tables
    const { data: sections } = await supabase.from('sections').select('id, name')
    const { data: departments } = await supabase.from('departments').select('id, name')
    const { data: sites } = await supabase.from('sites').select('id, code')
    const { data: companies } = await supabase.from('companies').select('id, code')

    const sectionMap = new Map(sections?.map(s => [s.name, s.id]) || [])
    const deptMap = new Map(departments?.map(d => [d.name, d.id]) || [])
    const siteMap = new Map(sites?.map(s => [s.code, s.id]) || [])
    const companyMap = new Map(companies?.map(c => [c.code, c.id]) || [])

    console.log('Lookup maps loaded:', sectionMap.size, deptMap.size, siteMap.size, companyMap.size)

    function parseThaiDate(dateStr: string): string | null {
        if (!dateStr || dateStr.trim() === '' || dateStr === '-') return null
        try {
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return null
            return d.toISOString().split('T')[0]
        } catch {
            return null
        }
    }

    function parseMovementType(raw: string): string {
        const types: { [key: string]: string } = {
            '1 - New Hired': 'New Hired',
            '2 - Voluntary Resignation': 'Voluntary Resignation',
            '3 - Involuntary Resignation': 'Involuntary Resignation',
            '4 - Retirement': 'Retirement',
            '5 - Transfer - Out': 'Transfer-Out',
            '6 - Transfer - In': 'Transfer-In',
            '9 - Transfer': 'Transfer-Out'
        }
        for (const [key, val] of Object.entries(types)) {
            if (raw.includes(key.split(' ')[0])) return val
        }
        return raw
    }

    for (const line of lines) {
        const cols = line.split('\t')
        if (cols.length < 17) continue

        const empId = cols[2]?.trim()
        if (!empId || empId === '.') continue

        const firstName = cols[3]?.trim()
        const lastName = cols[4]?.trim()
        const section = cols[7]?.trim()
        const department = cols[8]?.trim()
        const site = cols[10]?.trim()
        const company = cols[11]?.trim()
        const birthDate = cols[12]?.trim()
        const onboardDate = cols[16]?.trim()
        const resignedDate = cols[17]?.trim()
        const movementType = parseMovementType(cols[1]?.trim() || '')

        const isLeaving = ['Voluntary Resignation', 'Involuntary Resignation', 'Retirement', 'Transfer-Out'].includes(movementType)

        // Update employee
        if (!employeeMap.has(empId) || movementType === 'New Hired') {
            employeeMap.set(empId, {
                employee_id: empId,
                first_name: firstName,
                last_name: lastName,
                birth_date: parseThaiDate(birthDate),
                onboard_date: parseThaiDate(onboardDate),
                resigned_date: isLeaving ? parseThaiDate(resignedDate) : null,
                current_status: isLeaving ? (movementType === 'Involuntary Resignation' ? 'Terminated' : 'Resigned') : 'Active',
                section_id: sectionMap.get(section) || null,
                department_id: deptMap.get(department) || null,
                site_id: siteMap.get(site) || null,
                company_id: companyMap.get(company) || null
            })
        } else if (isLeaving) {
            const emp = employeeMap.get(empId)!
            emp.current_status = movementType === 'Involuntary Resignation' ? 'Terminated' : 'Resigned'
            emp.resigned_date = parseThaiDate(resignedDate)
        }

        // Add movement
        movements.push({
            employee_id: empId,
            movement_type: movementType,
            effective_date: isLeaving ? parseThaiDate(resignedDate) : parseThaiDate(onboardDate),
            position_title: cols[5]?.trim(),
            position_level: cols[6]?.trim(),
            section: section,
            department: department,
            org_id: 1
        })
    }

    console.log('Parsed employees:', employeeMap.size)
    console.log('Parsed movements:', movements.length)

    // Insert employees
    const employees = Array.from(employeeMap.values())
    const { error: empError } = await supabase.from('employee_master').upsert(employees, { onConflict: 'employee_id' })
    if (empError) {
        console.error('Employee insert error:', empError)
    } else {
        console.log('Employees inserted:', employees.length)
    }

    // Insert movements
    const { error: movError } = await supabase.from('movement_transactions').insert(movements)
    if (movError) {
        console.error('Movement insert error:', movError)
    } else {
        console.log('Movements inserted:', movements.length)
    }
}

main().catch(console.error)
