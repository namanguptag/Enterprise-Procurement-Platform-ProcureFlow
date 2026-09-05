const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool with production-quality configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'procureflow',
  waitForConnections: true,
  connectionLimit: 10, // Adjust based on workload / database capabilities
  queueLimit: 0,
  timezone: '+00:00', // Enforce UTC timezone consistency
  dateStrings: true,  // Return dates as strings to avoid automatic JS timezone offset shifts
});

// Perform a test connection check at startup
pool.getConnection()
  .then((connection) => {
    console.log(`Database connected successfully to ${process.env.DB_NAME} at ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    connection.release();
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
  });

module.exports = pool;
