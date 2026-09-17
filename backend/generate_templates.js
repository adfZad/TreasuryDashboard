const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const masterPath = path.join(__dirname, '../00. Treasury report as on 15Aug2026.xlsx');
const outDir = path.join(__dirname, '../frontend/public');

// Ensure outDir exists
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// 1. Copy Master template
fs.copyFileSync(masterPath, path.join(outDir, 'Sample_Template_Master.xlsx'));
console.log('Generated Sample_Template_Master.xlsx');

// 2. Read Master workbook
const workbook = xlsx.readFile(masterPath);

// Helper to extract a single sheet into a new workbook
function exportTemplate(sheetName, outName) {
    const newWb = xlsx.utils.book_new();
    if (workbook.Sheets[sheetName]) {
        xlsx.utils.book_append_sheet(newWb, workbook.Sheets[sheetName], sheetName);
        xlsx.writeFile(newWb, path.join(outDir, outName));
        console.log(`Generated ${outName}`);
    } else {
        console.error(`Sheet '${sheetName}' not found in master workbook.`);
    }
}

// 3. Generate specific templates
exportTemplate('1. Funds position', 'Sample_Template_Funds.xlsx');
exportTemplate('2. Cash flow', 'Sample_Template_CashFlow.xlsx');
exportTemplate('3. Working capital', 'Sample_Template_WorkingCapital.xlsx');
exportTemplate('4. Loan', 'Sample_Template_Loans.xlsx');
