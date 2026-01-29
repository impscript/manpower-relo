
const fs = require('fs');
const path = require('path');

function parseLeavingReason(rawReason) {
    if (!rawReason || rawReason.trim() === '') return null;
    const match = rawReason.match(/^\d+\s*-\s*(.+)$/);
    return match ? match[1].trim() : rawReason.trim();
}

function debugParser() {
    const rawPath = path.join(__dirname, '../../raw_data.md');
    const content = fs.readFileSync(rawPath, 'utf-8');
    const lines = content.trim().split('\n');

    // Header
    const header = lines[0].split('\t');
    console.log('Header col 23:', header[23]); // Should be "สาเหตุการลาออก"

    // First few rows
    for (let i = 1; i < 5; i++) {
        const line = lines[i];
        if (!line) continue;
        const cols = line.split('\t');
        const leavingReason = cols[23] || '';
        const parsed = parseLeavingReason(leavingReason);
        console.log(`Row ${i}: Raw Reason="${leavingReason}", Parsed="${parsed}"`);
    }
}

debugParser();
