'use server'

import { createClient } from '@/utils/supabase/server'

export async function getReportData(reportType: string) {
    const supabase = await createClient()

    if (reportType === 'turnover_monthly') {
        const { data, error } = await supabase
            .from('movement_transactions')
            .select('*')
            .order('effective_date', { ascending: false })

        if (error) throw new Error('Failed to fetch movement data')
        return data
    }

    if (reportType === 'employee_master') {
        const { data, error } = await supabase
            .from('employee_master')
            .select('*')
            .order('employee_id', { ascending: true })

        if (error) throw new Error('Failed to fetch employee data')
        return data
    }

    return []
}
