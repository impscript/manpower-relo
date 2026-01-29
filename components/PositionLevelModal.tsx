'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { upsertPositionLevel } from '@/lib/actions'
import type { PositionLevel } from '@/lib/types'

interface PositionLevelModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    level?: PositionLevel | null
}

export function PositionLevelModal({ isOpen, onClose, onSuccess, level }: PositionLevelModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        id: 0,
        level_code: '',
        level_name: '',
        sort_order: 0,
        is_active: true
    })

    useEffect(() => {
        if (level) {
            setFormData({
                id: level.id,
                level_code: level.level_code,
                level_name: level.level_name,
                sort_order: level.sort_order,
                is_active: level.is_active
            })
        } else {
            setFormData({
                id: 0,
                level_code: '',
                level_name: '',
                sort_order: 0,
                is_active: true
            })
        }
    }, [level, isOpen])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const dataToSave = level?.id ? formData : { ...formData, id: undefined }
            await upsertPositionLevel(dataToSave)
            onSuccess()
            onClose()
        } catch (error) {
            alert('Failed to save position level.')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                type === 'number' ? parseInt(value) || 0 : value
        })
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {level ? 'Edit Position Level' : 'Add Position Level'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Level Code</label>
                            <input
                                name="level_code"
                                required
                                placeholder="e.g. 1"
                                value={formData.level_code}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                            <input
                                type="number"
                                name="sort_order"
                                min={0}
                                value={formData.sort_order}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Level Name</label>
                        <input
                            name="level_name"
                            required
                            placeholder="e.g. 1. Director"
                            value={formData.level_name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition font-medium flex items-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            {level ? 'Save Changes' : 'Create Level'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
