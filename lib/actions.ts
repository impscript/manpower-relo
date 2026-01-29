'use server'

import { createClient } from '@/utils/supabase/server'
import type { Employee, PositionLevel, PaginatedResult } from './types'

// ============ EMPLOYEES ============

export async function getEmployees(query: string = '', page: number = 1, pageSize: number = 10): Promise<PaginatedResult<Employee>> {
    const supabase = await createClient()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let dbQuery = supabase
        .from('employee_master')
        .select('*', { count: 'exact' })
        .order('onboard_date', { ascending: false })

    if (query) {
        dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,employee_id.ilike.%${query}%,education_level.ilike.%${query}%`)
    }

    const { data, count, error } = await dbQuery.range(from, to)

    if (error) {
        console.error('Error fetching employees:', error)
        throw new Error('Failed to fetch employees')
    }

    return {
        data: data || [],
        totalCount: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0
    }
}

export async function getAllEmployees(): Promise<Pick<Employee, 'employee_id' | 'first_name' | 'last_name'>[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('employee_master')
        .select('employee_id, first_name, last_name')
        .eq('current_status', 'Active')
        .order('first_name')

    if (error) {
        console.error('Error fetching all employees:', error)
        return []
    }

    return data || []
}

export async function deleteEmployee(employeeId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('employee_master').delete().eq('employee_id', employeeId)

    if (error) throw new Error('Failed to delete employee')
    return true
}

export async function upsertEmployee(data: Partial<Employee>) {
    const supabase = await createClient()

    if (!data.employee_id || !data.first_name || !data.last_name) {
        throw new Error('Missing required fields')
    }

    const { error } = await supabase
        .from('employee_master')
        .upsert(data)
        .select()

    if (error) {
        console.error('Error upserting employee:', error)
        throw new Error('Failed to save employee')
    }

    return true
}

export async function bulkImportEmployees(employees: Partial<Employee>[]) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('employee_master')
        .upsert(employees)

    if (error) {
        console.error('Error bulk importing employees:', error)
        throw new Error(`Import failed: ${error.message}`)
    }

    return { success: true, count: employees.length }
}

// ============ MOVEMENTS ============

export async function getMovements(query: string = '', page: number = 1, pageSize: number = 10) {
    const supabase = await createClient()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let dbQuery = supabase
        .from('movement_transactions')
        .select(`
      *,
      employee:employee_master!inner(first_name, last_name)
    `, { count: 'exact' })
        .order('effective_date', { ascending: false })

    if (query) {
        // Step 1: Find matching employees
        const { data: employees } = await supabase
            .from('employee_master')
            .select('employee_id')
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)

        const empIds = employees?.map(e => e.employee_id) || []

        // Step 2: Construct OR condition
        const conditions = [
            `employee_id.ilike.%${query}%`,
            `movement_type.ilike.%${query}%`
        ]

        if (empIds.length > 0) {
            // Wrap IDs in double quotes for Supabase syntax
            const idsList = empIds.map(id => `"${id}"`).join(',')
            conditions.push(`employee_id.in.(${idsList})`)
        }

        dbQuery = dbQuery.or(conditions.join(','))
    }

    const { data, count, error } = await dbQuery.range(from, to)

    if (error) {
        console.error('Error fetching movements:', error)
        throw new Error('Failed to fetch movements')
    }

    return {
        data: data || [],
        totalCount: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0
    }
}

export async function createMovement(data: Record<string, unknown>) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('movement_transactions')
        .insert(data)

    if (error) {
        console.error('Error creating movement:', error)
        throw new Error('Failed to create movement')
    }

    return true
}

export async function updateMovement(id: number, data: Record<string, unknown>) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('movement_transactions')
        .update(data)
        .eq('transaction_id', id)

    if (error) {
        console.error('Error updating movement:', error)
        throw new Error('Failed to update movement')
    }

    return true
}

export async function deleteMovement(id: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('movement_transactions')
        .delete()
        .eq('transaction_id', id)

    if (error) {
        console.error('Error deleting movement:', error)
        throw new Error('Failed to delete movement')
    }

    return true
}

export async function getLeavingReasons() {
    return getMasterData('leaving_reasons')
}

export async function bulkImportMovements(movements: Record<string, unknown>[]) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('movement_transactions')
        .insert(movements)

    if (error) {
        console.error('Error bulk importing movements:', error)
        throw new Error(`Import failed: ${error.message}`)
    }

    return { success: true, count: movements.length }
}

// ============ POSITION LEVELS ============

export async function getPositionLevels(): Promise<PositionLevel[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('position_levels')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

    if (error) {
        console.error('Error fetching position levels:', error)
        throw new Error('Failed to fetch position levels')
    }

    return data || []
}

export async function getAllPositionLevels(): Promise<PositionLevel[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('position_levels')
        .select('*')
        .order('sort_order', { ascending: true })

    if (error) {
        console.error('Error fetching position levels:', error)
        throw new Error('Failed to fetch position levels')
    }

    return data || []
}

export async function upsertPositionLevel(data: Partial<PositionLevel>) {
    const supabase = await createClient()

    if (!data.level_code || !data.level_name) {
        throw new Error('Missing required fields: level_code and level_name')
    }

    const { error } = await supabase
        .from('position_levels')
        .upsert(data)
        .select()

    if (error) {
        console.error('Error upserting position level:', error)
        throw new Error('Failed to save position level')
    }

    return true
}

export async function deletePositionLevel(id: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('position_levels')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting position level:', error)
        throw new Error('Failed to delete position level')
    }

    return true
}

// ============ GENERIC MASTER DATA CRUD ============

type MasterDataTable = 'departments' | 'sections' | 'business_units' | 'sites' | 'companies' | 'leaving_types' | 'leaving_reasons' | 'movement_types'

export interface MasterDataRecord {
    id?: number
    code?: string
    name: string
    sort_order?: number
    is_active?: boolean
}

export async function getMasterData(table: MasterDataTable): Promise<MasterDataRecord[]> {
    const supabase = await createClient()

    // Tables that have sort_order column
    const tablesWithSortOrder = ['movement_types', 'leaving_types', 'leaving_reasons', 'position_levels']

    let query = supabase.from(table).select('*')

    // Only apply sort_order for tables that have it
    if (tablesWithSortOrder.includes(table)) {
        query = query.order('sort_order', { ascending: true, nullsFirst: false })
    }
    query = query.order('name', { ascending: true })

    const { data, error } = await query

    if (error) {
        console.error(`Error fetching ${table}:`, error)
        return []
    }

    return data || []
}


export async function upsertMasterData(table: MasterDataTable, record: MasterDataRecord) {
    const supabase = await createClient()

    if (!record.name) {
        throw new Error('Name is required')
    }

    // Clean up record - remove fields that don't exist in certain tables
    const cleanRecord: any = {
        name: record.name,
        is_active: record.is_active ?? true
    }

    // Add id if updating
    if (record.id) {
        cleanRecord.id = record.id
    }

    // Tables with code field
    const tablesWithCode = ['sites', 'companies', 'business_units', 'movement_types', 'leaving_types', 'leaving_reasons']
    if (tablesWithCode.includes(table) && record.code) {
        cleanRecord.code = record.code
    }

    // Tables with sort_order field
    const tablesWithSortOrder = ['movement_types', 'leaving_types', 'leaving_reasons', 'position_levels']
    if (tablesWithSortOrder.includes(table) && record.sort_order !== undefined) {
        cleanRecord.sort_order = record.sort_order
    }

    const { error } = await supabase
        .from(table)
        .upsert(cleanRecord)
        .select()

    if (error) {
        console.error(`Error upserting ${table}:`, error)
        throw new Error(`Failed to save: ${error.message}`)
    }

    return true
}

export async function deleteMasterData(table: MasterDataTable, id: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

    if (error) {
        console.error(`Error deleting from ${table}:`, error)
        throw new Error(`Failed to delete: ${error.message}`)
    }

    return true
}

export async function toggleMasterDataActive(table: MasterDataTable, id: number, is_active: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from(table)
        .update({ is_active })
        .eq('id', id)

    if (error) {
        console.error(`Error toggling ${table}:`, error)
        throw new Error(`Failed to update: ${error.message}`)
    }

    return true
}
