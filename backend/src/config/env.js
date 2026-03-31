const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT) || 3306,
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "",
  dbName: process.env.DB_NAME || "student_db",
  dbSocketPath: process.env.DB_SOCKET_PATH || ""
};

module.exports = env;
