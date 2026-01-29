export function downloadCSV(data: any[], filename: string) {
    if (!data || data.length === 0) {
        console.warn('No data to export')
        return
    }

    // 1. Extract Headers
    // Get all unique keys from all objects to ensure no data is lost
    const allKeys = Array.from(new Set(data.flatMap(Object.keys)))

    // 2. Format Headers
    const headers = allKeys.map(key => `"${key}"`).join(',')

    // 3. Format Rows
    const rows = data.map(row => {
        return allKeys.map(key => {
            const value = row[key]

            // Handle null/undefined
            if (value === null || value === undefined) return ''

            // Handle strings: escape quotes and wrap in quotes
            const stringValue = String(value)
            return `"${stringValue.replace(/"/g, '""')}"`
        }).join(',')
    })

    // 4. Combine with BOM for Excel UTF-8 support
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n')

    // 5. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}
