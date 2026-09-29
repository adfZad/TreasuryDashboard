const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sql, poolPromise } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Import Auth Routes
const { router: authRouter } = require('./auth');
const uploadRouter = require('./routes/upload');
const workflowRouter = require('./routes/workflow');

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/workflow', workflowRouter);

// Routes
app.get('/api/dashboard', async (req, res) => {
    try {
        const pool = await poolPromise;
        const resultBank = await pool.request().query('SELECT SUM(ReportingCurrencyAmount) as TotalBankBalance FROM banking.BankBalance');
        const resultLoans = await pool.request().query('SELECT SUM(CurrentOutstanding) as TotalLoans FROM treasury.Loan');
        const resultWC = await pool.request().query('SELECT SUM(UtilizedAmount) as Utilized, SUM(SanctionedLimit) as Sanctioned FROM treasury.WorkingCapitalFacility wcf JOIN treasury.FacilityUtilization fu ON wcf.FacilityId = fu.FacilityId');
        const resultFundsSum = await pool.request().query('SELECT ISNULL(SUM(ClosingBalance),0) as Total FROM banking.BankBalance');
        const totalBankBalance = (resultFundsSum.recordset[0].Total || 0) / 1000000;

        // Fetch dynamic reserves
        const resultReserves = await pool.request().query('SELECT TOP 1 LiquidityReserve, WorkingCapitalReserve FROM banking.FundsSummary');
        let wcReserves = 2;
        let liquidityReserves = 5;
        if (resultReserves.recordset.length > 0) {
            wcReserves = resultReserves.recordset[0].WorkingCapitalReserve || 0;
            liquidityReserves = resultReserves.recordset[0].LiquidityReserve || 0;
        }

        const availableFunds = totalBankBalance - wcReserves - liquidityReserves;
        const resultEquity = await pool.request().query('SELECT SUM(ClosingBookValue) as TotalEquity FROM treasury.EquityValuation');

        res.json({ 
            bankBalance: resultBank.recordset[0].TotalBankBalance || 0,
            totalLoans: resultLoans.recordset[0].TotalLoans || 0,
            wcUtilized: resultWC.recordset[0].Utilized || 0,
            wcSanctioned: resultWC.recordset[0].Sanctioned || 0,
            totalEquity: resultEquity.recordset[0].TotalEquity || 0,
            availableFunds: availableFunds
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/funds', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                b.AccountNumber, 
                b.AccountName,
                bk.BankName, 
                bal.ClosingBalance, 
                c.CurrencyCode 
            FROM banking.BankBalance bal
            JOIN banking.BankAccount b ON bal.BankAccountId = b.BankAccountId
            JOIN ref.Bank bk ON b.BankId = bk.BankId
            JOIN ref.Currency c ON bal.CurrencyId = c.CurrencyId
        `);
        
        const summaryResult = await pool.request().query('SELECT TOP 1 LiquidityReserve, WorkingCapitalReserve FROM banking.FundsSummary');
        let summary = { liquidityReserve: 5, workingCapitalReserve: 2 };
        if (summaryResult.recordset.length > 0) {
            summary = {
                liquidityReserve: summaryResult.recordset[0].LiquidityReserve,
                workingCapitalReserve: summaryResult.recordset[0].WorkingCapitalReserve
            };
        }

        res.json({ balances: result.recordset, summary });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/cashflow', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                cf.BucketStartDate,
                cf.BucketEndDate,
                cf.Amount,
                c.CategoryName,
                c.DirectionCode
            FROM treasury.CashFlowForecast cf
            JOIN treasury.CashFlowCategory c ON cf.CashFlowCategoryId = c.CashFlowCategoryId
            ORDER BY cf.BucketStartDate, c.SequenceNo
        `);
        res.json({ forecasts: result.recordset });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/cashflow/comments', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TOP 1 CommentText FROM CashFlowComments ORDER BY UpdatedAt DESC
        `);
        res.json({ comment: result.recordset[0] ? result.recordset[0].CommentText : '' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/cashflow/comments', async (req, res) => {
    try {
        const { comment } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('comment', sql.NVarChar(sql.MAX), comment)
            .query(`INSERT INTO CashFlowComments (CommentText, UpdatedAt) VALUES (@comment, GETDATE())`);
        res.json({ message: 'Comment saved successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/workingcapital', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                wcf.FacilityReference, 
                b.BankName, 
                c.CountryName as Region,
                ft.FacilityTypeName, 
                wcf.SanctionedLimit, 
                fu.UtilizedAmount, 
                fu.AvailableAmount, 
                fu.UtilizationPct 
            FROM treasury.WorkingCapitalFacility wcf
            JOIN treasury.FacilityUtilization fu ON wcf.FacilityId = fu.FacilityId
            JOIN ref.Bank b ON wcf.BankId = b.BankId
            JOIN ref.FacilityType ft ON wcf.FacilityTypeId = ft.FacilityTypeId
            LEFT JOIN ref.Country c ON b.CountryId = c.CountryId
        `);
        res.json({ facilities: result.recordset });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/loans', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                l.LoanReference, 
                l.LenderName, 
                l.LoanTypeCode, 
                l.OriginalLoanAmount, 
                l.CurrentOutstanding, 
                l.MaturityDate 
            FROM treasury.Loan l
        `);
        res.json({ loans: result.recordset });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const xlsx = require('xlsx');

app.get('/api/loans/excel', (req, res) => {
    try {
        const filePath = getLatestExcelFile();
        const workbook = xlsx.readFile(filePath);
        const worksheet = workbook.Sheets['4. Loan'];
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });

        const shortTerm = [];
        for (let i = 10; i <= 15; i++) {
            const row = data[i];
            shortTerm.push({
                bank: row[0],
                aug26: parseFloat(row[1]) || 0,
                sep26: parseFloat(row[2]) || 0,
                oct26: parseFloat(row[3]) || 0,
                totalOS: parseFloat(row[4]) || 0,
                label: row[5] || row[0]
            });
        }
        
        const longTerm = [];
        for (let i = 20; i <= 24; i++) {
            const row = data[i];
            if (!row || !row[0]) continue;
            longTerm.push({
                bank: row[0]?.replace(/\r\n/g, ' '),
                desc: row[1],
                amount: parseFloat(row[2]) || 0,
                tenure: row[3],
                start: row[4],
                end: row[5],
                freq: row[6],
                paid2025: parseFloat(row[7]) || 0,
                paid2026: parseFloat(row[8]) || 0,
                balance: parseFloat(row[9]) || 0,
                y2026: parseFloat(row[10]) || 0,
                y2027: parseFloat(row[11]) || 0,
                y2028: parseFloat(row[12]) || 0,
                y2029: parseFloat(row[13]) || 0,
                y2030: parseFloat(row[14]) || 0,
                y2031: parseFloat(row[15]) || 0,
                y2032: parseFloat(row[16]) || 0,
                y2033: parseFloat(row[17]) || 0,
                y2034: parseFloat(row[18]) || 0,
                y2035_2038: parseFloat(row[19]) || 0
            });
        }

        if (data[27] && data[27][0]) {
            const row = data[27];
            longTerm.push({
                bank: row[0]?.replace(/\r\n/g, ' '),
                desc: row[1],
                amount: parseFloat(row[2]) || 0,
                tenure: row[3],
                start: row[4],
                end: row[5],
                freq: row[6],
                paid2025: parseFloat(row[7]) || 0,
                paid2026: parseFloat(row[8]) || 0,
                balance: parseFloat(row[9]) || 0,
                y2026: parseFloat(row[10]) || 0,
                y2027: parseFloat(row[11]) || 0,
                y2028: parseFloat(row[12]) || 0,
                y2029: parseFloat(row[13]) || 0,
                y2030: parseFloat(row[14]) || 0,
                y2031: parseFloat(row[15]) || 0,
                y2032: parseFloat(row[16]) || 0,
                y2033: parseFloat(row[17]) || 0,
                y2034: parseFloat(row[18]) || 0,
                y2035_2038: parseFloat(row[19]) || 0,
                isNew: true
            });
        }
        
        // First Total row (Row 25)
        if (data[25] && data[25][1] && data[25][1].indexOf('Total') > -1) {
            const r25 = data[25];
            longTerm.push({
                bank: 'Total',
                desc: r25[1],
                amount: parseFloat(r25[2]) || 0,
                tenure: r25[3],
                start: r25[4],
                end: r25[5],
                freq: r25[6],
                paid2025: parseFloat(r25[7]) || 0,
                paid2026: parseFloat(r25[8]) || 0,
                balance: parseFloat(r25[9]) || 0,
                y2026: parseFloat(r25[10]) || 0,
                y2027: parseFloat(r25[11]) || 0,
                y2028: parseFloat(r25[12]) || 0,
                y2029: parseFloat(r25[13]) || 0,
                y2030: parseFloat(r25[14]) || 0,
                y2031: parseFloat(r25[15]) || 0,
                y2032: parseFloat(r25[16]) || 0,
                y2033: parseFloat(r25[17]) || 0,
                y2034: parseFloat(r25[18]) || 0,
                y2035_2038: parseFloat(r25[19]) || 0
            });
        }
        
        // Final Total row (Row 28)
        if (data[28] && data[28][0] && data[28][0].indexOf('Total') > -1) {
            const r28 = data[28];
            longTerm.push({
                bank: r28[0]?.replace(/\r\n/g, ' '),
                desc: r28[1] || 'Total',
                amount: parseFloat(r28[2]) || 0,
                tenure: r28[3],
                start: r28[4],
                end: r28[5],
                freq: r28[6],
                paid2025: parseFloat(r28[7]) || 0,
                paid2026: parseFloat(r28[8]) || 0,
                balance: parseFloat(r28[9]) || 0,
                y2026: parseFloat(r28[10]) || 0,
                y2027: parseFloat(r28[11]) || 0,
                y2028: parseFloat(r28[12]) || 0,
                y2029: parseFloat(r28[13]) || 0,
                y2030: parseFloat(r28[14]) || 0,
                y2031: parseFloat(r28[15]) || 0,
                y2032: parseFloat(r28[16]) || 0,
                y2033: parseFloat(r28[17]) || 0,
                y2034: parseFloat(r28[18]) || 0,
                y2035_2038: parseFloat(r28[19]) || 0
            });
        }

        res.json({ shortTerm, longTerm });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/debt/excel', (req, res) => {
    try {
        const filePath = getLatestExcelFile();
        const workbook = xlsx.readFile(filePath);
        const worksheet = workbook.Sheets['5. Debt & Equity'];
        if (!worksheet) {
            return res.status(404).json({ error: "Sheet '5. Debt & Equity' not found" });
        }
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });

        const debtOverview = {
            shortTerm: parseFloat(data[10]?.[2]) || 0,
            longTerm: parseFloat(data[11]?.[2]) || 0,
            fd: parseFloat(data[12]?.[2]) || 0,
            liquidityReserve: parseFloat(data[13]?.[2]) || 0,
            equityBookValue: parseFloat(data[17]?.[7]) || parseFloat(data[17]?.[8]) || 0
        };

        const getRowData = (rowIdx, startIdx, endIdx) => {
            if (!data[rowIdx]) return [];
            return data[rowIdx].slice(startIdx, endIdx + 1).map(v => parseFloat(v) || 0);
        };

        const debtEquityRatio = {
            periods: data[21]?.slice(2, 7) || [],
            debt: getRowData(22, 2, 6),
            equity: getRowData(23, 2, 6),
            ratio: getRowData(24, 2, 6)
        };

        const liquidAssetsCost = {
            periods: data[28]?.slice(2, 7) || [],
            debt: getRowData(29, 2, 6),
            liquidAssets: getRowData(30, 2, 6),
            cashAtBank: getRowData(31, 2, 6),
            investmentsShares: getRowData(32, 2, 6),
            investmentsMetal: getRowData(33, 2, 6),
            ratio: getRowData(34, 2, 6)
        };

        const liquidAssetsMkt = {
            periods: data[38]?.slice(2, 7) || [],
            debt: getRowData(39, 2, 6),
            liquidAssets: getRowData(40, 2, 6),
            cashAtBank: getRowData(41, 2, 6),
            investmentsShares: getRowData(42, 2, 6),
            investmentsMetal: getRowData(43, 2, 6),
            ratio: getRowData(44, 2, 6)
        };

        res.json({
            debtOverview,
            debtEquityRatio,
            liquidAssetsCost,
            liquidAssetsMkt
        });
    } catch (err) {
        console.error("Debt parser error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/debt', async (req, res) => {
    try {
        const pool = await poolPromise;
        const resultLoans = await pool.request().query('SELECT SUM(CurrentOutstanding) as TotalDebt FROM treasury.Loan');
        const resultEquity = await pool.request().query('SELECT SUM(ClosingBookValue) as TotalEquity FROM treasury.EquityValuation');
        
        res.json({ 
            totalDebt: resultLoans.recordset[0].TotalDebt || 0,
            totalEquity: resultEquity.recordset[0].TotalEquity || 0
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/movement', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                mf.BucketStartDate, 
                mf.BucketEndDate, 
                mf.OpeningOutstanding, 
                mf.PaymentAmount, 
                mf.NewDrawdownAmount, 
                mf.ClosingOutstanding, 
                l.LoanReference, 
                l.LenderName
            FROM treasury.LoanMovementForecast mf
            JOIN treasury.Loan l ON mf.LoanId = l.LoanId
            ORDER BY mf.BucketStartDate
        `);
        res.json({ movements: result.recordset });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/workflow', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                wc.CommentText, 
                wc.CreatedAtUtc, 
                wc.ModuleCode, 
                u.DisplayName as UserName, 
                r.RoleName
            FROM workflow.WorkflowComment wc
            JOIN sec.AppUser u ON wc.CommentedByUserId = u.AppUserId
            JOIN sec.SecurityRole r ON wc.CommentedByRoleId = r.SecurityRoleId
            ORDER BY wc.CreatedAtUtc DESC
        `);
        res.json({ comments: result.recordset });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/workflow', async (req, res) => {
    try {
        const { commentText, moduleCode } = req.body;
        const pool = await poolPromise;
        
        const makerId = await pool.request().query("SELECT AppUserId FROM sec.AppUser WHERE LoginName = 'treasury_maker'");
        const roleId = await pool.request().query("SELECT SecurityRoleId FROM sec.SecurityRole WHERE RoleCode = 'MAKER'");
        const perId = await pool.request().query("SELECT TOP 1 ReportingPeriodId FROM rpt.ReportingPeriod");
        const verId = await pool.request().query("SELECT TOP 1 ReportVersionId FROM rpt.ReportVersion");

        await pool.request()
            .input('perId', sql.Int, perId.recordset[0].ReportingPeriodId)
            .input('verId', sql.BigInt, verId.recordset[0].ReportVersionId)
            .input('modCode', sql.VarChar, moduleCode || 'GENERAL')
            .input('userId', sql.BigInt, makerId.recordset[0].AppUserId)
            .input('roleId', sql.Int, roleId.recordset[0].SecurityRoleId)
            .input('text', sql.NVarChar, commentText)
            .query(`
                INSERT INTO workflow.WorkflowComment 
                (ReportingPeriodId, ReportVersionId, ModuleCode, CommentedByUserId, CommentedByRoleId, CommentText)
                VALUES (@perId, @verId, @modCode, @userId, @roleId, @text)
            `);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, 'latest_treasury_report.xlsx')
    }
});
const upload = multer({ storage: storage });

function getLatestExcelFile() {
    const uploadedFile = path.join(__dirname, 'uploads', 'latest_treasury_report.xlsx');
    if (fs.existsSync(uploadedFile)) {
        return uploadedFile;
    }
    return path.join(__dirname, '../00. Treasury report as on 15Aug2026.xlsx');
}

app.post('/api/data', upload.single('excelFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Simulate some validation time
    setTimeout(() => res.json({ success: true, message: "Excel file successfully processed and staged for validation." }), 1000);
});

// Serve static frontend files for production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback for React Router
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});
