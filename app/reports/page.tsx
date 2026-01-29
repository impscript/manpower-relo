'use client'

import { useState } from 'react'
import { FileText, Download, Loader2 } from 'lucide-react'
import { getReportData } from '@/lib/reports'

export default function ReportsPage() {
    const [loading, setLoading] = useState(false)

    const handleExport = async (reportType: string, filename: string) => {
        setLoading(true)
        try {
            const data = await getReportData(reportType)

            // Convert to CSV
            if (!data || data.length === 0) {
                alert('No data to export')
                return
            }

            const headers = Object.keys(data[0]).join(',')
            const rows = data.map(row => Object.values(row).map(value => `"${value}"`).join(','))
            const csvContent = [headers, ...rows].join('\n')

            // Trigger Download
            const blob = new Blob([csvContent], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

        } catch (error) {
            console.error(error)
            alert('Failed to export report')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">Reports</h2>
                <p className="text-gray-500 mt-1">Generate and export analytics data</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Turnover Report Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-48 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="p-3 bg-blue-50 rounded-xl w-fit mb-4">
                                <FileText className="text-blue-500" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Monthly Turnover</h3>
                            <p className="text-sm text-gray-500 mt-1">Detailed list of all movements (New Hire, Resignation, Transfer) with dates and reasons.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleExport('turnover_monthly', 'Turnover_Report')}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        Export CSV
                    </button>
                </div>

                {/* Employee Master Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-48 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="p-3 bg-green-50 rounded-xl w-fit mb-4">
                                <FileText className="text-green-500" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Employee Master</h3>
                            <p className="text-sm text-gray-500 mt-1">Full roster of all current active employees with demographic data.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleExport('employee_master', 'Employee_Master')}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        Export CSV
                    </button>
                </div>

                {/* Coming Soon */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 border-dashed flex flex-col items-center justify-center h-48 text-center">
                    <p className="text-gray-400 font-medium">More reports coming soon...</p>
                </div>
            </div>
        </div>
    )
}
