const { poolPromise } = require('./db');

async function createTable() {
    try {
        const pool = await poolPromise;
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CashFlowComments' and xtype='U')
            BEGIN
                CREATE TABLE CashFlowComments (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    CommentText NVARCHAR(MAX),
                    UpdatedAt DATETIME DEFAULT GETDATE()
                )
                PRINT 'Table CashFlowComments created.'
            END
            ELSE
            BEGIN
                PRINT 'Table CashFlowComments already exists.'
            END
        `);
        console.log("Success");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

createTable();
