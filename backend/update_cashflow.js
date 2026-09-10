const { poolPromise, sql } = require('./db');

async function updateCashflow() {
    try {
        const pool = await poolPromise;
        if (!pool) {
            console.error('Database connection failed');
            return;
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Delete old data
            await transaction.request().query("DELETE FROM treasury.CashFlowForecast");

            // Get categories
            const catInRes = await transaction.request().query("SELECT CashFlowCategoryId FROM treasury.CashFlowCategory WHERE CategoryCode = 'INFLOW_SALES'");
            const catOutRes = await transaction.request().query("SELECT CashFlowCategoryId FROM treasury.CashFlowCategory WHERE CategoryCode = 'OUTFLOW_OPEX'");
            
            const catInId = catInRes.recordset[0].CashFlowCategoryId;
            const catOutId = catOutRes.recordset[0].CashFlowCategoryId;

            const perId = 1;
            const verId = 1;
            const curId = 1;

            const req = new sql.Request(transaction);

            // August
            await req.query(`INSERT INTO treasury.CashFlowForecast (ReportingPeriodId, ReportVersionId, BusinessUnitId, CashFlowCategoryId, BucketStartDate, BucketEndDate, Amount, CurrencyId, SourceType) VALUES (${perId}, ${verId}, 1, ${catInId}, '2026-08-01', '2026-08-31', 100, ${curId}, 'Manual')`);
            await req.query(`INSERT INTO treasury.CashFlowForecast (ReportingPeriodId, ReportVersionId, BusinessUnitId, CashFlowCategoryId, BucketStartDate, BucketEndDate, Amount, CurrencyId, SourceType) VALUES (${perId}, ${verId}, 1, ${catOutId}, '2026-08-01', '2026-08-31', -90, ${curId}, 'Manual')`);

            // September
            await req.query(`INSERT INTO treasury.CashFlowForecast (ReportingPeriodId, ReportVersionId, BusinessUnitId, CashFlowCategoryId, BucketStartDate, BucketEndDate, Amount, CurrencyId, SourceType) VALUES (${perId}, ${verId}, 1, ${catInId}, '2026-09-01', '2026-09-30', 120, ${curId}, 'Manual')`);
            await req.query(`INSERT INTO treasury.CashFlowForecast (ReportingPeriodId, ReportVersionId, BusinessUnitId, CashFlowCategoryId, BucketStartDate, BucketEndDate, Amount, CurrencyId, SourceType) VALUES (${perId}, ${verId}, 1, ${catOutId}, '2026-09-01', '2026-09-30', -120, ${curId}, 'Manual')`);

            // October
            await req.query(`INSERT INTO treasury.CashFlowForecast (ReportingPeriodId, ReportVersionId, BusinessUnitId, CashFlowCategoryId, BucketStartDate, BucketEndDate, Amount, CurrencyId, SourceType) VALUES (${perId}, ${verId}, 1, ${catInId}, '2026-10-01', '2026-10-31', 140, ${curId}, 'Manual')`);
            await req.query(`INSERT INTO treasury.CashFlowForecast (ReportingPeriodId, ReportVersionId, BusinessUnitId, CashFlowCategoryId, BucketStartDate, BucketEndDate, Amount, CurrencyId, SourceType) VALUES (${perId}, ${verId}, 1, ${catOutId}, '2026-10-01', '2026-10-31', -145, ${curId}, 'Manual')`);

            await transaction.commit();
            console.log('Cash flow data updated successfully');
        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error('Error updating cash flow data:', err);
    } finally {
        process.exit();
    }
}

updateCashflow();
