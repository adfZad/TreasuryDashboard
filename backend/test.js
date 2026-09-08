const sql = require('mssql/msnodesqlv8');

const run = async () => {
    try {
        const pool = await new sql.ConnectionPool({
            connectionString: 'Driver={SQL Server};Server=.;Database=TreasuryDB;Trusted_Connection=yes;'
        }).connect();
        console.log("Connected using connectionString option!");
        pool.close();
    } catch(e) {
        console.error("String option failed: ", e.message);
    }

    try {
        const pool = await new sql.ConnectionPool({
            server: 'localhost',
            database: 'TreasuryDB',
            driver: 'msnodesqlv8',
            options: {
                trustedConnection: true,
                driver: 'SQL Server'
            }
        }).connect();
        console.log("Connected using options.driver!");
        pool.close();
    } catch(e) {
        console.error("options.driver failed: ", e.message);
    }
}

run();
