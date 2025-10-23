const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port:     Number(process.env.DB_PORT) || 3306,   // ← EKLENDİ
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4_general_ci'
});

module.exports = pool;
