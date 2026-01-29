'use client'

import { useState, useEffect } from 'react'
import { getMovements, deleteMovement, getLeavingReasons, type MasterDataRecord } from '@/lib/actions'
import { ChevronLeft, ChevronRight, Loader2, Pencil, Trash2, Search } from 'lucide-react'
import type { MovementTransaction } from '@/lib/types'

interface MovementTableProps {
    onEdit?: (movement: MovementTransaction) => void
    key?: number
}

export function MovementTable({ onEdit }: MovementTableProps) {
    const [movements, setMovements] = useState<(MovementTransaction & { employee?: { first_name: string; last_name: string } })[]>([])
    const [leavingReasons, setLeavingReasons] = useState<Record<string, string>>({})
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReasons()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData()
        }, 500)
        return () => clearTimeout(timer)
    }, [page, query])

    async function fetchReasons() {
        try {
            const reasons = await getLeavingReasons()
            const map: Record<string, string> = {}
            reasons.forEach(r => {
                if (r.code) map[r.code] = r.name
                if (r.name) map[r.name] = r.name // Fallback if code is name
            })
            setLeavingReasons(map)
        } catch (error) {
            console.error('Failed to fetch reasons:', error)
        }
    }

    async function fetchData() {
        setLoading(true)
        try {
            const result = await getMovements(query, page)
            setMovements(result.data as any)
            setTotalPages(result.totalPages)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this movement record?')) return
        try {
            await deleteMovement(id)
            fetchData() // Refresh
        } catch (error) {
            alert('Failed to delete record')
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, ID, or type..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setPage(1) // Reset to first page
                        }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-h-[500px]">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Effective Date</th>
                            <th className="px-6 py-3">Employee</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Position</th>
                            <th className="px-6 py-3">Reason</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <Loader2 className="animate-spin mb-2" size={32} />
                                        Loading movements...
                                    </div>
                                </td>
                            </tr>
                        ) : movements.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="h-64 text-center text-gray-400">
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            movements.map((move, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition border-l-4 border-transparent hover:border-blue-500">
                                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                                        {new Date(move.effective_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {move.employee ? `${move.employee.first_name} ${move.employee.last_name}` : 'Unknown'}
                                        <div className="text-xs text-gray-400 font-mono mt-0.5">{move.employee_id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${move.movement_type === 'New Hired' ? 'bg-green-100 text-green-700' :
                                            move.movement_type.includes('Resignation') ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {move.movement_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {move.position_title}
                                        <div className="text-xs text-gray-400">{move.position_level}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate" title={move.reason_detail ?? undefined}>
                                        {move.reason_code ? (leavingReasons[move.reason_code] || move.reason_code) : (move.reason_detail || '-')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEdit?.(move)}
                                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(move.transaction_id!)}
                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
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
