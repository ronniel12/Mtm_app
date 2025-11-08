const { Pool } = require('pg');
require('dotenv').config();

// Neon connection string
const connectionString = 'postgresql://neondb_owner:npg_HGRviFJ96Vkq@ep-frosty-firefly-ahljyrnl-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5, // Increased from 1 to 5 for better concurrency
  min: 1, // Minimum connections to maintain
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Reduced from 30s for faster failures
  maxUses: 7500, // Reset connections periodically to avoid stale connections
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

module.exports = {
  pool,
  query
};
