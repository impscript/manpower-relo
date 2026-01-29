'use client'

import { useState, useEffect } from 'react'
import { Plus, Building2, Users2, MapPin, Building, Briefcase, LogOut, HelpCircle, ArrowRightLeft, Layers } from 'lucide-react'
import { MasterDataTable, MasterDataItem } from '@/components/MasterDataTable'
import { MasterDataModal } from '@/components/MasterDataModal'
import { getMasterData, upsertMasterData, deleteMasterData, toggleMasterDataActive } from '@/lib/actions'
import { useToast } from '@/components/Toaster'

type TabKey = 'departments' | 'sections' | 'sites' | 'companies' | 'business_units' | 'movement_types' | 'leaving_types' | 'leaving_reasons'

interface TabConfig {
    key: TabKey
    label: string
    icon: React.ReactNode
    showCode: boolean
    showSortOrder: boolean
}

const TABS: TabConfig[] = [
    { key: 'departments', label: 'Departments', icon: <Building2 size={18} />, showCode: false, showSortOrder: false },
    { key: 'sections', label: 'Sections', icon: <Users2 size={18} />, showCode: false, showSortOrder: false },
    { key: 'sites', label: 'Sites', icon: <MapPin size={18} />, showCode: true, showSortOrder: false },
    { key: 'companies', label: 'Companies', icon: <Building size={18} />, showCode: true, showSortOrder: false },
    { key: 'business_units', label: 'Business Units', icon: <Briefcase size={18} />, showCode: true, showSortOrder: false },
    { key: 'movement_types', label: 'Movement Types', icon: <ArrowRightLeft size={18} />, showCode: true, showSortOrder: true },
    { key: 'leaving_types', label: 'Leaving Types', icon: <LogOut size={18} />, showCode: true, showSortOrder: true },
    { key: 'leaving_reasons', label: 'Leaving Reasons', icon: <HelpCircle size={18} />, showCode: true, showSortOrder: true },
]

export default function MasterDataPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('departments')
    const [items, setItems] = useState<MasterDataItem[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null)
    const { showToast } = useToast()

    const currentTabConfig = TABS.find(t => t.key === activeTab)!

    useEffect(() => {
        loadData()
    }, [activeTab])

    async function loadData() {
        setLoading(true)
        try {
            const data = await getMasterData(activeTab)
            setItems(data as MasterDataItem[])
        } catch (error) {
            showToast('Failed to load data', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (item: MasterDataItem) => {
        setEditingItem(item)
        setModalOpen(true)
    }

    const handleAdd = () => {
        setEditingItem(null)
        setModalOpen(true)
    }

    const handleSave = async (data: Partial<MasterDataItem>) => {
        await upsertMasterData(activeTab, data as any)
        showToast(data.id ? 'Updated successfully' : 'Created successfully', 'success')
        loadData()
    }

    const handleDelete = async (id: number) => {
        await deleteMasterData(activeTab, id)
        showToast('Deleted successfully', 'success')
        loadData()
    }

    const handleToggleActive = async (id: number, is_active: boolean) => {
        await toggleMasterDataActive(activeTab, id, is_active)
        showToast(`${is_active ? 'Activated' : 'Deactivated'} successfully`, 'success')
        loadData()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Master Data Settings</h1>
                    <p className="text-gray-500 mt-1">Manage reference data used across the system</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Tab Navigation */}
                <div className="border-b border-gray-100 bg-gray-50 p-2">
                    <div className="flex flex-wrap gap-1">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key
                                        ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                    }`}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            {currentTabConfig.icon}
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-800">{currentTabConfig.label}</h2>
                            <p className="text-xs text-gray-400">{items.length} items</p>
                        </div>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm"
                    >
                        <Plus size={18} />
                        Add New
                    </button>
                </div>

                {/* Table */}
                <div className="p-4">
                    <MasterDataTable
                        title={currentTabConfig.label}
                        items={items}
                        loading={loading}
                        showCode={currentTabConfig.showCode}
                        showSortOrder={currentTabConfig.showSortOrder}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleActive={handleToggleActive}
                    />
                </div>
            </div>

            {/* Modal */}
            <MasterDataModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                item={editingItem}
                title={currentTabConfig.label.replace(/s$/, '')}
                showCode={currentTabConfig.showCode}
                showSortOrder={currentTabConfig.showSortOrder}
            />
        </div>
    )
}
