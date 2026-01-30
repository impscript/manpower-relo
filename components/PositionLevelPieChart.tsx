'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e']

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // Don't show label for small slices
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    )
}

export function PositionLevelPieChart({ data }: { data: { name: string; value: number }[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">By Position Level</h3>
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    No data available
                </div>
            </div>
        )
    }

    const total = data.reduce((sum, d) => sum + d.value, 0)
    const topItem = data.reduce((max, d) => d.value > max.value ? d : max, data[0])
    const topPercent = ((topItem.value / total) * 100).toFixed(0)

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">By Position Level</h3>
            <div className="flex-1 min-h-0 flex">
                {/* Left side - Highlight */}
                <div className="w-1/3 flex flex-col justify-center pr-2 border-r">
                    <div className="text-4xl font-bold text-purple-600">{topPercent}%</div>
                    <div className="text-sm text-gray-600 mt-1">{topItem.name.replace(/^\d+\.\s*/, '')}</div>
                    <div className="text-xs text-gray-400 mt-1">{topItem.value} employees</div>
                </div>

                {/* Center - Pie Chart */}
                <div className="w-1/3 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={70}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => value !== undefined ? [`${value} employees`, 'Count'] : ['', 'Count']} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Right side - Legend */}
                <div className="w-1/3 flex flex-col justify-center gap-1 pl-3 overflow-y-auto">
                    {data.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                            <div
                                className="w-3 h-3 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-gray-600 truncate flex-1">{entry.name.replace(/^\d+\.\s*/, '')}</span>
                            <span className="font-medium text-gray-800">{entry.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
