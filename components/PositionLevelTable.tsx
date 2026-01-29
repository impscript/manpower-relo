'use client'

import { useState, useEffect } from 'react'
import { getAllPositionLevels, deletePositionLevel } from '@/lib/actions'
import { Edit, Trash2, Loader2, Plus, Check, X } from 'lucide-react'
import type { PositionLevel } from '@/lib/types'

interface PositionLevelTableProps {
    onEdit: (level: PositionLevel) => void
    onAdd: () => void
    refreshKey?: number
}

export function PositionLevelTable({ onEdit, onAdd, refreshKey = 0 }: PositionLevelTableProps) {
    const [levels, setLevels] = useState<PositionLevel[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    useEffect(() => {
        fetchData()
    }, [refreshKey])

    async function fetchData() {
        setLoading(true)
        try {
            const data = await getAllPositionLevels()
            setLevels(data)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: number) {
        try {
            await deletePositionLevel(id)
            fetchData()
        } catch (e) {
            alert('Failed to delete position level')
        } finally {
            setDeleteId(null)
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-800">Position Levels</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Configure available position levels for movement transactions</p>
                </div>
                <button
                    onClick={onAdd}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition flex items-center gap-2 text-sm font-medium"
                >
                    <Plus size={18} />
                    Add Level
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 w-20">Order</th>
                            <th className="px-6 py-3">Code</th>
                            <th className="px-6 py-3">Level Name</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <Loader2 className="animate-spin mb-2" size={24} />
                                        Loading...
                                    </div>
                                </td>
                            </tr>
                        ) : levels.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="h-40 text-center text-gray-400">
                                    No position levels found. Add one to get started.
                                </td>
                            </tr>
                        ) : (
                            levels.map((level) => (
                                <tr key={level.id} className="hover:bg-gray-50 transition group">
                                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">{level.sort_order}</td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{level.level_code}</td>
                                    <td className="px-6 py-3 text-gray-600">{level.level_name}</td>
                                    <td className="px-6 py-3">
                                        {level.is_active ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <Check size={12} /> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                                <X size={12} /> Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        {deleteId === level.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-xs text-gray-500">Delete?</span>
                                                <button
                                                    onClick={() => handleDelete(level.id)}
                                                    className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(null)}
                                                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                                >
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                                                <button
                                                    onClick={() => onEdit(level)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(level.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
