const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '00. Treasury report as on 15Aug2026.xlsx');
const workbook = xlsx.readFile(filePath);

console.log(`Workbook has ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}\n`);

const mainSheets = ["1. Funds position", "2. Cash flow", "3. Working capital", "4. Loan"];

for (const sheetName of mainSheets) {
    if (!workbook.SheetNames.includes(sheetName)) {
        console.log(`Sheet ${sheetName} not found!`);
        continue;
    }
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    // Convert to JSON, getting the raw arrays to see the structure easily
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: null });
    
    // Print first 30 rows to understand the layout
    const preview = data.slice(0, 30);
    console.log(JSON.stringify(preview, null, 2));
}
