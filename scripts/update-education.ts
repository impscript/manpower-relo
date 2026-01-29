// Update education levels from raw data
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
    const lines = rawData.trim().split('\n').slice(1)

    const eduMap = new Map<string, string>()

    for (const line of lines) {
        const cols = line.split('\t')
        const empId = cols[2]?.trim()
        const eduRaw = cols[21]?.trim() || ''

        if (!empId || empId === '.') continue

        // Parse education level
        let edu: string | null = null
        if (eduRaw.includes('ป. โท') || eduRaw.includes('ป.โท')) edu = 'ป.โท'
        else if (eduRaw.includes('ป. ตรี') || eduRaw.includes('ป.ตรี')) edu = 'ป.ตรี'
        else if (eduRaw.includes('ปวส')) edu = 'ปวส.'
        else if (eduRaw.includes('ปวช')) edu = 'ปวช.'
        else if (eduRaw.includes('ม.6') || eduRaw.includes('ม. 6')) edu = 'ม.6'
        else if (eduRaw.includes('ม.3') || eduRaw.includes('ม. 3')) edu = 'ม.3'

        if (edu && !eduMap.has(empId)) {
            eduMap.set(empId, edu)
        }
    }

    console.log('Education entries found:', eduMap.size)

    let updated = 0
    for (const [empId, edu] of eduMap) {
        const { error } = await supabase
            .from('employee_master')
            .update({ education_level: edu })
            .eq('employee_id', empId)
        if (error) {
            console.error(empId, error.message)
        } else {
            updated++
        }
    }

    console.log('Updated:', updated)
}

main().catch(console.error)
