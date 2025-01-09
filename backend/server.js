const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3009;

// PostgreSQL connection pool setup
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'agriwork',
    password: 'adhi2410',
    port: 5432,
});

app.use(cors());
app.use(bodyParser.json());
// POST route for login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Query database for the user
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

// POST route to create a new worker
app.post('/workers', async (req, res) => {
    const { name, gender, phoneno, address, skillset, dob, datehired } = req.body;

    try {
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
        const result = await pool.query(
            'SELECT id, title FROM training_sessions'
        );
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

app.post('/assign-experienced-workers', async (req, res) => {
    try {
        // Step 1: Query workers with more than 5 years of experience
        const experiencedWorkers = await pool.query(`
            SELECT id, skillset 
            FROM workers 
            WHERE experience_years > 5
        `);

        // Step 2: Query all job positions with required skills
        const jobPositions = await pool.query(`
            SELECT id, required_skills
            FROM job_positions
        `);

        // Step 3: Iterate through each experienced worker
        for (const worker of experiencedWorkers.rows) {
            const workerId = worker.id;  // Using 'id' for worker
            const workerSkills = worker.skillset.split(',');  // Convert worker skillset to an array

            // Step 4: Iterate through each job position
            for (const job of jobPositions.rows) {
                const jobSkills = job.required_skills.split(',');  // Convert job required skills to an array

                // Step 5: Check if there is an intersection between worker skills and job required skills
                const matchingSkills = workerSkills.filter(skill => jobSkills.includes(skill));

                // Step 6: If there is a match, insert the worker-job position assignment
                if (matchingSkills.length > 0) {
                    console.log(`Worker ${workerId} has matching skills for Job Position ${job.id}`);

                    // Step 7: Check if the worker is already assigned to this job position
                    const checkAssignment = await pool.query(`
                        SELECT * FROM workers_job_positions 
                        WHERE worker_id = $1 AND job_position_id = $2
                    `, [workerId, job.id]);

                    // If not already assigned, insert into workers_job_positions
                    if (checkAssignment.rows.length === 0) {
                        console.log(`Assigning Worker ${workerId} to Job Position ${job.id}`);

                        await pool.query(`
                            INSERT INTO workers_job_positions (worker_id, job_position_id)
                            VALUES ($1, $2)
                            ON CONFLICT DO NOTHING
                        `, [workerId, job.id]);

                        console.log(`Assigned Worker ${workerId} to Job Position ${job.id}`);
                    } else {
                        console.log(`Worker ${workerId} is already assigned to Job Position ${job.id}`);
                    }
                }
            }
        }

        // Step 8: Send success response
        res.status(200).json({ message: 'Experienced workers successfully assigned to job positions' });
    } catch (error) {
        // Step 9: Handle errors
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to assign experienced workers to job positions', message: error.message });
    }
});

app.get('/workers-job-positions', async (req, res) => {
    try {
      // Query the workers and their assigned job positions
      const result = await pool.query(`
        SELECT w.id AS worker_id, w.name AS worker_name, jp.title AS job_position_title
        FROM workers w
        JOIN workers_job_positions wjp ON w.id = wjp.worker_id
        JOIN job_positions jp ON wjp.job_position_id = jp.id
      `);
  
      // Send the result as a response
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
