const sql = require('mssql');

// In production, Azure injects connection strings as CUSTOMCONNSTR_<Name>
// We read from the environment variable instead of hardcoding credentials for security.
const connectionString = process.env.CUSTOMCONNSTR_TreasuryDB || process.env.DB_CONNECTION_STRING;

if (!connectionString) {
  console.warn("WARNING: No connection string found. Please set DB_CONNECTION_STRING or CUSTOMCONNSTR_TreasuryDB in your environment variables/Azure App Settings.");
}

const poolPromise = new sql.ConnectionPool(connectionString)
  .connect()
  .then(pool => {
    console.log('Connected to Azure SQL Database');
    return pool;
  })
  .catch(err => console.log('Database Connection Failed! Bad Config: ', err));

module.exports = {
  sql, poolPromise
};
