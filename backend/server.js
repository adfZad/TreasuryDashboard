const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sql, poolPromise } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
        const resultEquity = await pool.request().query('SELECT SUM(ClosingBookValue) as TotalEquity FROM treasury.EquityValuation');

        res.json({ 
            bankBalance: resultBank.recordset[0].TotalBankBalance || 0,
            totalLoans: resultLoans.recordset[0].TotalLoans || 0,
            wcUtilized: resultWC.recordset[0].Utilized || 0,
            wcSanctioned: resultWC.recordset[0].Sanctioned || 0,
            totalEquity: resultEquity.recordset[0].TotalEquity || 0
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
        res.json({ balances: result.recordset });
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

app.get('/api/workingcapital', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                wcf.FacilityReference, 
                b.BankName, 
                ft.FacilityTypeName, 
                wcf.SanctionedLimit, 
                fu.UtilizedAmount, 
                fu.AvailableAmount, 
                fu.UtilizationPct 
            FROM treasury.WorkingCapitalFacility wcf
            JOIN treasury.FacilityUtilization fu ON wcf.FacilityId = fu.FacilityId
            JOIN ref.Bank b ON wcf.BankId = b.BankId
            JOIN ref.FacilityType ft ON wcf.FacilityTypeId = ft.FacilityTypeId
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

app.post('/api/data', async (req, res) => {
    // Dummy endpoint for Data Input UI
    setTimeout(() => res.json({ success: true, message: "Data successfully received and staged for validation." }), 1000);
});

// Serve static frontend files for production
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback for React Router
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});
