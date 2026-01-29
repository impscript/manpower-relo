
import { createClient } from '@/utils/supabase/server'

export type Employee = {
    employee_id: string
    first_name: string
    last_name: string
    birth_date: string
    gender: string
    education_level: string
    onboard_date: string
    current_status: string
}

export type Organization = {
    org_id: number
    company_name: string
    department: string
    section: string
    site_area: string
}

export type MovementTransaction = {
    transaction_id: number
    employee_id: string
    movement_type: string
    effective_date: string
    position_title: string
    position_level: string
    reason_code: string | null
    reason_detail: string | null
    org_id: number
}

export type EnrichedMovement = MovementTransaction & {
    employee: Employee
    organization: Organization
    service_year: number // in years
    service_days: number // in days
    generation: string
    is_probation_fail: boolean
    is_critical_turnover: boolean
}

// Helper: Calculate Age/Service Year
// Returns difference in years (float)
const calculateYearsDiff = (start: Date, end: Date): number => {
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return diffTime / (1000 * 60 * 60 * 24 * 365.25)
}

const calculateDaysDiff = (start: Date, end: Date): number => {
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Helper: Determine Generation
const getGeneration = (birthDate: string): string => {
    const year = new Date(birthDate).getFullYear()
    if (year >= 1997) return 'Gen Z'
    if (year >= 1981) return 'Gen Y'
    if (year >= 1965) return 'Gen X'
    return 'Baby Boomer'
}

export async function getDashboardData() {
    const supabase = await createClient()

    const { data: employees, error: empError } = await supabase.from('employee_master').select('*')
    if (empError) throw empError

    const { data: movements, error: movError } = await supabase.from('movement_transactions').select('*')
    if (movError) throw movError

    const { data: orgs, error: orgError } = await supabase.from('organization').select('*')
    if (orgError) throw orgError

    // Join and Process Data
    const enrichedMovements: EnrichedMovement[] = movements.map((mov) => {
        const emp = employees.find((e) => e.employee_id === mov.employee_id)
        const org = orgs.find((o) => o.org_id === mov.org_id)

        if (!emp || !org) {
            // Find missing reference, shouldn't occur with integrity constraints but for type safety
            return null as unknown as EnrichedMovement
        }

        const onboardDate = new Date(emp.onboard_date)
        const effectiveDate = new Date(mov.effective_date)
        // For active status check, we'd normally compare against CURRENT_DATE, 
        // but for movement record, we calculate service at the time of movement.
        // However, the spec says: 
        // IF movement_type IS 'Resignation' OR 'Termination' -> service_year = DATEDIF(onboard, effective)
        // IF current_status IS 'Active' -> service_year = DATEDIF(onboard, CURRENT_DATE)

        // Since this is a transaction log, let's calculate based on the context of the transaction.
        // If it's a resignation/transfer out, we use effective date.

        let endDate = effectiveDate
        // If it's strictly an active employee check (snapshot), we would use today. 
        // But here we are analyzing movements.

        const serviceYears = calculateYearsDiff(onboardDate, endDate)
        const serviceDays = calculateDaysDiff(onboardDate, endDate)

        // Risk Flagging
        const isProbationFail = serviceDays < 120
        const isCriticalTurnover = serviceYears >= 1.0 && serviceYears <= 3.0

        return {
            ...mov,
            employee: emp,
            organization: org,
            service_year: serviceYears,
            service_days: serviceDays,
            generation: getGeneration(emp.birth_date),
            is_probation_fail: isProbationFail,
            is_critical_turnover: isCriticalTurnover
        }
    }).filter(Boolean) as EnrichedMovement[]

    // Aggregations
    // 1. Employee Master Snapshot (Active Only)
    const activeEmployees = employees.filter(e => e.current_status === 'Active').map(emp => {
        return {
            ...emp,
            generation: getGeneration(emp.birth_date),
        }
    })

    return {
        employees: activeEmployees,
        movements: enrichedMovements,
        orgs
    }
}
