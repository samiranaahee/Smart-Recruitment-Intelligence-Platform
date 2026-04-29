# AI-Powered Recruitment Intelligence Platform

> CSE471 Project — Startup MVP designed for SMEs with enterprise-level hiring analytics.

---

## Team Members & Contributions

| Member | Responsibility |
|--------|---------------|
| Member 1 | Company Registration, JWT Auth, KPI Dashboard, Cost-per-Hire Calculator |
| Member 2 | Job Postings, Candidate Pipeline, Interview Scheduling & Evaluation |
| Member 3 | Resume Upload & Parsing, AI Skill Scoring, Skill Gap Analysis, AI Summaries |
| Member 4 | Candidate Comparison, Recruiter Performance, Hiring Prediction, Email Notifications |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| AI | Groq API (LLaMA) |
| Auth | JWT (JSON Web Tokens) |
| Email | Nodemailer (Gmail SMTP) |
| Calendar | Google Calendar API |

---

## Prerequisites

Make sure the following are installed on your machine:

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/) (local or Atlas cloud)
- A Gmail account (for email notifications)
- A Google Cloud project with Calendar API enabled (for interview scheduling)

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/ai-recruiter.git
cd ai-recruiter
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Development (bypasses login for testing)
DEV_COMPANY_ID=000000000000000000000001

# AI (Groq)
GROQ_API_KEY=your_groq_api_key

# Email (Gmail)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Google Calendar
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
GOOGLE_REFRESH_TOKEN=        ← filled automatically in step 7
```

> **Gmail App Password:** Go to your Google Account → Security → 2-Step Verification → App Passwords → generate one for "Mail".

### 5. Run the Backend

```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB connected successfully
```

### 6. Run the Frontend

Open a new terminal:

```bash
cd frontend
npm start
```

The app will open at `http://localhost:3000`.

### 7. Connect Google Calendar (One-Time Setup)

With the backend running, open this URL in your browser:

```
http://localhost:5000/api/auth/google
```

Sign in with the Google account whose calendar will be used for interviews. On success you will see a **"Google Calendar Connected!"** screen and the `GOOGLE_REFRESH_TOKEN` will be saved to your `.env` automatically. No restart needed.

> **Google Cloud Setup:** Make sure your OAuth client has `http://localhost:5000/api/auth/google/callback` added as an Authorized Redirect URI, and that the Google Calendar API is enabled in your project.

---

## Running the Full Application

| Service | Command | URL |
|---------|---------|-----|
| Backend | `npm run dev` (inside `/backend`) | http://localhost:5000 |
| Frontend | `npm start` (inside `/frontend`) | http://localhost:3000 |

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/dashboard/kpis` | Recruitment KPI data |
| GET/POST | `/api/jobs` | List / create job postings |
| PUT/DELETE | `/api/jobs/:id` | Update / delete a job |
| GET | `/api/applications` | All candidate applications |
| PATCH | `/api/applications/:id/stage` | Move candidate in pipeline |
| POST | `/api/candidates/upload` | Upload resume + AI analysis |
| GET | `/api/candidates` | All candidates |
| GET | `/api/interviews` | All scheduled interviews |
| POST | `/api/interviews` | Schedule new interview |
| PATCH | `/api/interviews/:id/evaluate` | Submit interview evaluation |
| GET | `/api/enterprise/recruiters` | Recruiter performance data |
| POST | `/api/enterprise/notify` | Send email notification |
| GET | `/api/auth/google` | Connect Google Calendar |

---

## Project Structure

```
ai-recruiter/
├── backend/
│   ├── server.js
│   ├── .env
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── Candidate.js
│   │   ├── Company.js
│   │   ├── Job.js
│   │   ├── Application.js
│   │   ├── Interview.js
│   │   └── Recruiter.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   │   └── authMiddleware.js
│   └── services/
│       ├── aiService.js
│       ├── emailService.js
│       └── googleCalendar.js
└── frontend/
    └── src/
        └── App.js
```

