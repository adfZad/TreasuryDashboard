const { poolPromise, sql } = require('../db');

async function processBatchData(batchId) {
    const pool = await poolPromise;
    if (!pool) throw new Error('Database connection failed');

    // 1. Get Batch Details
    const batchRes = await pool.request()
        .input('batchId', sql.BigInt, batchId)
        .query('SELECT ReportingPeriodId, ReportVersionId FROM ingest.UploadBatch WHERE UploadBatchId = @batchId AND BatchStatus = \'DRAFT\'');
    
    if (batchRes.recordset.length === 0) {
        throw new Error('Batch not found or already processed');
    }

    const { ReportingPeriodId: perId, ReportVersionId: verId } = batchRes.recordset[0];

    // 2. Fetch Staged Details
    const detailsRes = await pool.request()
        .input('batchId', sql.BigInt, batchId)
        .query('SELECT RawPayloadJson, TargetRecordType FROM ingest.UploadDetail WHERE UploadBatchId = @batchId');

    const details = detailsRes.recordset;
    if (details.length === 0) return { success: true, message: 'No data to process' };

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const req = () => new sql.Request(transaction);

        // A. Clear existing data for this period/version to avoid duplicates
        await req().input('perId', sql.Int, perId).input('verId', sql.BigInt, verId)
            .query('DELETE FROM banking.BankBalance WHERE ReportingPeriodId = @perId AND ReportVersionId = @verId');
            
        await req().input('perId', sql.Int, perId).input('verId', sql.BigInt, verId)
            .query('DELETE FROM treasury.CashFlowForecast WHERE ReportingPeriodId = @perId AND ReportVersionId = @verId');

        // Note: For Working Capital and Loans, standard practice is to UPDATE existing records or handle history. 
        // For simplicity in this demo, we will TRUNCATE/DELETE or just UPDATE matched rows.
        await req().query('DELETE FROM treasury.FacilityUtilization');
        await req().query('DELETE FROM treasury.LoanMovementForecast'); // Must delete children first
        await req().query('DELETE FROM treasury.Loan');

        // B. Pre-load Reference Lookups
        const categories = await req().query('SELECT CashFlowCategoryId, CategoryCode, DirectionCode FROM treasury.CashFlowCategory');
        const catIn = categories.recordset.find(c => c.DirectionCode === 'IN')?.CashFlowCategoryId;
        const catOut = categories.recordset.find(c => c.DirectionCode === 'OUT')?.CashFlowCategoryId;
        
        // Helper to get or create a Bank
        async function getOrCreateBank(bankName) {
            if (!bankName) bankName = 'Unknown Bank';
            bankName = bankName.replace(/[\r\n]+/g, ' ').trim();
            const bankCode = bankName.substring(0, 5).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
            
            const bRes = await req().input('bName', sql.NVarChar, bankName).query('SELECT BankId FROM ref.Bank WHERE BankName = @bName OR BankCode = @bName');
            if (bRes.recordset.length > 0) return bRes.recordset[0].BankId;

            // Fuzzy match (contains)
            const fuzzyRes = await req().input('bName', sql.NVarChar, `%${bankName}%`).query('SELECT TOP 1 BankId FROM ref.Bank WHERE BankName LIKE @bName');
            if (fuzzyRes.recordset.length > 0) return fuzzyRes.recordset[0].BankId;

            // Insert new
            const insertRes = await req()
                .input('code', sql.VarChar, bankCode)
                .input('name', sql.NVarChar, bankName)
                .query('INSERT INTO ref.Bank (BankCode, BankName) OUTPUT INSERTED.BankId VALUES (@code, @name)');
            return insertRes.recordset[0].BankId;
        }

        // Helper to get or create a Bank Account
        const accMap = {};
        async function getOrCreateAccount(bankName, companyName, accountNo) {
            const cacheKey = `${bankName}_${companyName}_${accountNo}`;
            if (accMap[cacheKey]) return accMap[cacheKey];

            const bankId = await getOrCreateBank(bankName);
            const aRes = await req()
                .input('bId', sql.Int, bankId)
                .input('aNo', sql.VarChar, accountNo)
                .query('SELECT BankAccountId FROM banking.BankAccount WHERE BankId = @bId AND AccountNumber = @aNo');
            
            if (aRes.recordset.length > 0) {
                accMap[cacheKey] = aRes.recordset[0].BankAccountId;
                return accMap[cacheKey];
            }

            // Insert new
            const insertRes = await req()
                .input('buId', sql.Int, 1) // default to HQ
                .input('bId', sql.Int, bankId)
                .input('name', sql.NVarChar, companyName || 'Auto Provisioned')
                .input('aNo', sql.VarChar, accountNo)
                .input('currId', sql.SmallInt, 1) // QAR
                .query('INSERT INTO banking.BankAccount (BusinessUnitId, BankId, AccountName, AccountNumber, CurrencyId) OUTPUT INSERTED.BankAccountId VALUES (@buId, @bId, @name, @aNo, @currId)');
            
            accMap[cacheKey] = insertRes.recordset[0].BankAccountId;
            return accMap[cacheKey];
        }

        // Helper to get or create a Facility
        async function getOrCreateFacility(bankName, facilityType) {
            const bankId = await getOrCreateBank(bankName);
            const fRes = await req()
                .input('bId', sql.Int, bankId)
                .query('SELECT TOP 1 FacilityId FROM treasury.WorkingCapitalFacility WHERE BankId = @bId');
            
            if (fRes.recordset.length > 0) return fRes.recordset[0].FacilityId;

            const insertRes = await req()
                .input('bId', sql.Int, bankId)
                .input('ref', sql.VarChar, bankName.substring(0,3).toUpperCase() + '-FAC-' + Math.floor(Math.random() * 1000))
                .query(`INSERT INTO treasury.WorkingCapitalFacility (BankId, FacilityReference, FacilityTypeId, BusinessUnitId, CurrencyId, SanctionedLimit, IsSharedLimit, FacilityStatus) OUTPUT INSERTED.FacilityId VALUES (@bId, @ref, 2, 1, 1, 0, 0, 'ACTIVE')`);
            
            return insertRes.recordset[0].FacilityId;
        }

        // C. Process each row
        for (const row of details) {
            const data = JSON.parse(row.RawPayloadJson);
            
            if (row.TargetRecordType === 'FUNDS_POSITION') {
                const accId = await getOrCreateAccount(data.bankName, data.companyName, data.accountNo);
                if (accId) {
                    try {
                        await req()
                            .input('accId', sql.BigInt, accId)
                            .input('perId', sql.Int, perId)
                            .input('verId', sql.BigInt, verId)
                            .input('amount', sql.Decimal(18,2), data.closingBalance)
                            .query(`
                                INSERT INTO banking.BankBalance (BankAccountId, ReportingPeriodId, ReportVersionId, BalanceDate, ClosingBalance, CurrencyId, ReportingCurrencyAmount, SourceType)
                                VALUES (@accId, @perId, @verId, CAST(GETUTCDATE() AS DATE), @amount, 1, @amount, 'Upload')
                            `);
                    } catch (err) {
                        if (err.message.includes('duplicate key') || err.message.includes('UX_BankBalance')) {
                            await req()
                                .input('accId', sql.BigInt, accId)
                                .input('perId', sql.Int, perId)
                                .input('verId', sql.BigInt, verId)
                                .input('amount', sql.Decimal(18,2), data.closingBalance)
                                .query(`
                                    UPDATE banking.BankBalance 
                                    SET ClosingBalance = ClosingBalance + @amount,
                                        ReportingCurrencyAmount = ReportingCurrencyAmount + @amount
                                    WHERE BankAccountId = @accId AND ReportVersionId = @verId AND BalanceDate = CAST(GETUTCDATE() AS DATE)
                                `);
                        } else {
                            throw err;
                        }
                    }
                }
            } 
            else if (row.TargetRecordType === 'CASH_FLOW_IN' || row.TargetRecordType === 'CASH_FLOW_OUT') {
                const catId = row.TargetRecordType === 'CASH_FLOW_IN' ? catIn : catOut;
                await req()
                    .input('perId', sql.Int, perId)
                    .input('verId', sql.BigInt, verId)
                    .input('catId', sql.Int, catId)
                    .input('startDate', sql.Date, data.bucketStartDate)
                    .input('endDate', sql.Date, data.bucketEndDate)
                    .input('amount', sql.Decimal(18,2), data.amount)
                    .query(`
                        INSERT INTO treasury.CashFlowForecast (ReportingPeriodId, ReportVersionId, BusinessUnitId, CashFlowCategoryId, BucketStartDate, BucketEndDate, BucketType, Amount, CurrencyId, SourceType)
                        VALUES (@perId, @verId, 1, @catId, @startDate, @endDate, 'Monthly', @amount, 1, 'Upload')
                    `);
            }
            else if (row.TargetRecordType === 'WORKING_CAPITAL') {
                const facId = await getOrCreateFacility(data.bankName, data.facilityType);
                if (facId) {
                    await req()
                        .input('fId', sql.BigInt, facId)
                        .input('perId', sql.Int, perId)
                        .input('verId', sql.BigInt, verId)
                        .input('utilized', sql.Decimal(18,2), data.utilized)
                        .input('available', sql.Decimal(18,2), data.totalLimit - data.utilized)
                        .input('pct', sql.Decimal(5,2), data.totalLimit ? (data.utilized / data.totalLimit) * 100 : 0)
                        .query(`
                            INSERT INTO treasury.FacilityUtilization (FacilityId, ReportingPeriodId, ReportVersionId, AsOfDate, UtilizedAmount, UnderProcessAmount, AvailableAmount, UtilizationPct, SourceType)
                            VALUES (@fId, @perId, @verId, CAST(GETUTCDATE() AS DATE), @utilized, 0, @available, @pct, 'Upload')
                        `);
                }
            }
            else if (row.TargetRecordType === 'LOAN_ST' || row.TargetRecordType === 'LOAN_LT') {
                await req()
                    .input('ref', sql.VarChar, data.bankName + '-' + (row.TargetRecordType === 'LOAN_ST' ? 'ST' : 'LT') + '-' + data.batchRowIndex)
                    .input('lender', sql.NVarChar, data.bankName)
                    .input('type', sql.VarChar, row.TargetRecordType === 'LOAN_ST' ? 'ST' : 'LT')
                    .input('amount', sql.Decimal(18,2), data.currentOutstanding)
                    .query(`
                        INSERT INTO treasury.Loan (BusinessUnitId, LoanReference, LenderName, LoanTypeCode, CurrencyId, OriginalLoanAmount, CurrentOutstanding, LoanStatus)
                        VALUES (1, @ref, @lender, @type, 1, @amount, @amount, 'ACTIVE')
                    `);
            }
        }

        // D. Mark Batch as Approved
        await req().input('batchId', sql.BigInt, batchId).query(`UPDATE ingest.UploadBatch SET BatchStatus = 'APPROVED' WHERE UploadBatchId = @batchId`);
        await req().input('batchId', sql.BigInt, batchId).query(`UPDATE ingest.UploadDetail SET ImportStatus = 'PROCESSED' WHERE UploadBatchId = @batchId`);

        await transaction.commit();
        return { success: true };

    } catch (err) {
        await transaction.rollback();
        console.error('Data Processing Error:', err);
        throw err;
    }
}

module.exports = {
    processBatchData
};
