const { poolPromise, sql } = require('./db');

async function getColumns() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'ingest' AND TABLE_NAME = 'ValidationError'
    `);
    console.log(result.recordset);
    process.exit(0);
}

getColumns();
