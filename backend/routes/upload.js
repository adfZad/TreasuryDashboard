const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { poolPromise, sql } = require('../db');
const { protect } = require('../auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get upload history for the current user
router.get('/batches', protect, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT TOP 50 
                    b.UploadBatchId, b.ModuleCode, b.OriginalFileName,
                    b.BatchStatus as UploadStatus, b.UploadedByUserId, b.UploadedAtUtc as UploadedDate,
                    u.DisplayName as UploadedByName
                FROM ingest.UploadBatch b
                LEFT JOIN sec.AppUser u ON b.UploadedByUserId = u.AppUserId
                ORDER BY b.UploadedAtUtc DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching batches:', err);
        res.status(500).json({ message: 'Server error fetching upload history' });
    }
});

// Upload and parse Excel file
router.post('/excel', protect, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const { module } = req.body; // e.g. "BANK_BALANCE", "CASH_FLOW"
        
        const { parseSpecificModule } = require('../services/excelParser');
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        console.log("Workbook parsed");
        
        // Parse the specific module (or all if MASTER_REPORT)
        const parsedData = parseSpecificModule(workbook, module);
        console.log("Module extracted", Object.keys(parsedData).map(k => `${k}: ${parsedData[k]?.length || 0}`));
        if (parsedData.errors && parsedData.errors.length > 0) {
             console.log("Parsing errors:", parsedData.errors);
             return res.status(400).json({ message: 'Errors in workbook parsing', errors: parsedData.errors });
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Get active period
            const perIdRes = await pool.request().query("SELECT TOP 1 ReportingPeriodId FROM rpt.ReportingPeriod");
            const verIdRes = await pool.request().query("SELECT TOP 1 ReportVersionId FROM rpt.ReportVersion");
            const perId = perIdRes.recordset[0]?.ReportingPeriodId || 1;
            const verId = verIdRes.recordset[0]?.ReportVersionId || 1;

            const totalRowsCount = parsedData.funds.length + 
                                   (parsedData.cashflow.length * 2) + 
                                   parsedData.workingCapital.length + 
                                   parsedData.loansST.length + 
                                   parsedData.loansLT.length +
                                   parsedData.loanMovement.length;
            console.log("Total rows to insert:", totalRowsCount);

            if (totalRowsCount === 0) {
                 await transaction.rollback();
                 return res.status(400).json({ message: 'No recognizable data found in the uploaded workbook.' });
            }

            // Insert Batch Header
            console.log("Inserting batch header...");
            const batchReq = new sql.Request(transaction);
            const batchRes = await batchReq
                .input('perId', sql.Int, perId)
                .input('verId', sql.BigInt, verId)
                .input('module', sql.VarChar, module || 'MASTER_REPORT')
                .input('origFileName', sql.NVarChar, req.file.originalname)
                .input('fileHash', sql.VarChar, 'MASTERHASH123') 
                .input('fileSize', sql.BigInt, req.file.size)
                .input('status', sql.VarChar, 'DRAFT')
                .input('userId', sql.BigInt, req.user.userId)
                .input('rowsCount', sql.Int, totalRowsCount)
                .query(`
                    INSERT INTO ingest.UploadBatch (
                        ReportingPeriodId, ReportVersionId, ModuleCode, 
                        OriginalFileName, FileHash, FileSizeBytes, 
                        UploadedByUserId, UploadedAtUtc, BatchStatus, 
                        TotalRows, ValidRows, InvalidRows, ImportedRows
                    )
                    OUTPUT INSERTED.UploadBatchId
                    VALUES (
                        @perId, @verId, @module, 
                        @origFileName, @fileHash, @fileSize, 
                        @userId, GETUTCDATE(), @status, 
                        @rowsCount, 0, 0, 0
                    );
                `);
            
            const batchId = batchRes.recordset[0].UploadBatchId;

            // Helper to insert details
            let globalRowNo = 1;
            async function insertDetails(dataArray, targetType) {
                for (const item of dataArray) {
                    // Inject the sheet name and original row number into the json for auditing
                    item.batchRowIndex = globalRowNo;
                    const rawJson = JSON.stringify(item);
                    await new sql.Request(transaction)
                        .input('batchId', sql.BigInt, batchId)
                        .input('rowNum', sql.Int, globalRowNo)
                        .input('rawJson', sql.NVarChar, rawJson)
                        .input('status', sql.VarChar, 'PENDING')
                        .input('targetType', sql.VarChar, targetType)
                        .query(`
                            INSERT INTO ingest.UploadDetail (
                                UploadBatchId, SourceRowNo, RawPayloadJson, ImportStatus, TargetRecordType
                            )
                            VALUES (@batchId, @rowNum, @rawJson, @status, @targetType)
                        `);
                    globalRowNo++;
                }
            }

            // Insert all module arrays
            await insertDetails(parsedData.funds, 'FUNDS_POSITION');
            
            // Cash flow needs to be split into IN and OUT
            for (const cf of parsedData.cashflow) {
                 await insertDetails([{ ...cf, direction: 'IN', amount: cf.inflow }], 'CASH_FLOW_IN');
                 await insertDetails([{ ...cf, direction: 'OUT', amount: cf.outflow }], 'CASH_FLOW_OUT');
            }

            await insertDetails(parsedData.workingCapital, 'WORKING_CAPITAL');
            await insertDetails(parsedData.loansST, 'LOAN_ST');
            await insertDetails(parsedData.loansLT, 'LOAN_LT');
            await insertDetails(parsedData.loanMovement, 'LOAN_MOVEMENT');
            
            console.log("Committing transaction...");
            await transaction.commit();
            console.log("Transaction committed!");

            res.json({ 
                message: 'Master Report processed successfully', 
                batchId, 
                rowsProcessed: totalRowsCount, 
                errors: 0 
            });

            // Duplicates removed

        } catch (trxErr) {
            console.error('Transaction Error:', trxErr);
            await transaction.rollback();
            throw trxErr;
        }

    } catch (err) {
        console.error('Error processing excel upload:', err);
        res.status(500).json({ message: 'Error processing file: ' + err.message });
    }
});

module.exports = router;
