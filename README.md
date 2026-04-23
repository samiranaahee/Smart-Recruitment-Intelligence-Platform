# TalentFlow - Recruitment Intelligence Platform
## Member 2 Integrated with MongoDB

## 📋 Quick Overview

TalentFlow is a comprehensive recruitment and hiring intelligence platform that streamlines the candidate pipeline from application through hire. 

###  Key Features

- ✅ **Candidate Pipeline Management** - Track candidates through applied → shortlisted → interview → offered → hired
- ✅ **Interview Scheduling** - Schedule interviews with Google Calendar, Google Meet, or Zoom integration
- ✅ **Evaluation Scoring System** - Weighted criteria-based interview evaluation
- ✅ **Job Postings** - Create and manage job postings with skill tagging
- ✅ **Google OAuth Integration** - Secure authentication via Google
- ✅ **Real-time Analytics** - Dashboard with recruitment metrics
- ✅ **Unified API** - RESTful API for all operations
- ✅ **Responsive UI** - React Vite frontend with professional candidate management interface

---


### Option 1: Startup

```bash
# Install dependencies
npm install

# Start backend server
npm start

# In another terminal, start frontend (optional)
cd frontend
npm install
npm run dev
```

The server will be available at **http://localhost:3001**

---

## 🗂️ Project Structure

```
Member-2/
├── backend/
│   ├── app.js                    # Main Express application
│   ├── backend-routes.js         # API endpoints (candidates, interviews, jobs)
│   ├── models.js                 # ✨ MERGED: All 6 Mongoose schemas
│   ├── externalAPIsRoutes.js     # Google Calendar/Meet/Zoom APIs
│   ├── .env                      # ✅ Configured for shared MongoDB
│   ├── config/
│   │   └── googleOAuthConfig.js  # Google OAuth configuration
│   ├── services/
│   │   ├── googleCalendarService.js
│   │   ├── googleMeetService.js
│   │   ├── zoomService.js
│   │   └── unifiedAPIManager.js
│   ├── public/
│   │   └── index.html            # Frontend entry point
│   └── seed.js                   # Database seeding script
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx              # React entry point
│   │   ├── TalentFlow.jsx        # Main UI component
│   │   └── index.css             # Styling
│   ├── vite.config.ts            # Vite configuration
│   └── tsconfig.json             # TypeScript config
│
└── 📄 Documentation Files (NEW)
    ├── MERGE_INTEGRATION_GUIDE.md    # Complete integration documentation
    ├── API_TESTING_GUIDE.md          # API testing and troubleshooting
    ├── START-TALENTFLOW.bat          # Windows batch startup script
    ├── START-TALENTFLOW.ps1          # PowerShell startup script
    └── README.md                     # This file
```



**Member 2 Collections** (TalentFlow):
- `candidates` - Candidate applications with pipeline status
- `interviews` - Interview scheduling with evaluation scores
- `job_postings` - Job postings with skill requirements
- `google_oauth_tokens` - Google OAuth access tokens

### Data Models Merged ✅

Enhanced `models.js` now includes:
1. **Candidate** - Job applicants with pipeline tracking
2. **Interview** - Interview scheduling with evaluation criteria
3. **JobPosting** - Job listings with skill tagging
4. **GoogleOAuthToken** - OAuth token management
5. **Company** - *Added from Member 1* - HR company profiles
6. **Application** - *Added from Member 1* - Application tracking

No conflicts, all data properly scoped by `company_id`.

---

## 📡 API Endpoints

### Authentication
```
POST /api/login                    # Get JWT token
```

### Candidate Management
```
GET    /api/candidates             # List all candidates
POST   /api/candidates             # Create new candidate
PUT    /api/candidates/:id         # Update candidate
DELETE /api/candidates/:id         # Delete candidate
```

### Interview Scheduling
```
GET    /api/interviews             # List interviews
POST   /api/interviews             # Schedule new interview
PUT    /api/interviews/:id         # Update interview
DELETE /api/interviews/:id         # Cancel interview
```

### Job Postings
```
GET    /api/jobs                   # List job postings
POST   /api/jobs                   # Create job posting
PUT    /api/jobs/:id               # Update job posting
```

