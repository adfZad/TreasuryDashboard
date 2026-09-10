require('dotenv').config({ path: '../.env' });

// In production, Azure injects connection strings as CUSTOMCONNSTR_<Name> or SQLAZURECONNSTR_<Name>
// We read from the environment variable instead of hardcoding credentials for security.
const connectionString = process.env.SQLAZURECONNSTR_TreasuryDB || process.env.CUSTOMCONNSTR_TreasuryDB || process.env.DB_CONNECTION_STRING;

let sql = require('mssql');
let config = connectionString;

if (connectionString && (connectionString.includes('Trusted_Connection=yes') || connectionString.includes('Trusted_Connection=True'))) {
    sql = require('mssql/msnodesqlv8');
    config = {
        connectionString: connectionString
    };
}

let poolPromise;

if (config) {
  poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
      console.log('Connected to SQL Database');
      return pool;
    })
    .catch(err => {
      console.log('Database Connection Failed! Bad Config: ', err);
      // Return null instead of throwing to prevent a fatal global UnhandledPromiseRejection crash
      return null; 
    });
} else {
  console.warn("WARNING: No connection string found. Please set DB_CONNECTION_STRING or CUSTOMCONNSTR_TreasuryDB in your environment variables/Azure App Settings.");
  poolPromise = Promise.resolve(null);
}

module.exports = {
  sql, poolPromise
};
