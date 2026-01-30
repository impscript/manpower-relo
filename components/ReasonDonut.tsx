'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']

export function ReasonDonut({ data }: { data: { name: string; value: number }[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Reason of Resigned - Voluntary</h3>
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    No data available
                </div>
            </div>
        )
    }

    const total = data.reduce((sum, d) => sum + d.value, 0)
    const topItem = data.reduce((max, d) => d.value > max.value ? d : max, data[0])
    const topPercent = ((topItem.value / total) * 100).toFixed(0)

    // Add percentage to data
    const enrichedData = data.map(d => ({
        ...d,
        percent: parseFloat(((d.value / total) * 100).toFixed(0))
    })).sort((a, b) => b.value - a.value)

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Reason of Resigned - Voluntary</h3>
            <div className="flex-1 min-h-0 flex">
                <div className="w-2/3">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={enrichedData}
                            margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={120}
                                tick={{ fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Bar
                                dataKey="percent"
                                radius={[0, 4, 4, 0]}
                                barSize={16}
                            >
                                {enrichedData.map((entry, index) => (
                                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
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
                <div className="w-1/3 flex flex-col justify-center gap-2 border-l pl-4">
                    <div className="text-3xl font-bold text-indigo-600">{topPercent}%</div>
                    <div className="text-sm text-gray-600">{topItem.name}</div>
                    {enrichedData.slice(1, 3).map((item) => (
                        <div key={item.name} className="mt-2">
                            <div className="text-lg font-semibold text-gray-800">{item.percent}%</div>
                            <div className="text-xs text-gray-500">{item.name}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
