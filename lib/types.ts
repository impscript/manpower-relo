// TypeScript type definitions for Manpower Dashboard

export interface Employee {
    employee_id: string
    first_name: string
    last_name: string
    birth_date: string | null
    gender: string | null
    education_level: string | null
    onboard_date: string | null
    resigned_date: string | null
    current_status: 'Active' | 'Resigned' | 'Terminated'
    // Organization references
    section_id: number | null
    department_id: number | null
    business_unit_id: number | null
    site_id: number | null
    company_id: number | null
}



export interface Organization {
    org_id: number
    company_name: string
    department: string
    section: string
    site_area: string
}

export interface MovementTransaction {
    transaction_id: number
    employee_id: string
    movement_type: string
    effective_date: string
    position_title: string
    position_level: string
    reason_code: string | null
    reason_detail: string | null
    org_id: number
    employee?: Employee
}

export interface PositionLevel {
    id: number
    level_code: string
    level_name: string
    sort_order: number
    is_active: boolean
    created_at: string
}

export interface PaginatedResult<T> {
    data: T[]
    totalCount: number
    totalPages: number
}

export type MovementType =
    | 'New Hired'
    | 'Voluntary Resignation'
    | 'Involuntary Resignation'
    | 'Transfer-In'
    | 'Transfer-Out'
    | 'Retirement'

export const MOVEMENT_TYPES: MovementType[] = [
    'New Hired',
    'Voluntary Resignation',
    'Involuntary Resignation',
    'Transfer-In',
    'Transfer-Out',
    'Retirement'
]

export interface ImportPreview {
    valid: boolean
    data: Record<string, string>[]
    errors: string[]
}
