const mysql = require("mysql2/promise");

const env = require("./env");

const baseConfig = {
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const connectionConfig = env.dbSocketPath
  ? { ...baseConfig, socketPath: env.dbSocketPath }
  : { ...baseConfig, host: env.dbHost, port: env.dbPort };

const pool = mysql.createPool(connectionConfig);

module.exports = pool;
