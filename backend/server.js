const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3007;

// PostgreSQL connection pool setup
const pool = new Pool({
    user: 'postgres',          // Replace with your PostgreSQL username
    host: 'localhost',         // Database host (use localhost if it's on your machine)
    database: 'agriwork',      // Replace with your PostgreSQL database name
    password: 'adhi2410',      // Replace with your PostgreSQL password
    port: 5432,                // Default PostgreSQL port
});

app.use(cors());
app.use(bodyParser.json());

// POST route to create a new worker
app.post('/workers', async (req, res) => {
    const { name, gender, phoneno, address, skillset, dob, datehired } = req.body;

    try {
        // Check if the phone number already exists
        const checkPhone = await pool.query('SELECT * FROM workers WHERE phoneno = $1', [phoneno]);
        if (checkPhone.rows.length > 0) {
            return res.status(400).json({ error: 'Phone number already exists.' });
        }

        const result = await pool.query(
            `INSERT INTO workers (name, gender, phoneno, address, skillset, dob, datehired)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, gender, phoneno, address, skillset, dob, datehired]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to create worker', message: error.message });
    }
});

// POST route to assign a job to a worker
app.post('/workers/:id/assign-job', async (req, res) => {
    const workerId = req.params.id;
    const { job_position_id } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO workers_job_positions (worker_id, job_position_id)
             VALUES ($1, $2) RETURNING *`,
            [workerId, job_position_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to assign job', message: error.message });
    }
});

// POST route to assign a training session to a worker
app.post('/workers/:id/assign-training', async (req, res) => {
    const workerId = req.params.id;
    const { training_session_id } = req.body;

    try {
        // Check if the worker is already assigned to the training session
        const checkAssignment = await pool.query(
            'SELECT * FROM workers_training_sessions WHERE worker_id = $1 AND training_session_id = $2',
            [workerId, training_session_id]
        );

        // If assignment exists, return a specific message to frontend
        if (checkAssignment.rows.length > 0) {
            return res.status(400).json({ error: 'Worker is already assigned to this training session.' });
        }

        // Insert the assignment if no previous assignment exists
        const result = await pool.query(
            'INSERT INTO workers_training_sessions (worker_id, training_session_id) VALUES ($1, $2) RETURNING *',
            [workerId, training_session_id]
        );

        // Respond with the inserted data
        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Error:', error.message);
        // Handle any database error such as constraint violations
        if (error.code === '23505') {  // PostgreSQL unique violation error code
            return res.status(400).json({ error: 'Duplicate assignment detected.' });
        }
        res.status(500).json({ error: 'Failed to assign training', message: error.message });
    }
});

// POST route to assign a training session to a worker
app.post('/workers/:id/assign-training', async (req, res) => {
    const workerId = req.params.id;
    const { training_session_id } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO workers_training_sessions (worker_id, training_session_id)
             VALUES ($1, $2) RETURNING *`,
            [workerId, training_session_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to assign training', message: error.message });
    }
});

// GET route to fetch all workers
app.get('/workers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM workers');
        res.json(result.rows);  // Send worker data as JSON
    } catch (error) {
        console.error('Error fetching workers:', error);
        res.status(500).json({ error: 'Failed to fetch workers' });
    }
});

// GET route to fetch all training sessions
app.get('/training-sessions', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM training_sessions');
        res.json(result.rows);  // Send training session data as JSON
    } catch (error) {
        console.error('Error fetching training sessions:', error);
        res.status(500).json({ error: 'Failed to fetch training sessions' });
    }
});

// POST route to check if phone number exists
app.get('/check-phone/:phoneno', async (req, res) => {
    const { phoneno } = req.params;

    try {
        const result = await pool.query('SELECT * FROM workers WHERE phoneno = $1', [phoneno]);
        if (result.rows.length > 0) {
            return res.json({ exists: true });
        } else {
            return res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to check phone number', message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
