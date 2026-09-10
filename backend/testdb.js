const sql = require('msnodesqlv8');
const connStr = "server=.;Database=TreasuryDB;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";
sql.query(connStr, "SELECT 1 as result", (err, rows) => {
    if (err) {
        console.error("Test 1 Failed:", err.message);
    } else {
        console.log("Test 1 Success:", rows);
    }
});

const connStr2 = "server=.;Database=TreasuryDB;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}";
sql.query(connStr2, "SELECT 1 as result", (err, rows) => {
    if (err) {
        console.error("Test 2 Failed:", err.message);
    } else {
        console.log("Test 2 Success:", rows);
    }
});
