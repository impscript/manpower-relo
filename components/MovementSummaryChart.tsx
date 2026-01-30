'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts'

const MOVEMENT_COLORS: Record<string, string> = {
    'New Hired': '#10b981',
    'Voluntary Resignation': '#ef4444',
    'Involuntary Resignation': '#f97316',
    'Transfer-In': '#8b5cf6',
    'Transfer-Out': '#a855f7',
    'Retirement': '#6b7280',
    'Terminated': '#dc2626'
}

export function MovementSummaryChart({ data }: { data: { name: string; value: number; percent: number }[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-72 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Movement Summary</h3>
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    No data available
                </div>
            </div>
        )
    }

    // Sort by value descending
    const sortedData = [...data].sort((a, b) => b.value - a.value)
    const totalMovements = data.reduce((sum, d) => sum + d.value, 0)
    const topItem = sortedData[0]

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-72 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Movement Summary</h3>
                <span className="text-sm text-gray-500">
                    Total: <span className="font-semibold">{totalMovements}</span>
                </span>
            </div>
            <div className="flex-1 min-h-0 flex">
                {/* Left - Highlight */}
                <div className="w-1/4 flex flex-col justify-center pr-4 border-r">
                    <div className="text-3xl font-bold" style={{ color: MOVEMENT_COLORS[topItem.name] || '#374151' }}>
                        {topItem.percent}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{topItem.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{topItem.value} transactions</div>
                </div>

                {/* Right - Chart */}
                <div className="w-3/4 pl-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={sortedData}
                            margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={130}
                                tick={{ fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Bar
                                dataKey="percent"
                                radius={[0, 4, 4, 0]}
                                barSize={16}
                            >
                                {sortedData.map((entry) => (
                                    <Cell
                                        key={entry.name}
                                        fill={MOVEMENT_COLORS[entry.name] || '#9ca3af'}
                                    />
                                ))}
                                <LabelList
                                    dataKey="percent"
                                    position="right"
                                    formatter={(value) => value != null ? `${value}%` : ''}
                                    style={{ fontSize: 11, fill: '#374151' }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
