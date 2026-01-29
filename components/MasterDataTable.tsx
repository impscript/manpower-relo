'use client'

import { useState } from 'react'
import { Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'

export interface MasterDataItem {
    id: number
    code?: string
    name: string
    sort_order?: number
    is_active: boolean
}

interface MasterDataTableProps {
    title: string
    items: MasterDataItem[]
    loading?: boolean
    showCode?: boolean
    showSortOrder?: boolean
    onEdit: (item: MasterDataItem) => void
    onDelete: (id: number) => Promise<void>
    onToggleActive: (id: number, isActive: boolean) => Promise<void>
}

export function MasterDataTable({
    title,
    items,
    loading = false,
    showCode = false,
    showSortOrder = false,
    onEdit,
    onDelete,
    onToggleActive
}: MasterDataTableProps) {
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [togglingId, setTogglingId] = useState<number | null>(null)

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return
        setDeletingId(id)
        try {
            await onDelete(id)
        } finally {
            setDeletingId(null)
        }
    }

    const handleToggle = async (id: number, currentState: boolean) => {
        setTogglingId(id)
        try {
            await onToggleActive(id, !currentState)
        } finally {
            setTogglingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="animate-spin mr-2" size={20} />
                Loading {title}...
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                No {title.toLowerCase()} found. Click "Add New" to create one.
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 w-12">#</th>
                        {showCode && (
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 w-32">Code</th>
                        )}
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                        {showSortOrder && (
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 w-24">Order</th>
                        )}
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 w-24">Status</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 w-32">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                            {showCode && (
                                <td className="py-3 px-4">
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                        {item.code}
                                    </code>
                                </td>
                            )}
                            <td className="py-3 px-4 font-medium text-gray-800">{item.name}</td>
                            {showSortOrder && (
                                <td className="py-3 px-4 text-center text-sm text-gray-500">
                                    {item.sort_order ?? '-'}
                                </td>
                            )}
                            <td className="py-3 px-4 text-center">
                                <button
                                    onClick={() => handleToggle(item.id, item.is_active)}
                                    disabled={togglingId === item.id}
                                    className="inline-flex items-center gap-1"
                                >
                                    {togglingId === item.id ? (
                                        <Loader2 className="animate-spin text-gray-400" size={18} />
                                    ) : item.is_active ? (
                                        <ToggleRight className="text-green-500" size={24} />
                                    ) : (
                                        <ToggleLeft className="text-gray-300" size={24} />
                                    )}
                                </button>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                        title="Edit"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        disabled={deletingId === item.id}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                        title="Delete"
                                    >
                                        {deletingId === item.id ? (
                                            <Loader2 className="animate-spin" size={16} />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
