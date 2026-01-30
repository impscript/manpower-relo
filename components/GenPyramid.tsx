'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#6b7280']

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.03) return null
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    )
}

export function GenPyramid({ data }: { data: { name: string; value: number }[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">By Generation</h3>
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    No data available
                </div>
            </div>
        )
    }

    const total = data.reduce((sum, d) => sum + d.value, 0)
    const topItem = data.reduce((max, d) => d.value > max.value ? d : max, data[0])
    const topPercent = ((topItem.value / total) * 100).toFixed(0)

    // Add age range to names
    const genAgeMap: Record<string, string> = {
        'Gen Z': 'อายุ 18-28 ปี',
        'Gen Y': 'อายุ 29-44 ปี',
        'Gen X': 'อายุ 45-60 ปี',
        'Baby Boomer': 'อายุ 61+ ปี'
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">By Generation</h3>
            <div className="flex-1 min-h-0 flex">
                {/* Left side - Highlight */}
                <div className="w-1/3 flex flex-col justify-center pr-2 border-r">
                    <div className="text-4xl font-bold text-blue-600">{topPercent}%</div>
                    <div className="text-sm text-gray-600 mt-1">{topItem.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{genAgeMap[topItem.name] || ''}</div>
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
                <div className="w-1/3 flex flex-col justify-center gap-2 pl-3">
                    {data.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="flex-1">
                                <div className="text-sm text-gray-800 font-medium">{entry.name}</div>
                                <div className="text-xs text-gray-400">{genAgeMap[entry.name] || ''}</div>
                            </div>
                            <span className="font-semibold text-gray-800">
                                {((entry.value / total) * 100).toFixed(0)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
