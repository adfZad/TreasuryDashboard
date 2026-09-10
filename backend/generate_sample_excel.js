const xlsx = require('xlsx');
const path = require('path');

// Create some dummy data
const data = [
    { AccountID: '1001', BankName: 'Qatar National Bank', Balance: 5000000, Currency: 'QAR' },
    { AccountID: '1002', BankName: 'Commercial Bank of Qatar', Balance: 2100000, Currency: 'QAR' },
    { AccountID: '', BankName: 'Missing Account Bank', Balance: 10000, Currency: 'USD' } // This should trigger a validation error!
];

// Create a new workbook and add the data
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(data);
xlsx.utils.book_append_sheet(wb, ws, "Sheet1");

// Save the file
const outputPath = path.join(__dirname, '..', 'Sample_Bank_Balances.xlsx');
xlsx.writeFile(wb, outputPath);

console.log('Sample file created at:', outputPath);
