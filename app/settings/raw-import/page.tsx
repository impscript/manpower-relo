'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Users, ArrowRightLeft, AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react'
import { parseRawData, importRawData, ParsedEmployee, ParsedMovement, ImportResult } from '@/lib/import-utils'
import { useToast } from '@/components/Toaster'
import Link from 'next/link'

interface ParsePreview {
    employees: ParsedEmployee[]
    movements: ParsedMovement[]
    warnings: string[]
}

export default function RawDataImportPage() {
    const [dragActive, setDragActive] = useState(false)
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [preview, setPreview] = useState<ParsePreview | null>(null)
    const [importResult, setImportResult] = useState<ImportResult | null>(null)
    const [showEmployees, setShowEmployees] = useState(true)
    const [showMovements, setShowMovements] = useState(true)
    const [showWarnings, setShowWarnings] = useState(true)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { showToast } = useToast()

    const handleDownloadTemplate = () => {
        // Define CSV headers
        const headers = [
            'Month', 'Movement Type', 'Employee ID', 'Name', 'Surname', 'Gender',
            'Position Title', 'Position Level', 'Section', 'Department',
            'Business Unit', 'Site', 'Company (Payroll)', 'Birthday',
            'Age', 'Service Year', 'Generation', 'Onboard Date', 'Resigned Date',
            'Status', 'Level', 'Education', 'Leaving Type', 'Leaving Reason', 'Remark'
        ].join(',')

        // Add a sample row for guidance
        const exampleRow = [
            '2024-01-01', 'New Hired', 'EMP001', 'John', 'Doe', 'Male',
            'Engineer', 'Officer', 'Engineering', 'R&D',
            'BU1', 'Site A', 'My Company', '1990-01-01',
            '', '', '', '2024-01-01', '',
            'Active', '', 'Bachelor', '', '', ''
        ].join(',')

        const csvContent = "\uFEFF" + headers + "\n" + exampleRow
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'manpower_import_template.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleFileSelect = async (file: File) => {
        setLoading(true)
        setImportResult(null)
        setSelectedFile(file)
        try {
            const text = await file.text()
            const parsed = await parseRawData(text)
            setPreview(parsed)
            showToast(`Parsed ${parsed.employees.length} employees and ${parsed.movements.length} movements`, 'success')
        } catch (error) {
            showToast('Failed to parse file', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
        const file = e.dataTransfer.files[0]
        if (file) {
            handleFileSelect(file)
        }
    }

    const handleImport = async () => {
        if (!preview) return

        setImporting(true)
        try {
            // Re-read the file and import
            if (selectedFile) {
                const text = await selectedFile.text()
                const result = await importRawData(text)
                setImportResult(result)

                if (result.success) {
                    showToast('Import completed successfully!', 'success')
                } else {
                    showToast('Import completed with some errors', 'error')
                }
            }
        } catch (error) {
            showToast('Import failed', 'error')
        } finally {
            setImporting(false)
        }
    }

    const clearPreview = () => {
        setPreview(null)
        setImportResult(null)
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                        <Link href="/settings" className="hover:text-blue-500">Settings</Link>
                        <span>/</span>
                        <span>Raw Data Import</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Raw Data Import</h1>
                    <p className="text-gray-500 mt-1">Import employee and movement data from Excel/TSV format</p>
                </div>
            </div>

            {/* Instructions & Template */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-medium text-blue-800 mb-2">📋 Expected Format</h3>
                    <p className="text-sm text-blue-700 mb-2">
                        Upload a <strong>CSV</strong> or <strong>Tab-separated</strong> file exported from Excel.
                    </p>
                    <div className="text-xs text-blue-600 bg-blue-100 rounded-lg p-3 font-mono overflow-x-auto whitespace-nowrap">
                        Month, Movement Type, Employee ID, Name, Surname, Position Title...
                    </div>
                </div>
                <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition shadow-sm whitespace-nowrap"
                >
                    <FileText size={18} />
                    Download Template (CSV)
                </button>
            </div>

            {/* Upload Area */}
            {!preview && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div
                        className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                            }`}
                        onDragEnter={() => setDragActive(true)}
                        onDragLeave={() => setDragActive(false)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                                <p className="text-gray-600">Parsing file...</p>
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-gray-100 rounded-full mb-4">
                                    <Upload className="text-gray-500" size={32} />
                                </div>
                                <p className="text-gray-800 font-medium mb-2">
                                    Drag & Drop your raw data file here
                                </p>
                                <p className="text-gray-500 text-sm">
                                    or click to browse (.txt, .tsv, .csv)
                                </p>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".txt,.tsv,.csv,.md"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileSelect(file)
                            }}
                            className="hidden"
                        />
                    </div>
                </div>
            )}

            {/* Preview */}
            {preview && !importResult && (
                <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{preview.employees.length}</p>
                                <p className="text-sm text-gray-500">Unique Employees</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-xl text-green-600">
                                <ArrowRightLeft size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{preview.movements.length}</p>
                                <p className="text-sm text-gray-500">Movement Records</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${preview.warnings.length > 0 ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-400'}`}>
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{preview.warnings.length}</p>
                                <p className="text-sm text-gray-500">Warnings</p>
                            </div>
                        </div>
                    </div>

                    {/* Warnings */}
                    {preview.warnings.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setShowWarnings(!showWarnings)}
                                className="w-full p-4 flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="text-yellow-600" size={20} />
                                    <span className="font-medium text-yellow-800">Warnings ({preview.warnings.length})</span>
                                </div>
                                {showWarnings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                            {showWarnings && (
                                <div className="px-4 pb-4 max-h-40 overflow-y-auto">
                                    {preview.warnings.map((w, i) => (
                                        <p key={i} className="text-sm text-yellow-700 py-1">{w}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Employees Preview */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setShowEmployees(!showEmployees)}
                            className="w-full p-4 flex items-center justify-between text-left border-b border-gray-100"
                        >
                            <div className="flex items-center gap-2">
                                <Users className="text-blue-600" size={20} />
                                <span className="font-semibold text-gray-800">Employees Preview</span>
                                <span className="text-sm text-gray-400">({preview.employees.length} records)</span>
                            </div>
                            {showEmployees ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        {showEmployees && (
                            <div className="overflow-x-auto max-h-64">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="text-left py-2 px-3 font-medium text-gray-600">ID</th>
                                            <th className="text-left py-2 px-3 font-medium text-gray-600">Name</th>
                                            <th className="text-left py-2 px-3 font-medium text-gray-600">Birth Date</th>
                                            <th className="text-left py-2 px-3 font-medium text-gray-600">Onboard</th>
                                            <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.employees.slice(0, 20).map((emp) => (
                                            <tr key={emp.employee_id} className="border-b border-gray-50">
                                                <td className="py-2 px-3 font-mono text-xs">{emp.employee_id}</td>
                                                <td className="py-2 px-3">{emp.first_name} {emp.last_name}</td>
                                                <td className="py-2 px-3 text-gray-500">{emp.birth_date || '-'}</td>
                                                <td className="py-2 px-3 text-gray-500">{emp.onboard_date || '-'}</td>
                                                <td className="py-2 px-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.current_status === 'Active' ? 'bg-green-100 text-green-700' :
                                                        emp.current_status === 'Resigned' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {emp.current_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {preview.employees.length > 20 && (
                                    <p className="text-center text-sm text-gray-400 py-2">
                                        ...and {preview.employees.length - 20} more
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Movements Preview */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setShowMovements(!showMovements)}
                            className="w-full p-4 flex items-center justify-between text-left border-b border-gray-100"
                        >
                            <div className="flex items-center gap-2">
                                <ArrowRightLeft className="text-green-600" size={20} />
                                <span className="font-semibold text-gray-800">Movements Preview</span>
                                <span className="text-sm text-gray-400">({preview.movements.length} records)</span>
                            </div>
                            {showMovements ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        {showMovements && (
                            <div className="overflow-x-auto max-h-64">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="text-left py-2 px-3 font-medium text-gray-600">Employee</th>
                                            <th className="text-left py-2 px-3 font-medium text-gray-600">Type</th>
                                            <th className="text-left py-2 px-3 font-medium text-gray-600">Date</th>
                                            <th className="text-left py-2 px-3 font-medium text-gray-600">Position</th>
                                            <th className="text-left py-2 px-3 font-medium text-gray-600">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.movements.slice(0, 20).map((mov, i) => (
                                            <tr key={i} className="border-b border-gray-50">
                                                <td className="py-2 px-3 font-mono text-xs">{mov.employee_id}</td>
                                                <td className="py-2 px-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${mov.movement_type === 'New Hired' ? 'bg-green-100 text-green-700' :
                                                        mov.movement_type.includes('Resignation') ? 'bg-red-100 text-red-700' :
                                                            mov.movement_type.includes('Transfer') ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {mov.movement_type}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-gray-500">{mov.effective_date || '-'}</td>
                                                <td className="py-2 px-3 text-gray-600 max-w-48 truncate">{mov.position_title}</td>
                                                <td className="py-2 px-3 text-gray-500">{mov.reason_code || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {preview.movements.length > 20 && (
                                    <p className="text-center text-sm text-gray-400 py-2">
                                        ...and {preview.movements.length - 20} more
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={clearPreview}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {importing ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Import to Database
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Import Result */}
            {importResult && (
                <div className="space-y-4">
                    <div className={`rounded-xl border p-6 ${importResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex items-center gap-3 mb-4">
                            {importResult.success ? (
                                <CheckCircle2 className="text-green-600" size={32} />
                            ) : (
                                <AlertCircle className="text-red-600" size={32} />
                            )}
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    {importResult.success ? 'Import Completed!' : 'Import Completed with Errors'}
                                </h3>
                                <p className="text-gray-600">
                                    {importResult.employees.inserted} employees and {importResult.movements.inserted} movements imported
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-white/50 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">Employees</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {importResult.employees.inserted} / {importResult.employees.total}
                                </p>
                            </div>
                            <div className="bg-white/50 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">Movements</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {importResult.movements.inserted} / {importResult.movements.total}
                                </p>
                            </div>
                        </div>

                        {/* Errors */}
                        {(importResult.employees.errors.length > 0 || importResult.movements.errors.length > 0) && (
                            <div className="mt-4 bg-white/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                                <p className="font-medium text-red-700 mb-2">Errors:</p>
                                {importResult.employees.errors.slice(0, 10).map((e, i) => (
                                    <p key={`emp-${i}`} className="text-sm text-red-600">{e}</p>
                                ))}
                                {importResult.movements.errors.slice(0, 10).map((e, i) => (
                                    <p key={`mov-${i}`} className="text-sm text-red-600">{e}</p>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={clearPreview}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition font-medium"
                        >
                            Import Another File
                        </button>
                        <Link
                            href="/employees"
                            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition font-medium"
                        >
                            View Employees
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