### External APIs
```
GET    /api/external/google/callback    # Google OAuth callback
POST   /api/external/schedule-interview # Schedule with Google Calendar
```

### Health & Status
```
GET    /health                     # Health check with DB status
GET    /                           # Frontend root
```

---

## 🧪 Testing

### Quick Test
```bash
# Get health status
curl http://localhost:3001/health

# Login and get JWT token
curl -X POST http://localhost:3001/api/login

# Test endpoint with token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/candidates
```

### Full Testing Guide
See [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) for:
- Postman collection setup
- cURL command examples
- PowerShell testing scripts
- Database verification queries
- Troubleshooting guide

---

## ⚙️ Configuration

### Environment Variables (.env)


**Google APIs** (Optional):
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URL=http://localhost:3001/api/external/google/callback
```

**Zoom** (Optional):
```env
ZOOM_CLIENT_ID=your_zoom_id
ZOOM_CLIENT_SECRET=your_zoom_secret
ZOOM_ACCOUNT_ID=your_account_id
```

### Server Port
```env
PORT=3001                          # Default
NODE_ENV=development               # or production
```

---

## 🛠️ Development

### Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Atlas) + Mongoose
- **Frontend**: React 18 + TypeScript + Vite
- **Authentication**: JWT + Google OAuth
- **APIs**: Google Calendar, Google Meet, Zoom
- **Security**: Helmet, CORS, bcryptjs

### Dependencies
```json
{
  "express": "^5.2.1",
  "mongoose": "^8.0.0",
  "jsonwebtoken": "^9.0.3",
  "googleapis": "^171.4.0",
  "cors": "^2.8.6",
  "helmet": "^8.1.0",
  "dotenv": "^17.4.2"
}
```

### Development Commands
```bash
npm install        # Install dependencies
npm start         # Start backend server
npm run seed      # Seed database with test data
npm run build     # Build frontend assets
npm run dev       # Development server
```

---

## 📊 Database Schema

### Candidate Model
```javascript
{
  company_id: ObjectId,
  job_id: ObjectId,
  name: String,
  email: String,
  phone: String,
  status: String, // applied|shortlisted|interview|offered|hired|rejected
  match_score: Number (0-100),
  resume_url: String,
  skills_matched: [String],
  skills_missing: [String],
  created_at: Date,
  updated_at: Date
}
```

### Interview Model
```javascript
{
  candidate_id: ObjectId,
  scheduled_date: Date,
  duration: Number,
  type: String, // Technical|HR Round|Final Round|Culture Fit
  medium: String, // Google Meet|Zoom|On-site|Phone
  interviewers: [String],
  status: String, // scheduled|confirmed|completed|canceled
  score: Number (0-100),
  evaluation_scores: [Object],
  overall_score: Number,
  google_calendar_event_id: String,
  google_meet_link: String,
  zoom_join_url: String,
  created_at: Date,
  updated_at: Date
}
```

See [MERGE_INTEGRATION_GUIDE.md](./MERGE_INTEGRATION_GUIDE.md) for complete schema documentation.

---

## 🔐 Security Features

- ✅ **JWT Authentication** - Secure token-based API access
- ✅ **Helmet.js** - Security headers protection
- ✅ **CORS Enabled** - Safe cross-origin requests
- ✅ **Password Hashing** - bcryptjs for secure storage
- ✅ **MongoDB Atlas** - Encrypted database with IP whitelist
- ✅ **Environment Variables** - Sensitive config protected
- ✅ **Input Validation** - Mongoose schema validation

---

## 🚨 Troubleshooting

### MongoDB Connection Failed
- ✅ Verify IP is whitelisted in MongoDB Atlas
- ✅ Check `.env` has correct URI
- ✅ Verify network connectivity

### Port Already in Use
- ✅ Change PORT in `.env` or kill process on port 3001

### CORS Errors
- ✅ CORS is enabled by default, check browser console for details

### JWT Token Invalid
- ✅ Get new token via `/api/login` endpoint

See [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) for more troubleshooting steps.


## 🎓 Repository Note


---

**Version**: 1.0.0
**Last Updated**: April 22, 2026
