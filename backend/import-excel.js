const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { poolPromise, sql } = require('./db');
const { parseSpecificModule } = require('./services/excelParser');
const { processBatchData } = require('./services/dataProcessor');

async function importExcel() {
    try {
        const filePath = path.join(__dirname, '../00. Treasury report as on 15Aug2026.xlsx');
        const buffer = fs.readFileSync(filePath);
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        console.log("Workbook parsed");
        
        const parsedData = parseSpecificModule(workbook, 'MASTER_REPORT');
        console.log("Module extracted", Object.keys(parsedData).map(k => `${k}: ${parsedData[k]?.length || 0}`));
        
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const perId = 1;
            const verId = 1;
            const totalRowsCount = parsedData.funds.length + 
                                   (parsedData.cashflow.length * 2) + 
                                   parsedData.workingCapital.length + 
                                   parsedData.loansST.length + 
                                   parsedData.loansLT.length +
                                   parsedData.loanMovement.length;

            const batchReq = new sql.Request(transaction);
            const batchRes = await batchReq
                .input('perId', sql.Int, perId)
                .input('verId', sql.BigInt, verId)
                .input('module', sql.VarChar, 'MASTER_REPORT')
                .input('origFileName', sql.NVarChar, '00. Treasury report as on 15Aug2026.xlsx')
                .input('fileHash', sql.VarChar, 'MASTERHASH123') 
                .input('fileSize', sql.BigInt, buffer.length)
                .input('status', sql.VarChar, 'DRAFT')
                .input('userId', sql.BigInt, 3) // using 3 since user ID 3 was used previously
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
            console.log("Created Batch ID:", batchId);

            let globalRowNo = 1;
            async function insertDetails(dataArray, targetType) {
                for (const item of dataArray) {
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

            await insertDetails(parsedData.funds, 'FUNDS_POSITION');
            
            for (const cf of parsedData.cashflow) {
                 await insertDetails([{ ...cf, direction: 'IN', amount: cf.inflow }], 'CASH_FLOW_IN');
                 await insertDetails([{ ...cf, direction: 'OUT', amount: cf.outflow }], 'CASH_FLOW_OUT');
            }

            await insertDetails(parsedData.workingCapital, 'WORKING_CAPITAL');
            await insertDetails(parsedData.loansST, 'LOAN_ST');
            await insertDetails(parsedData.loansLT, 'LOAN_LT');
            await insertDetails(parsedData.loanMovement, 'LOAN_MOVEMENT');
            
            await transaction.commit();
            console.log("Inserted raw data! Now processing into live tables...");
            
            // Now process the batch
            await processBatchData(batchId);
            console.log("Done!");
            process.exit(0);

        } catch (trxErr) {
            console.error("Inner error:", trxErr);
            throw trxErr;
        }
    } catch (err) {
        console.error('Error processing excel upload:', err);
        process.exit(1);
    }
}

importExcel();
