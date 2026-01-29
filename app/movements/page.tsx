'use client'

import { useState } from 'react'
import { MovementTable } from '@/components/MovementTable'
import { MovementModal } from '@/components/MovementModal'
import { Plus, Download } from 'lucide-react'
import { getAllMovementsForExport } from '@/lib/actions'
import { downloadCSV } from '@/lib/export-utils'

import { MovementTransaction } from '@/lib/types'

export default function MovementsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [selectedMovement, setSelectedMovement] = useState<MovementTransaction | undefined>(undefined)

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1) // Trigger table refresh
    }

    const handleEdit = (movement: MovementTransaction) => {
        setSelectedMovement(movement)
        setIsModalOpen(true)
    }

    const handleExport = async () => {
        try {
            const data = await getAllMovementsForExport()
            const today = new Date().toISOString().split('T')[0]
            downloadCSV(data, `movements_export_${today}.csv`)
        } catch (error) {
            console.error('Export failed:', error)
            alert('Failed to export data')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Movements</h2>
                    <p className="text-gray-500 mt-1">Transaction logs of all hiring, transfer, and resignation activities</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition flex items-center gap-2"
                    >
                        <Download size={20} />
                        Export
                    </button>
                    <button
                        onClick={() => {
                            setSelectedMovement(undefined)
                            setIsModalOpen(true)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add Transaction
                    </button>
                </div>
            </div>

            <MovementTable key={refreshKey} onEdit={handleEdit} />

            <MovementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                initialData={selectedMovement}
            />
        </div>
    )
}
