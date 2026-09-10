const sql = require('mssql/msnodesqlv8');

const config = {
    connectionString: "Driver={ODBC Driver 17 for SQL Server};Server=.;Database=TreasuryDB;Trusted_Connection=yes;"
};

const pool = new sql.ConnectionPool(config);
pool.connect().then(() => {
    console.log("Config connectionString success!");
    pool.close();
}).catch(err => {
    console.error("Config connectionString fail:", err.message);
});
