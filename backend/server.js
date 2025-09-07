require('dotenv').config(); // Add at the top

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3009;

// PostgreSQL connection pool setup
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.use(cors());
app.use(bodyParser.json());

// POST route for login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            res.status(200).json({ message: 'Login successful' });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// POST route to create a new worker (with automatic assignment)
app.post('/workers', async (req, res) => {
    const { name, gender, phoneno, address, skillset, dob, datehired } = req.body;

    try {
        // Check for duplicate phone number
        const checkPhone = await pool.query('SELECT * FROM workers WHERE phoneno = $1', [phoneno]);
        if (checkPhone.rows.length > 0) {
            return res.status(400).json({ error: 'Phone number already exists.' });
        }

        // Insert the new worker
        const result = await pool.query(
            `INSERT INTO workers (name, gender, phoneno, address, skillset, dob, datehired)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, gender, phoneno, address, skillset, dob, datehired]
        );

        const newWorker = result.rows[0];

        // Calculate experience from datehired
        const experienceYearsResult = await pool.query(
            `SELECT EXTRACT(YEAR FROM AGE(CURRENT_DATE, $1)) AS experience_years`,
            [newWorker.datehired]
        );
        const experienceYears = experienceYearsResult.rows[0].experience_years;

        // Automatically assign jobs if experience > 5 years
        if (experienceYears > 5) {
            const jobPositions = await pool.query('SELECT id, required_skills FROM job_positions');
            const workerSkills = newWorker.skillset.split(',');

            for (const job of jobPositions.rows) {
                const jobSkills = job.required_skills.split(',');
                const matchingSkills = workerSkills.filter(skill => jobSkills.includes(skill));

                if (matchingSkills.length > 0) {
                    await pool.query(
                        `INSERT INTO workers_job_positions (worker_id, job_position_id)
                         VALUES ($1, $2)
                         ON CONFLICT DO NOTHING`,
                        [newWorker.id, job.id]
                    );
                }
            }
        }

        res.status(201).json(newWorker);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to create worker', message: error.message });
    }
});

// GET route to fetch all workers
app.get('/workers', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, gender, phoneno, address, skillset, dob, datehired FROM workers'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workers:', error.message);
        res.status(500).json({ error: 'Failed to fetch workers' });
    }
});

// DELETE route to delete a worker by phone number
app.delete('/workers/:phoneno', async (req, res) => {
    const { phoneno } = req.params;

    try {
        const result = await pool.query('DELETE FROM workers WHERE phoneno = $1 RETURNING *', [phoneno]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        res.json({ message: 'Worker deleted successfully', worker: result.rows[0] });
    } catch (error) {
        console.error('Error deleting worker:', error.message);
        res.status(500).json({ error: 'Failed to delete worker', message: error.message });
    }
});

// GET route to fetch all training sessions
app.get('/training-sessions', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, title FROM training_sessions');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching training sessions:', error.message);
        res.status(500).json({ error: 'Failed to fetch training sessions' });
    }
});

// POST route to assign a worker to a training session
app.post('/workers/:id/assign-training', async (req, res) => {
    const workerId = req.params.id;
    const { training_session_id } = req.body;

    try {
        const checkAssignment = await pool.query(
            'SELECT * FROM workers_training_sessions WHERE worker_id = $1 AND training_session_id = $2',
            [workerId, training_session_id]
        );

        if (checkAssignment.rows.length > 0) {
            return res.status(400).json({ error: 'Worker is already assigned to this training session.' });
        }

        const result = await pool.query(
            'INSERT INTO workers_training_sessions (worker_id, training_session_id) VALUES ($1, $2) RETURNING *',
            [workerId, training_session_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error assigning training:', error.message);
        res.status(500).json({ error: 'Failed to assign training', message: error.message });
    }
});

// GET route to fetch all training sessions assigned to a worker
app.get('/workers/:id/training-sessions', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT ts.id, ts.title
             FROM training_sessions ts
             JOIN workers_training_sessions wts ON ts.id = wts.training_session_id
             WHERE wts.worker_id = $1`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching training sessions for worker:', error.message);
        res.status(500).json({ error: 'Failed to fetch training sessions for worker' });
    }
});

// GET route to fetch all workers and their assigned job positions
app.get('/workers-job-positions', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT w.id AS worker_id, w.name AS worker_name, jp.title AS job_position_title
            FROM workers w
            JOIN workers_job_positions wjp ON w.id = wjp.worker_id
            JOIN job_positions jp ON wjp.job_position_id = jp.id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workers and job positions:', error.message);
        res.status(500).json({ error: 'Failed to fetch workers and job positions' });
    }
});

// Test route
app.get("/", (req, res) => {
    return res.send("Server is working");
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
