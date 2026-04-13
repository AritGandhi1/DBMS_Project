import mysql from "mysql2/promise";
const pool = mysql.createPool("mysql://ERP_sodearhang:182279f1b5fae987bcd8adf9b4a0a63f2c5a14f0@02in00.h.filess.io:61002/ERP_sodearhang");
const conn = await pool.getConnection();
console.log("Connected!");
conn.release();