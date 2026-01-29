'use client'

import { useState } from 'react'
import { PositionLevelTable } from '@/components/PositionLevelTable'
import { PositionLevelModal } from '@/components/PositionLevelModal'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { PositionLevel } from '@/lib/types'

export default function PositionLevelsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedLevel, setSelectedLevel] = useState<PositionLevel | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const handleAdd = () => {
        setSelectedLevel(null)
        setIsModalOpen(true)
    }

    const handleEdit = (level: PositionLevel) => {
        setSelectedLevel(level)
        setIsModalOpen(true)
    }

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/settings"
                    className="p-2 hover:bg-gray-100 rounded-xl transition"
                >
                    <ArrowLeft size={20} className="text-gray-500" />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Position Levels</h2>
                    <p className="text-gray-500 mt-1">Manage position level options for movement transactions</p>
                </div>
            </div>

            <PositionLevelTable
                onEdit={handleEdit}
                onAdd={handleAdd}
                refreshKey={refreshKey}
            />

            <PositionLevelModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                level={selectedLevel}
            />
        </div>
    )
}
