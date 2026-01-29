'use client'

import { useState } from 'react'
import { EmployeeTable } from '@/components/EmployeeTable'
import { EmployeeModal } from '@/components/EmployeeModal'

export default function EmployeesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const handleAdd = () => {
        setSelectedEmployee(null)
        setIsModalOpen(true)
    }

    const handleEdit = (employee: any) => {
        setSelectedEmployee(employee)
        setIsModalOpen(true)
    }

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1) // Trigger table refresh
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Employees</h2>
                    <p className="text-gray-500 mt-1">Manage and view all employee records</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">Export</button>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition"
                    >
                        Add Employee
                    </button>
                </div>
            </div>

            <EmployeeTable onEdit={handleEdit} key={refreshKey} />

            <EmployeeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                employee={selectedEmployee}
            />
        </div>
    )
}
