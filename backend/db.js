const { Pool } = require('pg');

// PostgreSQL connection pool setup
const pool = new Pool({
    user: 'postgres',          // Replace with your PostgreSQL username
    host: 'localhost',              // Database host (use localhost if it's on your machine)
    database: 'agriwork',      // Replace with your PostgreSQL database name
    password: 'adhi2410',      // Replace with your PostgreSQL password
    port: 5432,                     // Default PostgreSQL port
});

module.exports = pool;
