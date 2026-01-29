'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Search, ChevronDown, User } from 'lucide-react'
import { createMovement, updateMovement, getPositionLevels, getAllEmployees, getLeavingReasons, type MasterDataRecord } from '@/lib/actions'
import type { PositionLevel, MovementTransaction } from '@/lib/types'
import { MOVEMENT_TYPES } from '@/lib/types'

interface MovementModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialData?: MovementTransaction
}

interface EmployeeOption {
    employee_id: string
    first_name: string
    last_name: string
}

export function MovementModal({ isOpen, onClose, onSuccess, initialData }: MovementModalProps) {
    const [loading, setLoading] = useState(false)
    const [positionLevels, setPositionLevels] = useState<PositionLevel[]>([])
    const [employees, setEmployees] = useState<EmployeeOption[]>([])
    const [leavingReasons, setLeavingReasons] = useState<MasterDataRecord[]>([])
    const [loadingData, setLoadingData] = useState(true)
    const [formData, setFormData] = useState({
        employee_id: '',
        movement_type: 'New Hired',
        effective_date: '',
        position_title: '',
        position_level: '',
        reason_code: '',
        reason_detail: '',
        org_id: 1
    })

    // Employee search dropdown state
    const [showDropdown, setShowDropdown] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            loadData()
            if (initialData) {
                // Pre-fill form
                setFormData({
                    employee_id: initialData.employee_id || '',
                    movement_type: initialData.movement_type || 'New Hired',
                    effective_date: (initialData.effective_date as string) || '',
                    position_title: initialData.position_title || '',
                    position_level: initialData.position_level || '',
                    reason_code: initialData.reason_code || '',
                    reason_detail: initialData.reason_detail || '',
                    org_id: 1
                })
                // Also set selected employee
                const emp = employees.find(e => e.employee_id === initialData.employee_id)
                if (emp) setSelectedEmployee(emp)
                // Use a quick timeout to try finding employee again after load if arrays are empty
            } else {
                resetForm()
            }
        }
    }, [isOpen, initialData])

    // Effect to set selected employee when employees array is loaded and we have initialData
    useEffect(() => {
        if (initialData && employees.length > 0 && !selectedEmployee) {
            const emp = employees.find(e => e.employee_id === initialData.employee_id)
            if (emp) setSelectedEmployee(emp)
        }
    }, [employees, initialData])

    // ... (keep click outside) ...

    async function loadData() {
        setLoadingData(true)
        try {
            const [levels, emps, reasons] = await Promise.all([
                getPositionLevels(),
                getAllEmployees(),
                getLeavingReasons()
            ])
            setPositionLevels(levels)
            setEmployees(emps)
            setLeavingReasons(reasons)
            if (levels.length > 0 && !formData.position_level && !initialData) {
                setFormData(prev => ({ ...prev, position_level: levels[0].level_name }))
            }
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoadingData(false)
        }
    }

    function resetForm() {
        setFormData({
            employee_id: '',
            movement_type: 'New Hired',
            effective_date: '',
            position_title: '',
            position_level: '',
            reason_code: '',
            reason_detail: '',
            org_id: 1
        })
        setSelectedEmployee(null)
        setSearchQuery('')
    }

    const filteredEmployees = employees.filter(emp => {
        const query = searchQuery.toLowerCase()
        return (
            emp.employee_id.toLowerCase().includes(query) ||
            emp.first_name.toLowerCase().includes(query) ||
            emp.last_name.toLowerCase().includes(query)
        )
    })

    const handleSelectEmployee = (emp: EmployeeOption) => {
        setSelectedEmployee(emp)
        setFormData(prev => ({ ...prev, employee_id: emp.employee_id }))
        setSearchQuery('')
        setShowDropdown(false)
    }

    const clearEmployee = () => {
        setSelectedEmployee(null)
        setFormData(prev => ({ ...prev, employee_id: '' }))
    }

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.employee_id) {
            alert('Please select an employee')
            return
        }
        setLoading(true)
        try {
            if (initialData?.transaction_id) {
                await updateMovement(initialData.transaction_id, formData)
            } else {
                await createMovement(formData)
            }
            onSuccess()
            onClose()
            resetForm()
        } catch (error) {
            alert('Failed to save movement.')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800">{initialData ? 'Edit Movement' : 'Record New Movement'}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Employee Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                        <div className="relative" ref={dropdownRef}>
                            {selectedEmployee ? (
                                <div className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-blue-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <User size={16} className="text-blue-500" />
                                        <span className="font-medium text-gray-800">{selectedEmployee.employee_id}</span>
                                        <span className="text-gray-500">-</span>
                                        <span className="text-gray-700">{selectedEmployee.first_name} {selectedEmployee.last_name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearEmployee}
                                        className="p-1 hover:bg-blue-100 rounded transition"
                                    >
                                        <X size={16} className="text-gray-400" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 flex items-center gap-2 cursor-pointer hover:border-blue-400 transition"
                                        onClick={() => setShowDropdown(true)}
                                    >
                                        <Search size={16} className="text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by ID or name..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value)
                                                setShowDropdown(true)
                                            }}
                                            onFocus={() => setShowDropdown(true)}
                                            className="flex-1 outline-none bg-transparent"
                                        />
                                        <ChevronDown size={16} className="text-gray-400" />
                                    </div>

                                    {showDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                                            {loadingData ? (
                                                <div className="p-3 text-center text-gray-400 flex items-center justify-center gap-2">
                                                    <Loader2 className="animate-spin" size={16} />
                                                    Loading employees...
                                                </div>
                                            ) : filteredEmployees.length === 0 ? (
                                                <div className="p-3 text-center text-gray-400">
                                                    No employees found
                                                </div>
                                            ) : (
                                                filteredEmployees.slice(0, 10).map(emp => (
                                                    <div
                                                        key={emp.employee_id}
                                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition"
                                                        onClick={() => handleSelectEmployee(emp)}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                            <User size={14} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-800">{emp.first_name} {emp.last_name}</div>
                                                            <div className="text-xs text-gray-400">{emp.employee_id}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            {filteredEmployees.length > 10 && (
                                                <div className="px-3 py-2 text-xs text-gray-400 text-center border-t">
                                                    ...and {filteredEmployees.length - 10} more. Refine your search.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                            <input
                                type="date"
                                name="effective_date"
                                required
                                value={formData.effective_date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
                            <select
                                name="movement_type"
                                value={formData.movement_type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                {MOVEMENT_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Reason Selection (New Dropdown) */}
                    {(formData.movement_type.includes('Resignation') || formData.movement_type.includes('Retirement') || formData.movement_type === 'Transfer-Out') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Leaving Reason</label>
                            <select
                                name="reason_code"
                                value={formData.reason_code}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="">-- Select Reason --</option>
                                {leavingReasons.map(reason => (
                                    <option key={reason.id} value={reason.code || reason.name}>
                                        {reason.code ? `${reason.code} - ${reason.name}` : reason.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Position Title</label>
                            <input
                                name="position_title"
                                required
                                value={formData.position_title}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Position Level</label>
                            {loadingData ? (
                                <div className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={16} />
                                    Loading...
                                </div>
                            ) : (
                                <select
                                    name="position_level"
                                    value={formData.position_level}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    {positionLevels.map(level => (
                                        <option key={level.id} value={level.level_name}>{level.level_name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason Detail</label>
                        <textarea
                            name="reason_detail"
                            rows={3}
                            placeholder="Description of why this movement happened..."
                            value={formData.reason_detail}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
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
                            disabled={loading || loadingData || !formData.employee_id}
                            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            Save Transaction
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
