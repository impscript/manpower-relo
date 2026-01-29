'use server'

import { createClient } from '@/utils/supabase/server'

// Date parsing utilities
function parseThaiDate(dateStr: string): string | null {
    if (!dateStr || dateStr.trim() === '' || dateStr === '-') return null

    // Format: "4 June 1999" or "17 May 2022"
    const months: Record<string, string> = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
    }

    const parts = dateStr.trim().split(' ')
    if (parts.length !== 3) return null

    const day = parts[0].padStart(2, '0')
    const month = months[parts[1].toLowerCase()]
    const year = parts[2]

    if (!month) return null

    return `${year}-${month}-${day}`
}

// Movement type mapping
function parseMovementType(rawType: string): string {
    const type = rawType.trim().toLowerCase()

    if (type.includes('new hired')) return 'New Hired'
    if (type.includes('voluntary resignation')) return 'Voluntary Resignation'
    if (type.includes('involuntary resignation') || type.includes('mutual contract')) return 'Involuntary Resignation'
    if (type.includes('transfer') && type.includes('in')) return 'Transfer-In'
    if (type.includes('transfer') && type.includes('out')) return 'Transfer-Out'
    if (type.includes('retirement')) return 'Retirement'

    return 'New Hired' // default
}

// Clean name (remove quotes and extra spaces)
function cleanName(name: string): string {
    return name.replace(/"/g, '').trim()
}

// Parse position level to get just the name
function parsePositionLevel(level: string): string {
    // "6. Officer" -> "Officer"
    return level.replace(/^\d+\.\s*/, '').trim()
}

// Parse leaving reason (extract just the code)
function parseLeavingReason(rawReason: string): string | null {
    if (!rawReason || rawReason.trim() === '') return null

    // "5 - ความก้าวหน้า" -> "5"
    const match = rawReason.match(/^(\d+)\s*-\s*.+$/)
    if (match) return match[1]

    // If no match but short enough, return as is (e.g. "Other")
    const trimmed = rawReason.trim()
    if (trimmed.length <= 10) return trimmed

    // If too long and no code pattern, return generic code "99" (Other) or null to avoid DB error
    return '99'
}

// Parse education level
function parseEducationLevel(rawEdu: string): string {
    if (!rawEdu) return ''
    const edu = rawEdu.trim().toLowerCase()
    if (edu.includes('ป. เอก') || edu.includes('phd') || edu.includes('ดร.')) return 'ป. เอก'
    if (edu.includes('ป. โท') || edu.includes('master')) return 'ป. โท'
    if (edu.includes('ป. ตรี') || edu.includes('bachelor')) return 'ป. ตรี'
    if (edu.includes('ปวส')) return 'ปวส.'
    if (edu.includes('ปวช')) return 'ปวช.'
    return rawEdu.split(' ')[0] || ''
}

export interface RawDataRow {
    month: string
    movement_type: string
    employee_id: string
    first_name: string
    last_name: string
    gender: string
    position_title: string
    position_level: string
    section: string
    department: string
    business_unit: string
    site: string
    company: string
    birth_date: string
    onboard_date: string
    resigned_date: string
    education_level: string
    leaving_type: string
    leaving_reason: string
    remark: string
}

export interface ParsedEmployee {
    employee_id: string
    first_name: string
    last_name: string
    birth_date: string | null
    gender: string
    education_level: string
    onboard_date: string | null
    resigned_date: string | null
    current_status: 'Active' | 'Resigned' | 'Terminated'
    // Organization text values (will be converted to IDs)
    section_name: string
    department_name: string
    business_unit_name: string
    site_name: string
    company_name: string
}

export interface ParsedMovement {
    employee_id: string
    movement_type: string
    effective_date: string | null
    position_title: string
    position_level: string
    reason_code: string | null
    reason_detail: string | null
    org_id: number
    section: string
    department: string
}

export interface ImportResult {
    success: boolean
    employees: {
        total: number
        inserted: number
        updated: number
        errors: string[]
    }
    movements: {
        total: number
        inserted: number
        errors: string[]
    }
}

// Lookup caches
interface LookupCaches {
    sections: Map<string, number>
    departments: Map<string, number>
    businessUnits: Map<string, number>
    sites: Map<string, number>
    companies: Map<string, number>
}

async function loadLookupCaches(supabase: any): Promise<LookupCaches> {
    const [secRes, deptRes, buRes, siteRes, compRes] = await Promise.all([
        supabase.from('sections').select('id, name'),
        supabase.from('departments').select('id, name'),
        supabase.from('business_units').select('id, name, code'),
        supabase.from('sites').select('id, name, code'),
        supabase.from('companies').select('id, name, code')
    ])

    const toMap = (data: any[], useCode = false) => {
        const map = new Map<string, number>()
        for (const item of data || []) {
            map.set(item.name.toLowerCase(), item.id)
            if (useCode && item.code) {
                map.set(item.code.toLowerCase(), item.id)
            }
        }
        return map
    }

    return {
        sections: toMap(secRes.data),
        departments: toMap(deptRes.data),
        businessUnits: toMap(buRes.data, true),
        sites: toMap(siteRes.data, true),
        companies: toMap(compRes.data, true)
    }
}

async function ensureMasterDataExists(supabase: any, data: {
    sections: Set<string>,
    departments: Set<string>,
    businessUnits: Set<string>,
    sites: Set<string>,
    companies: Set<string>
}) {
    // Helper to insert if not exists
    const ensure = async (table: string, names: Set<string>, isCode = false) => {
        if (names.size === 0) return

        // Fetch existing
        const { data: existing } = await supabase.from(table).select('name')
        const existingNames = new Set(existing?.map((r: any) => r.name.toLowerCase()))

        const toInsert: any[] = []
        names.forEach(name => {
            if (!existingNames.has(name.toLowerCase())) {
                const row: any = { name, is_active: true }
                if (isCode) row.code = name // Simple default for code
                toInsert.push(row)
            }
        })

        if (toInsert.length > 0) {
            console.log(`Auto-creating ${toInsert.length} records in ${table}`)
            const { error } = await supabase.from(table).insert(toInsert)
            if (error) console.error(`Error creating in ${table}:`, error)
        }
    }

    await Promise.all([
        ensure('sections', data.sections),
        ensure('departments', data.departments),
        ensure('business_units', data.businessUnits, true),
        ensure('sites', data.sites, true),
        ensure('companies', data.companies, true)
    ])
}

function lookupId(cache: Map<string, number>, name: string): number | null {
    if (!name) return null
    return cache.get(name.toLowerCase()) || null
}

export async function parseRawData(text: string): Promise<{
    employees: ParsedEmployee[]
    movements: ParsedMovement[]
    warnings: string[]
}> {
    const lines = text.trim().split('\n')
    const warnings: string[] = []

    // Detect delimiter (Tab or Comma)
    const firstLine = lines.find(l => l.trim().length > 0) || ''
    const isTsv = firstLine.split('\t').length > 5
    const delimiter = isTsv ? '\t' : ','

    // Helper to parse CSV line with quotes
    const parseLine = (text: string): string[] => {
        if (isTsv) return text.split('\t')

        const result: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < text.length; i++) {
            const char = text[i]
            if (char === '"') {
                if (inQuotes && text[i + 1] === '"') {
                    current += '"' // Escaped quote
                    i++
                } else {
                    inQuotes = !inQuotes
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current)
                current = ''
            } else {
                current += char
            }
        }
        result.push(current)
        return result
    }

    // Skip header row
    const dataLines = lines.slice(1).filter(line => line.trim() !== '')

    const employeeMap = new Map<string, ParsedEmployee>()
    const movements: ParsedMovement[] = []

    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i]
        // Clean line: remove \r if present
        const cols = parseLine(line.replace(/\r$/, ''))

        // We expect about 25 columns, but accept slight variations if key data exists
        if (cols.length < 10) {
            warnings.push(`Row ${i + 2}: Not enough columns (${cols.length})`)
            continue
        }

        const rawRow: RawDataRow = {
            month: cols[0] || '',
            movement_type: cols[1] || '',
            employee_id: cols[2] || '',
            first_name: cleanName(cols[3] || ''),
            last_name: cleanName(cols[4] || ''),
            // Gender is at index 5
            gender: cols[5] || '',
            position_title: cols[6] || '',
            position_level: cols[7] || '',
            section: cols[8] || '',
            department: cols[9] || '',
            business_unit: cols[10] || '',
            site: cols[11] || '',
            company: cols[12] || '',
            birth_date: cols[13] || '',
            // Skip 14(Age), 15(Service), 16(Gen)
            onboard_date: cols[17] || '',
            resigned_date: cols[18] || '',
            // Skip 19, 20, 21
            education_level: cols[22] || '',
            leaving_type: cols[23] || '',
            leaving_reason: cols[24] || '',
            remark: cols[25] || ''
        }

        // Skip empty employee IDs
        if (!rawRow.employee_id || rawRow.employee_id === '.') continue

        const movementType = parseMovementType(rawRow.movement_type)
        const isNewHire = movementType === 'New Hired' || movementType === 'Transfer-In'
        const isLeaving = ['Voluntary Resignation', 'Involuntary Resignation', 'Retirement', 'Transfer-Out'].includes(movementType)

        // Determine current status
        let currentStatus: 'Active' | 'Resigned' | 'Terminated' = 'Active'
        if (isLeaving) {
            currentStatus = movementType === 'Involuntary Resignation' ? 'Terminated' : 'Resigned'
        }

        // Update or create employee
        const existingEmp = employeeMap.get(rawRow.employee_id)
        if (!existingEmp || isNewHire) {
            // For new hires, use this record's data
            employeeMap.set(rawRow.employee_id, {
                employee_id: rawRow.employee_id,
                first_name: rawRow.first_name,
                last_name: rawRow.last_name,
                birth_date: parseThaiDate(rawRow.birth_date),
                gender: rawRow.gender || '',
                education_level: parseEducationLevel(rawRow.education_level),
                onboard_date: parseThaiDate(rawRow.onboard_date),
                resigned_date: isLeaving ? parseThaiDate(rawRow.resigned_date) : null,
                current_status: existingEmp?.current_status === 'Resigned' || existingEmp?.current_status === 'Terminated'
                    ? existingEmp.current_status
                    : currentStatus,
                section_name: rawRow.section,
                department_name: rawRow.department,
                business_unit_name: rawRow.business_unit,
                site_name: rawRow.site,
                company_name: rawRow.company
            })
        } else if (isLeaving) {
            // Update status and resigned date
            existingEmp.current_status = currentStatus
            existingEmp.resigned_date = parseThaiDate(rawRow.resigned_date)
        }

        // Create movement record
        const effectiveDate = isLeaving
            ? parseThaiDate(rawRow.resigned_date)
            : parseThaiDate(rawRow.onboard_date)

        movements.push({
            employee_id: rawRow.employee_id,
            movement_type: movementType,
            effective_date: effectiveDate,
            position_title: rawRow.position_title,
            position_level: parsePositionLevel(rawRow.position_level),
            reason_code: parseLeavingReason(rawRow.leaving_reason),
            reason_detail: rawRow.remark || null,
            org_id: 1, // Default org
            section: rawRow.section,
            department: rawRow.department
        })
    }

    return {
        employees: Array.from(employeeMap.values()),
        movements,
        warnings
    }
}

