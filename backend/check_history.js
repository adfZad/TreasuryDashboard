const { poolPromise } = require('./db');

async function run() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT UploadBatchId, BatchStatus FROM ingest.UploadBatch");
        console.log(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
