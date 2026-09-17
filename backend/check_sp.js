const { poolPromise } = require('./db.js');
async function run() {
    const pool = await poolPromise;
    // Check if the SP has anything that limits to QAR or drops foreign currency
    const res = await pool.request().query("SELECT OBJECT_DEFINITION(OBJECT_ID('[ingest].[ProcessUploadBatch]')) as sp");
    console.log("=== SP DEFINITION ===");
    console.log(res.recordset[0].sp);
    
    // Check if there are any USD accounts in ingest.UploadDetail for Batch 12
    const res2 = await pool.request().query("SELECT TOP 5 RawPayloadJson, ImportStatus, ErrorMessage FROM ingest.UploadDetail WHERE UploadBatchId = 12 AND TargetRecordType = 'FUNDS_POSITION' AND RawPayloadJson LIKE '%USD%'");
    console.log("=== USD UPLOAD DETAILS (BATCH 12) ===");
    console.log(res2.recordset);
    
    process.exit(0);
}
run();
