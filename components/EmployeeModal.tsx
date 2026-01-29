'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { upsertEmployee, getMasterData } from '@/lib/actions'

interface MasterDataOption {
    id: number
    name: string
    code?: string
}

interface EmployeeModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    employee?: any
}

export function EmployeeModal({ isOpen, onClose, onSuccess, employee }: EmployeeModalProps) {
    const [loading, setLoading] = useState(false)
    const [masterDataLoading, setMasterDataLoading] = useState(true)

    // Master data options
    const [sections, setSections] = useState<MasterDataOption[]>([])
    const [departments, setDepartments] = useState<MasterDataOption[]>([])
    const [businessUnits, setBusinessUnits] = useState<MasterDataOption[]>([])
    const [sites, setSites] = useState<MasterDataOption[]>([])
    const [companies, setCompanies] = useState<MasterDataOption[]>([])

    const [formData, setFormData] = useState<{
        employee_id: string
        first_name: string
        last_name: string
        gender: string
        birth_date: string
        education_level: string
        onboard_date: string
        resigned_date: string
        current_status: 'Active' | 'Resigned' | 'Terminated'
        section_id: number | null
        department_id: number | null
        business_unit_id: number | null
        site_id: number | null
        company_id: number | null
    }>({
        employee_id: '',
        first_name: '',
        last_name: '',
        gender: '',
        birth_date: '',
        education_level: '',
        onboard_date: '',
        resigned_date: '',
        current_status: 'Active',
        section_id: null,
        department_id: null,
        business_unit_id: null,
        site_id: null,
        company_id: null
    })

    // Load master data
    useEffect(() => {
        async function loadMasterData() {
            setMasterDataLoading(true)
            try {
                const [secData, deptData, buData, siteData, compData] = await Promise.all([
                    getMasterData('sections'),
                    getMasterData('departments'),
                    getMasterData('business_units'),
                    getMasterData('sites'),
                    getMasterData('companies')
                ])
                setSections(secData.filter(s => s.is_active !== false) as MasterDataOption[])
                setDepartments(deptData.filter(s => s.is_active !== false) as MasterDataOption[])
                setBusinessUnits(buData.filter(s => s.is_active !== false) as MasterDataOption[])
                setSites(siteData.filter(s => s.is_active !== false) as MasterDataOption[])
                setCompanies(compData.filter(s => s.is_active !== false) as MasterDataOption[])
            } catch (error) {
                console.error('Failed to load master data:', error)
            } finally {
                setMasterDataLoading(false)
            }
        }
        if (isOpen) {
            loadMasterData()
        }
    }, [isOpen])

    useEffect(() => {
        if (employee) {
            setFormData({
                employee_id: employee.employee_id,
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                gender: employee.gender || '',
                birth_date: employee.birth_date ? new Date(employee.birth_date).toISOString().split('T')[0] : '',
                education_level: employee.education_level || '',
                onboard_date: employee.onboard_date ? new Date(employee.onboard_date).toISOString().split('T')[0] : '',
                resigned_date: employee.resigned_date ? new Date(employee.resigned_date).toISOString().split('T')[0] : '',
                current_status: employee.current_status || 'Active',
                section_id: employee.section_id || null,
                department_id: employee.department_id || null,
                business_unit_id: employee.business_unit_id || null,
                site_id: employee.site_id || null,
                company_id: employee.company_id || null
            })
        } else {
            setFormData({
                employee_id: '',
                first_name: '',
                last_name: '',
                gender: '',
                birth_date: '',
                education_level: '',
                onboard_date: '',
                resigned_date: '',
                current_status: 'Active',
                section_id: null,
                department_id: null,
                business_unit_id: null,
                site_id: null,
                company_id: null
            })
        }
    }, [employee, isOpen])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Clean up empty strings to null
            const dataToSave = {
                ...formData,
                birth_date: formData.birth_date || null,
                onboard_date: formData.onboard_date || null,
                resigned_date: formData.resigned_date || null,
                gender: formData.gender || null,
                education_level: formData.education_level || null
            }
            await upsertEmployee(dataToSave)
            onSuccess()
            onClose()
        } catch (error) {
            alert('Failed to save employee. ID might be duplicate.')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        // Handle ID fields specially
        if (name.endsWith('_id') && name !== 'employee_id') {
            setFormData({ ...formData, [name]: value ? parseInt(value) : null })
        } else {
            setFormData({ ...formData, [name]: value })
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {employee ? 'Edit Employee' : 'Add New Employee'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Basic Info */}
                    <div className="space-y-1 mb-2">
                        <h4 className="font-medium text-gray-700 text-sm">Basic Information</h4>
                        <div className="h-px bg-gray-100"></div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                            <input
                                name="employee_id"
                                required
                                disabled={!!employee}
                                value={formData.employee_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input
                                name="first_name"
                                required
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input
                                name="last_name"
                                required
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="">-- Select --</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                            <input
                                type="date"
                                name="birth_date"
                                value={formData.birth_date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                            <select
                                name="education_level"
                                value={formData.education_level}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="">-- Select --</option>
                                <option value="ปวช.">ปวช.</option>
                                <option value="ปวส.">ปวส.</option>
                                <option value="ป. ตรี">ป. ตรี</option>
                                <option value="ป. โท">ป. โท</option>
                                <option value="ป. เอก">ป. เอก</option>
                            </select>
                        </div>
                    </div>

                    {/* Employment Info */}
                    <div className="space-y-1 mb-2 mt-6">
                        <h4 className="font-medium text-gray-700 text-sm">Employment Information</h4>
                        <div className="h-px bg-gray-100"></div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                name="current_status"
                                value={formData.current_status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="Active">Active</option>
                                <option value="Resigned">Resigned</option>
                                <option value="Terminated">Terminated</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Onboard Date</label>
                            <input
                                type="date"
                                name="onboard_date"
                                value={formData.onboard_date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Resigned Date</label>
                            <input
                                type="date"
                                name="resigned_date"
                                value={formData.resigned_date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Organization Info */}
                    <div className="space-y-1 mb-2 mt-6">
                        <h4 className="font-medium text-gray-700 text-sm">Organization</h4>
                        <div className="h-px bg-gray-100"></div>
                    </div>

                    {masterDataLoading ? (
                        <div className="flex items-center justify-center py-4 text-gray-400">
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Loading options...
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <select
                                        name="department_id"
                                        value={formData.department_id || ''}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="">-- Select --</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                    <select
                                        name="section_id"
                                        value={formData.section_id || ''}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="">-- Select --</option>
                                        {sections.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Unit</label>
                                    <select
                                        name="business_unit_id"
                                        value={formData.business_unit_id || ''}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="">-- Select --</option>
                                        {businessUnits.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Site / Area</label>
                                    <select
                                        name="site_id"
                                        value={formData.site_id || ''}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="">-- Select --</option>
                                        {sites.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company (Payroll)</label>
                                    <select
                                        name="company_id"
                                        value={formData.company_id || ''}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="">-- Select --</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

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
                            {employee ? 'Save Changes' : 'Create Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
