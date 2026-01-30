'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function TrendChart({ data }: { data: { name: string; hired: number; left: number; turnoverRate?: number }[] }) {
    // Calculate cumulative turnover rate if not provided
    const enrichedData = data.map((item, index) => {
        const totalLeft = data.slice(0, index + 1).reduce((sum, d) => sum + d.left, 0)
        const totalHired = data.slice(0, index + 1).reduce((sum, d) => sum + d.hired, 0)
        const avgHeadcount = Math.max(totalHired - totalLeft + 70, 1) // assume base headcount of 70
        const rate = item.turnoverRate ?? ((item.left / avgHeadcount) * 100)
        return {
            ...item,
            turnoverRate: parseFloat(rate.toFixed(1))
        }
    })

    // Calculate summary stats
    const totalHired = data.reduce((sum, d) => sum + d.hired, 0)
    const totalLeft = data.reduce((sum, d) => sum + d.left, 0)
    const avgTurnover = (enrichedData.reduce((sum, d) => sum + d.turnoverRate, 0) / enrichedData.filter(d => d.turnoverRate > 0).length || 0).toFixed(1)

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">% Turnover Rate (Monthly)</h3>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-500">Hired: <span className="font-semibold text-green-600">{totalHired}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-gray-500">Left: <span className="font-semibold text-red-600">{totalLeft}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-gray-500">Avg Rate: <span className="font-semibold text-amber-600">{avgTurnover}%</span></span>
                    </div>
                </div>
            </div>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={enrichedData}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 10,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value, name) => {
                                if (value === undefined) return ['', '']
                                if (name === 'turnoverRate') return [`${value}%`, 'Turnover Rate']
                                return [value, name === 'hired' ? 'New Hired' : 'Left']
                            }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '10px' }}
                            formatter={(value) => {
                                if (value === 'turnoverRate') return 'Turnover Rate'
                                if (value === 'hired') return 'New Hired'
                                if (value === 'left') return 'Left'
                                return value
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="hired"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="left"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="turnoverRate"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
