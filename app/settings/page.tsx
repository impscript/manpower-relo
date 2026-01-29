'use client'

import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, FileText, Loader2, X, Layers } from 'lucide-react'
import { useState, useRef } from 'react'
import { bulkImportEmployees, bulkImportMovements } from '@/lib/actions'
import Link from 'next/link'

interface ParsedData {
    headers: string[]
    rows: Record<string, string>[]
}

export default function SettingsPage() {
    const [dragActive, setDragActive] = useState(false)
    const [importType, setImportType] = useState<'employee' | 'movement'>('employee')
    const [parsedData, setParsedData] = useState<ParsedData | null>(null)
    const [importLoading, setImportLoading] = useState(false)
    const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const downloadTemplate = (type: 'employee' | 'movement') => {
        let headers = ''
        let rows = ''
        let filename = ''

        if (type === 'employee') {
            headers = 'employee_id,first_name,last_name,gender,birth_date,education_level,onboard_date,current_status'
            rows = `EMP001,John,Doe,Male,1990-01-01,Bachelor,2023-01-15,Active
EMP002,Jane,Smith,Female,1995-05-20,Master,2023-06-01,Active`
            filename = 'Employee_Master_Template.csv'
        } else {
            headers = 'employee_id,movement_type,effective_date,position_title,position_level,reason_code,reason_detail,org_id'
            rows = `EMP001,New Hired,2023-01-15,Software Engineer,8. Staff,1,New position,1
EMP003,Voluntary Resignation,2024-02-01,Senior Developer,7. Senior Staff,5,New opportunity,1`
            filename = 'Movement_Log_Template.csv'
        }

        const csvContent = [headers, rows].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }

    const parseCSV = (text: string): ParsedData => {
        const lines = text.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        const rows: Record<string, string>[] = []

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim())
            const row: Record<string, string> = {}
            headers.forEach((header, index) => {
                row[header] = values[index] || ''
            })
            rows.push(row)
        }

        return { headers, rows }
    }

    const handleFileSelect = async (file: File) => {
        const text = await file.text()
        const parsed = parseCSV(text)
        setParsedData(parsed)
        setImportResult(null)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
        const file = e.dataTransfer.files[0]
        if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) {
            handleFileSelect(file)
        }
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }

    const handleImport = async () => {
        if (!parsedData) return

        setImportLoading(true)
        setImportResult(null)

        try {
            if (importType === 'employee') {
                const result = await bulkImportEmployees(parsedData.rows)
                setImportResult({ success: true, message: `Successfully imported ${result.count} employees` })
            } else {
                const result = await bulkImportMovements(parsedData.rows)
                setImportResult({ success: true, message: `Successfully imported ${result.count} movements` })
            }
            setParsedData(null)
        } catch (error) {
            setImportResult({ success: false, message: error instanceof Error ? error.message : 'Import failed' })
        } finally {
            setImportLoading(false)
        }
    }

    const clearPreview = () => {
        setParsedData(null)
        setImportResult(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">Settings</h2>
                <p className="text-gray-500 mt-1">System configuration and data management</p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href="/settings/position-levels"
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition group"
                >
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-100 transition">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Position Levels</h3>
                        <p className="text-xs text-gray-500">Configure position level options</p>
                    </div>
                </Link>
                <Link
                    href="/settings/master-data"
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition group"
                >
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition">
                        <FileSpreadsheet size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Master Data</h3>
                        <p className="text-xs text-gray-500">Departments, Sites, Companies & more</p>
                    </div>
                </Link>
                <Link
                    href="/settings/raw-import"
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition group"
                >
                    <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-100 transition">
                        <Upload size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Raw Data Import</h3>
                        <p className="text-xs text-gray-500">Import Excel/TSV exported data</p>
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Import Section */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Data Import</h3>
                    <p className="text-gray-500 mb-4 text-sm">
                        Upload your monthly movement logs or employee master data here to update the dashboard.
                        Supported formats: .csv
                    </p>

                    {/* Import Type Selector */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => { setImportType('employee'); clearPreview() }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${importType === 'employee' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Employee Master
                        </button>
                        <button
                            onClick={() => { setImportType('movement'); clearPreview() }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${importType === 'movement' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Movement Log
                        </button>
                    </div>

                    {/* Drop Zone */}
                    <div
                        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                            }`}
                        onDragEnter={() => setDragActive(true)}
                        onDragLeave={() => setDragActive(false)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                            <Upload className="text-gray-500" size={32} />
                        </div>
                        <p className="text-gray-700 font-medium">Click to upload or drag and drop</p>
                        <p className="text-gray-400 text-sm mt-1">CSV files only (max 10MB)</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.txt"
                            className="hidden"
                            onChange={handleFileInput}
                        />
                    </div>

                    {/* Preview Section */}
                    {parsedData && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-800">Preview ({parsedData.rows.length} rows)</h4>
                                <button onClick={clearPreview} className="p-1 hover:bg-gray-100 rounded-lg transition">
                                    <X size={18} className="text-gray-400" />
                                </button>
                            </div>
                            <div className="overflow-x-auto max-h-48 border rounded-xl">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            {parsedData.headers.map(h => (
                                                <th key={h} className="px-3 py-2 text-left text-gray-600 font-medium">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {parsedData.rows.slice(0, 5).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                {parsedData.headers.map(h => (
                                                    <td key={h} className="px-3 py-2 text-gray-700">{row[h]}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {parsedData.rows.length > 5 && (
                                    <div className="text-center py-2 text-xs text-gray-400 bg-gray-50">
                                        ... and {parsedData.rows.length - 5} more rows
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Import Result */}
                    {importResult && (
                        <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${importResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {importResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            <span className="text-sm font-medium">{importResult.message}</span>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleImport}
                            disabled={!parsedData || importLoading}
                            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {importLoading && <Loader2 className="animate-spin" size={18} />}
                            Import Data
                        </button>
                    </div>
                </div>

                {/* Templates Section */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Download Templates</h3>
                    <p className="text-gray-500 mb-6 text-sm">
                        Use these templates to ensure your data is formatted correctly before importing.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                    <FileSpreadsheet size={24} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800">Employee Master Template</h4>
                                    <p className="text-xs text-gray-500">For updating employee records</p>
                                </div>
                            </div>
                            <button
                                onClick={() => downloadTemplate('employee')}
                                className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-2"
                            >
                                <Download size={16} /> Download
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800">Movement Log Template</h4>
                                    <p className="text-xs text-gray-500">For importing new hire/resignation logs</p>
                                </div>
                            </div>
                            <button
                                onClick={() => downloadTemplate('movement')}
                                className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-2"
                            >
                                <Download size={16} /> Download
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 rounded-xl flex gap-3">
                        <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                        <p className="text-xs text-yellow-700">
                            <strong>Note:</strong> Timestamps in CSV files should be in YYYY-MM-DD format. Employee IDs must be unique.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
