import { AlertTriangle, UserMinus } from 'lucide-react'

export function AttritionTable({ data }: { data: any[] }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="text-red-500" size={20} />
                    <h3 className="text-lg font-semibold text-gray-800">Early Attrition & Risk Cases</h3>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-red-50 text-red-600 rounded-full">{data.length} Cases</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Employee</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Tenure</th>
                            <th className="px-6 py-3">Reason</th>
                            <th className="px-6 py-3">Risk Tag</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    <div>{item.name}</div>
                                    <div className="text-xs text-gray-400">{item.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.type.includes('Involuntary') ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {item.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{item.tenure}</td>
                                <td className="px-6 py-4 text-gray-600">{item.reason}</td>
                                <td className="px-6 py-4">
                                    {item.is_probation_fail && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                                            Failed Probation
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
