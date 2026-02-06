'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = {
    Male: '#3b82f6',
    Female: '#ec4899'
}

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    )
}

export function GenderPieChart({ data }: { data: { name: string; value: number }[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-72 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Gender Distribution</h3>
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    No data available
                </div>
            </div>
        )
    }

    const total = data.reduce((sum, d) => sum + d.value, 0)

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-72 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Gender Distribution</h3>
            <div className="flex-1 min-h-0 flex items-center">
                <div className="flex-1 min-w-0">
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius="80%"
                                dataKey="value"
                            >
                                {data.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#9ca3af'} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => value !== undefined ? [`${value} (${((value as number / total) * 100).toFixed(1)}%)`, 'Count'] : ['', 'Count']} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-1/2 flex flex-col gap-3 flex-shrink-0 min-w-[120px]">
                    {data.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-3">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] || '#9ca3af' }}
                            />
                            <span className="text-sm text-gray-600">{entry.name}</span>
                            <span className="text-sm font-semibold text-gray-800 ml-auto">
                                {((entry.value / total) * 100).toFixed(0)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
