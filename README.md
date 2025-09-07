# AgriWorker Management System

## Overview
The **AgriWorker Management System** is a web-based application designed to efficiently manage agricultural workers, their skills, job positions, and training sessions. It streamlines workforce allocation by automatically assigning experienced workers to suitable job positions based on their skill sets and experience. This system is particularly useful for agricultural organizations to optimize labor management, track training, and improve productivity.

---

## Project Motivation
Agricultural labor management is often manual and inefficient, leading to mismatches between workers’ skills and job requirements.  
This project aims to:
- Automate worker-job matching based on skills and experience.  
- Simplify tracking of workers and training sessions.  
- Provide a structured and easy-to-manage database for agricultural workforce management.

---

## Features

- **Worker Management**
  - Add, view, update, and delete worker records.
  - Workers include attributes: name, gender, phone number, address, skillset, date of birth, and date hired.
  
- **Automatic Job Assignment**
  - Workers with >5 years experience are automatically matched to job positions based on their skills.
  - Prevents duplicate assignments to the same job position.

- **Job Positions**
  - Maintain job positions with required skills.
  - Automatically assign suitable workers to positions.

- **Training Sessions**
  - Assign workers to training sessions.
  - View training sessions completed by each worker.

- **APIs**
  - RESTful APIs for login, worker CRUD, job assignments, and training management.

---

## System Architecture

[Frontend (Optional React/HTML)]
|
v
Express.js Server
|
v
PostgreSQL Database

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **Other Libraries**: CORS, Body-Parser

---

## Database Schema

### Workers
| Column       | Type       | Description                |
| ------------ | ---------- | -------------------------- |
| id           | SERIAL PK  | Unique worker ID           |
| name         | VARCHAR    | Worker name                |
| gender       | VARCHAR    | Worker gender              |
| phoneno      | VARCHAR    | Phone number (unique)      |
| address      | TEXT       | Worker address             |
| skillset     | TEXT       | Comma-separated skills     |
| dob          | DATE       | Date of birth              |
| datehired    | DATE       | Date worker joined         |

### Job Positions
| Column         | Type       | Description                  |
| -------------- | ---------- | ---------------------------- |
| id             | SERIAL PK  | Unique job position ID       |
| title          | VARCHAR    | Job position title           |
| required_skills| TEXT       | Comma-separated required skills |

### Workers_Job_Positions
| Column          | Type      | Description                  |
| --------------- | --------- | ---------------------------- |
| worker_id       | INT FK    | References Workers.id        |
| job_position_id | INT FK    | References JobPositions.id   |

### Training Sessions
| Column | Type       | Description                  |
| ------ | ---------- | ---------------------------- |
| id     | SERIAL PK  | Unique training session ID   |
| title  | VARCHAR    | Training session title       |

### Workers_Training_Sessions
| Column            | Type    | Description                  |
| ----------------- | ------- | ---------------------------- |
| worker_id         | INT FK  | References Workers.id        |
| training_session_id | INT FK | References TrainingSessions.id |

---

## How Automatic Assignment Works

1. Calculate worker experience from `datehired`.
2. Identify workers with experience > 5 years.
3. Compare worker skillset with required skills for all job positions.
4. Assign worker automatically to all matching job positions.
5. Prevent duplicate assignments.

---

## Sample Data

### Workers
| Name  | Skillset              | Date Hired  |
| ----- | -------------------- | ----------- |
| Arun  | Irrigation           | 2010-01-15  |
| Raghu | Ploughing, Harvesting | 2005-03-10 |

### Job Positions
| Title                  | Required Skills       |
| ---------------------- | ------------------- |
| Irrigation Expert       | Irrigation          |
| Harvesting Worker       | Harvesting          |
| Ploughing Specialist    | Ploughing           |

### Expected Automatic Assignment
| Worker Name | Job Position          |
| ----------- | ------------------- |
| Arun        | Irrigation Expert    |
| Raghu       | Ploughing Specialist, Harvesting Worker |

---

## Installation

1. Clone the repository:

git clone <repo-url>
Navigate to project folder:

cd agriworker
Install dependencies:

npm install
Setup PostgreSQL and create required tables.

Run the server:

node server.js
API base URL: http://localhost:3009

How to Test
Add a worker via POST /workers.

Check automatic assignment via GET /workers-job-positions.

Assign training sessions via POST /workers/:id/assign-training.

Fetch all assigned training via GET /workers/:id/training-sessions.

Future Improvements
Add a React/Angular frontend dashboard for easy management.

Real-time notifications for new assignments or trainings.

Analytics and reporting for workforce efficiency.

