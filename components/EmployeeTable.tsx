'use client'

import { useState, useEffect } from 'react'
import { getEmployees, deleteEmployee, getMasterData, getAllEmployeesForExport } from '@/lib/actions'
import { Search, ChevronLeft, ChevronRight, Loader2, Edit, Trash2, User, UserCircle, Download } from 'lucide-react'
import type { Employee } from '@/lib/types'
import { downloadCSV } from '@/lib/export-utils'

// Gender icon component
function GenderIcon({ gender }: { gender: string | null }) {
    if (!gender) return <span className="text-gray-300">-</span>

    if (gender === 'Male') {
        return (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600" title="Male">
                ♂
            </span>
        )
    }
    return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 text-pink-600" title="Female">
            ♀
        </span>
    )
}

// Calculate age from birth date
function calculateAge(birthDate: string | null): string {
    if (!birthDate) return '-'
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
    }
    return `${age} ปี`
}

// Calculate service years
function calculateServiceYears(onboardDate: string | null, resignedDate: string | null): string {
    if (!onboardDate) return '-'
    const start = new Date(onboardDate)
    const end = resignedDate ? new Date(resignedDate) : new Date()

    const years = end.getFullYear() - start.getFullYear()
    const months = end.getMonth() - start.getMonth()

    let totalMonths = years * 12 + months
    if (totalMonths < 0) totalMonths = 0

    const y = Math.floor(totalMonths / 12)
    const m = totalMonths % 12

    if (y === 0) return `${m} เดือน`
    if (m === 0) return `${y} ปี`
    return `${y} ปี ${m} เดือน`
}

interface MasterDataLookup {
    departments: Map<number, string>
    sections: Map<number, string>
    sites: Map<number, string>
    companies: Map<number, string>
}

interface EmployeeTableProps {
    onEdit?: (employee: Employee) => void
}

export function EmployeeTable({ onEdit }: EmployeeTableProps) {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [lookup, setLookup] = useState<MasterDataLookup | null>(null)

    // Load lookup data
    useEffect(() => {
        async function loadLookup() {
            try {
                const [depts, sections, sites, companies] = await Promise.all([
                    getMasterData('departments'),
                    getMasterData('sections'),
                    getMasterData('sites'),
                    getMasterData('companies')
                ])

                setLookup({
                    departments: new Map(depts.map(d => [d.id as number, d.name])),
                    sections: new Map(sections.map(s => [s.id as number, s.name])),
                    sites: new Map(sites.map(s => [s.id as number, s.code || s.name])),
                    companies: new Map(companies.map(c => [c.id as number, c.code || c.name]))
                })
            } catch (e) {
                console.error('Failed to load lookup:', e)
            }
        }
        loadLookup()
    }, [])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData()
        }, 500)
        return () => clearTimeout(timer)
    }, [query, page])

    async function fetchData() {
        setLoading(true)
        try {
            const result = await getEmployees(query, page)
            setEmployees(result.data)
            setTotalPages(result.totalPages)
            setTotalCount(result.totalCount)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        try {
            await deleteEmployee(id)
            fetchData() // Refresh
        } catch (e) {
            alert('Failed to delete')
        }
    }

    // Helper to get lookup value
    const getDeptName = (id: number | null) => id && lookup?.departments.get(id) || '-'
    const getSectionName = (id: number | null) => id && lookup?.sections.get(id) || '-'
    const getSiteCode = (id: number | null) => id && lookup?.sites.get(id) || '-'
    const getCompanyCode = (id: number | null) => id && lookup?.companies.get(id) || '-'

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, ID, department, section..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setPage(1) // Reset to first page on search
                        }}
                    />
                </div>
                <div className="text-sm text-gray-500">
                    {totalCount} employees
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-h-[500px]">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 w-24">ID</th>
                            <th className="px-4 py-3 w-10 text-center">
                                <UserCircle size={14} className="inline" />
                            </th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Department</th>
                            <th className="px-4 py-3">Section</th>
                            <th className="px-4 py-3 w-20 text-center">Site</th>
                            <th className="px-4 py-3 w-20 text-center">Company</th>
                            <th className="px-4 py-3 w-24 text-center">Age</th>
                            <th className="px-4 py-3 w-28">Service</th>
                            <th className="px-4 py-3 w-24">Status</th>
                            <th className="px-4 py-3 text-right w-20">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={11} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <Loader2 className="animate-spin mb-2" size={32} />
                                        Loading employees...
                                    </div>
                                </td>
                            </tr>
                        ) : employees.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="h-64 text-center text-gray-400">
                                    No employees found.
                                </td>
                            </tr>
                        ) : (
                            employees.map((emp) => (
                                <tr key={emp.employee_id} className="hover:bg-gray-50 transition group">
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.employee_id}</td>
                                    <td className="px-4 py-3 text-center">
                                        <GenderIcon gender={emp.gender} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-900">{emp.first_name} {emp.last_name}</div>
                                        <div className="text-xs text-gray-400">{emp.education_level || '-'}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">
                                        {getDeptName(emp.department_id)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">
                                        {getSectionName(emp.section_id)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                                            {getSiteCode(emp.site_id)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="px-2 py-0.5 bg-blue-50 rounded text-xs font-medium text-blue-600">
                                            {getCompanyCode(emp.company_id)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-xs text-center">
                                        {calculateAge(emp.birth_date)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">
                                        {calculateServiceYears(emp.onboard_date, emp.resigned_date)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.current_status === 'Active' ? 'bg-green-100 text-green-700' :
                                            emp.current_status === 'Resigned' ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {emp.current_status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={() => onEdit?.(emp)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emp.employee_id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    )
}