export async function importRawData(text: string): Promise<ImportResult> {
    const supabase = await createClient()
    const { employees, movements, warnings } = await parseRawData(text)

    // 1. Extract unique master data from parsed results
    const uniqueMasterData = {
        sections: new Set<string>(),
        departments: new Set<string>(),
        businessUnits: new Set<string>(),
        sites: new Set<string>(),
        companies: new Set<string>()
    }

    employees.forEach(emp => {
        if (emp.section_name) uniqueMasterData.sections.add(emp.section_name)
        if (emp.department_name) uniqueMasterData.departments.add(emp.department_name)
        if (emp.business_unit_name) uniqueMasterData.businessUnits.add(emp.business_unit_name)
        if (emp.site_name) uniqueMasterData.sites.add(emp.site_name)
        if (emp.company_name) uniqueMasterData.companies.add(emp.company_name)
    })

    // 2. Ensure Master Data Exists (Auto-create missing)
    try {
        await ensureMasterDataExists(supabase, uniqueMasterData)
    } catch (e) {
        console.error('Failed to auto-create master data:', e)
        // We continue, but some lookups might fail
    }

    // 3. Load lookup caches for FK resolution
    const caches = await loadLookupCaches(supabase)

    const result: ImportResult = {
        success: true,
        employees: { total: employees.length, inserted: 0, updated: 0, errors: [...warnings] },
        movements: { total: movements.length, inserted: 0, errors: [] }
    }

    // Import employees with FK resolution
    for (const emp of employees) {
        try {
            const employeeData = {
                employee_id: emp.employee_id,
                first_name: emp.first_name,
                last_name: emp.last_name,
                birth_date: emp.birth_date,
                gender: emp.gender || null,
                education_level: emp.education_level || null,
                onboard_date: emp.onboard_date,
                resigned_date: emp.resigned_date,
                current_status: emp.current_status,
                section_id: lookupId(caches.sections, emp.section_name),
                department_id: lookupId(caches.departments, emp.department_name),
                business_unit_id: lookupId(caches.businessUnits, emp.business_unit_name),
                site_id: lookupId(caches.sites, emp.site_name),
                company_id: lookupId(caches.companies, emp.company_name)
            }

            const { error } = await supabase
                .from('employee_master')
                .upsert(employeeData, { onConflict: 'employee_id' })

            if (error) {
                result.employees.errors.push(`Employee ${emp.employee_id}: ${error.message}`)
            } else {
                result.employees.inserted++
            }
        } catch (e) {
            result.employees.errors.push(`Employee ${emp.employee_id}: ${e}`)
        }
    }

    // Import movements
    for (const mov of movements) {
        try {
            // Check for duplicate (same employee, type, date)
            const { data: existing } = await supabase
                .from('movement_transactions')
                .select('transaction_id')
                .eq('employee_id', mov.employee_id)
                .eq('movement_type', mov.movement_type)
                .eq('effective_date', mov.effective_date as string) // safe cast as we parsed it
                .single()

            if (existing) {
                // Skip if exists
                continue
            }

            const { error } = await supabase
                .from('movement_transactions')
                .insert(mov)

            if (error) {
                result.movements.errors.push(`Movement for ${mov.employee_id}: ${error.message}`)
            } else {
                result.movements.inserted++
            }
        } catch (e) {
            result.movements.errors.push(`Movement for ${mov.employee_id}: ${e}`)
        }
    }


    result.success = result.employees.errors.length === 0 && result.movements.errors.length === 0

    return result
}
