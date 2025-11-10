const { Pool } = require('pg');
require('dotenv').config();

// Get the connection string from environment variables
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5, // Increased for better concurrency in serverless
  min: 0, // Allow pool to empty entirely
  idleTimeoutMillis: 30000, // Reduced to 30 seconds for serverless
  connectionTimeoutMillis: 15000, // Increased timeout for Neon
  acquireTimeoutMillis: 60000, // Timeout for acquiring connection from pool
});

// Query helper function optimized for serverless
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const start = Date.now();
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } finally {
    client.release(); // Always release the client back to the pool
  }
};

module.exports = {
  query,
  pool
};
