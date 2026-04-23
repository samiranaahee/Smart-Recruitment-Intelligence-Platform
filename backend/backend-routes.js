// ============================================================
// CANDIDATE PIPELINE & INTERVIEW SCHEDULING BACKEND
// ============================================================
// Tech Stack: Node.js + Express + MongoDB + Mongoose
// Features:
// 1. Candidate Pipeline Management (Applied → Shortlisted → Interview → Offered → Hired)
// 2. Interview Scheduling Integration with Google Calendar API
// ============================================================

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const { Candidate, Interview, JobPosting, GoogleOAuthToken, Company, Application } = require('./models');
const UnifiedAPIManager = require('./services/unifiedAPIManager');
const GoogleCalendarService = require('./services/googleCalendarService');
const { loadGoogleOAuthConfig } = require('./config/googleOAuthConfig');

// Always have a working JWT secret even if .env fails to load
const JWT_SECRET = process.env.JWT_SECRET || 'talentflow_secure_jwt_key_2026_spring_cse471l_recruitment';

// ============= GOOGLE CALENDAR SETUP =============
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

const PUBLIC_COMPANY_ID = process.env.PUBLIC_COMPANY_ID || '507f1f77bcf86cd799439011';

// ============= MIDDLEWARE =============
// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// ============================================================================
// PUBLIC LOGIN ENDPOINT (NO AUTHENTICATION REQUIRED)
// ============================================================================

/**
 * POST /api/login
 * Generate a JWT token for testing (public endpoint)
 */
router.post('/login', async (req, res) => {
    try {
        // Create a test user with a fixed company ID (matches seed.js)
        const testCompanyId = '507f1f77bcf86cd799439011'; // Fixed test company ID

        const user = {
            companyId: testCompanyId,
            email: 'admin@talentflow.local',
            name: 'Admin'
        };

        // Generate JWT token
        const token = jwt.sign(user, JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRY || '7d'
        });

        res.json({
            message: 'Login successful',
            token: token,
            user: user,
            expiresIn: '7 days'
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ============================================================================
// FEATURE 1: CANDIDATE PIPELINE MANAGEMENT
// ============================================================================

/**
 * GET /api/candidates
 * Retrieve all candidates with filtering and search
 * Query params: search, status, jobId
 */
router.get('/candidates', authenticateToken, async (req, res) => {
    try {
        const { search, status, jobId } = req.query;

        // Build filter
        const filter = { company_id: new mongoose.Types.ObjectId(req.user.companyId) };

        if (status) {
            filter.status = status;
        }

        if (jobId) {
            filter.job_id = new mongoose.Types.ObjectId(jobId);
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Get candidates with interview count
        const candidates = await Candidate.find(filter)
            .sort({ created_at: -1 })
            .lean();

        // Add interview count for each candidate
        const result = await Promise.all(
            candidates.map(async (candidate) => {
                const interviewCount = await Interview.countDocuments({
                    candidate_id: candidate._id
                });
                return {
                    ...candidate,
                    interview_count: interviewCount
                };
            })
        );

        res.json(result);
    } catch (err) {
        console.error('Error fetching candidates:', err);
        res.status(500).json({ error: 'Failed to fetch candidates' });
    }
});

/**
 * GET /api/public/candidates
 * Public candidate feed for frontend rendering
 */
router.get('/public/candidates', async (req, res) => {
    try {
        const { search, status, jobId } = req.query;
        const filter = { company_id: new mongoose.Types.ObjectId(PUBLIC_COMPANY_ID) };

        if (status) {
            filter.status = status;
        }

        if (jobId) {
            filter.job_id = new mongoose.Types.ObjectId(jobId);
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const candidates = await Candidate.find(filter)
            .sort({ created_at: -1 })
            .lean();

        const result = await Promise.all(
            candidates.map(async (candidate) => {
                const interviewCount = await Interview.countDocuments({
                    candidate_id: candidate._id
                });
                return {
                    ...candidate,
                    interview_count: interviewCount
                };
            })
        );

        res.json(result);
    } catch (err) {
        console.error('Error fetching public candidates:', err);
        res.status(500).json({ error: 'Failed to fetch public candidates' });
    }
});

/**
 * GET /api/public/interviews
 * Public interview feed for frontend rendering
 */
router.get('/public/interviews', async (req, res) => {
    try {
        const interviews = await Interview.aggregate([
            {
                $lookup: {
                    from: 'candidates',
                    localField: 'candidate_id',
                    foreignField: '_id',
                    as: 'candidate'
                }
            },
            { $unwind: '$candidate' },
            {
                $match: {
                    'candidate.company_id': new mongoose.Types.ObjectId(PUBLIC_COMPANY_ID)
                }
            },
            { $sort: { scheduled_date: -1 } },
            {
                $project: {
                    _id: 1,
                    candidate_id: 1,
                    candidate_name: '$candidate.name',
                    scheduled_date: 1,
                    type: 1,
                    medium: 1,
                    interviewers: 1,
                    score: 1,
                    confirmed: 1,
                    google_meet_link: { $ifNull: ['$google_meet_link', null] },
                    zoom_join_url: { $ifNull: ['$zoom_join_url', null] }
                }
            }
        ]);

        res.json(interviews);
    } catch (err) {
        console.error('Error fetching public interviews:', err);
        res.status(500).json({ error: 'Failed to fetch public interviews' });
    }
});

/**
 * POST /api/interviews/schedule-external
 * Create Interview + external meeting (Meet/Zoom) and persist join links.
 */
router.post('/interviews/schedule-external', authenticateToken, async (req, res) => {
    try {
        const { candidateId, scheduledDate, duration, type, medium, interviewers } = req.body;

        if (!candidateId || !scheduledDate || !type || !medium) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const candidate = await Candidate.findOne({
            _id: new mongoose.Types.ObjectId(candidateId),
            company_id: new mongoose.Types.ObjectId(req.user.companyId)
        }).lean();

        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const startTimeIso = new Date(scheduledDate).toISOString();
        const dur = Number(duration) || 60;
        const endTimeIso = new Date(new Date(scheduledDate).getTime() + dur * 60000).toISOString();

        // Create the interview record first (we'll backfill links)
        const interview = await new Interview({
            candidate_id: new mongoose.Types.ObjectId(candidateId),
            scheduled_date: new Date(scheduledDate),
            duration: dur,
            type,
            medium,
            interviewers: interviewers || [],
            status: 'scheduled',
            created_at: new Date(),
            updated_at: new Date()
        }).save();

        const useGoogleCalendar = medium === 'Google Meet';
        const useZoom = medium === 'Zoom';

        const googleOAuth = loadGoogleOAuthConfig(process.env, { baseDir: __dirname });
        const apiManager = new UnifiedAPIManager({
            googleClientId: googleOAuth.clientId,
            googleClientSecret: googleOAuth.clientSecret,
            googleRedirectUrl: googleOAuth.redirectUrl,
            zoomClientId: process.env.ZOOM_CLIENT_ID,
            zoomClientSecret: process.env.ZOOM_CLIENT_SECRET,
            zoomAccountId: process.env.ZOOM_ACCOUNT_ID
        });

        const updates = { updated_at: new Date() };

        if (useGoogleCalendar) {
            try {
                const userKey = String(req.user.email || req.user.companyId || 'default');
                const tokenDoc = await GoogleOAuthToken.findOne({ user_id: userKey }).lean();
                if (!tokenDoc?.refresh_token && !tokenDoc?.access_token) {
                    console.warn('Google not authorized for user:', userKey);
                    // Continue without Google Meet - don't fail the whole request
                } else {
                    // Refresh access token if needed (google library will handle refresh when refresh_token present)
                    const oauth2Client = new google.auth.OAuth2(
                        googleOAuth.clientId,
                        googleOAuth.clientSecret,
                        googleOAuth.redirectUrl
                    );
                    oauth2Client.setCredentials({
                        access_token: tokenDoc.access_token || undefined,
                        refresh_token: tokenDoc.refresh_token || undefined,
                        expiry_date: tokenDoc.expiry_date || undefined
                    });

                    const accessTokenResp = await oauth2Client.getAccessToken();
                    const accessToken = accessTokenResp?.token || oauth2Client.credentials.access_token;

                    // Persist refreshed token/expiry if they changed
                    await GoogleOAuthToken.findOneAndUpdate(
                        { user_id: userKey },
                        {
                            access_token: oauth2Client.credentials.access_token || tokenDoc.access_token || null,
                            refresh_token: oauth2Client.credentials.refresh_token || tokenDoc.refresh_token || null,
                            expiry_date: oauth2Client.credentials.expiry_date || tokenDoc.expiry_date || null,
                            updated_at: new Date()
                        },
                        { upsert: true, new: true }
                    );

                    if (!accessToken) {
                        console.error('Unable to obtain Google access token for user:', userKey);
                        // Continue without Google Meet - don't fail the whole request
                    } else {
                        const googleCalendarService = new GoogleCalendarService(
                            googleOAuth.clientId,
                            googleOAuth.clientSecret,
                            googleOAuth.redirectUrl
                        );

                        const attendees = [
                            { email: candidate.email, displayName: candidate.name }
                        ].concat((interviewers || [])
                            .filter(v => typeof v === 'string' && v.includes('@'))
                            .map(email => ({ email })));

                        const calResult = await googleCalendarService.createEvent(accessToken, {
                            summary: `Interview: ${candidate.name} - ${type}`,
                            description: `Interview Type: ${type}\nCandidate: ${candidate.name}\nEmail: ${candidate.email}`,
                            startTime: startTimeIso,
                            endTime: endTimeIso,
                            attendees,
                            timeZone: 'UTC'
                        });

                        updates.google_calendar_event_id = calResult.eventId || null;
                        updates.google_meet_link = calResult.meetLink || null;
                        console.log('Google Meet link created:', updates.google_meet_link);
                    }
                }
            } catch (googleErr) {
                console.error('Google Calendar integration failed:', googleErr.message);
                // Continue without Google Meet - don't fail the whole request
            }
        }

        if (useZoom) {
            try {
                const zoomResult = await apiManager.zoom.createMeeting('me', {
                    topic: `Interview: ${candidate.name} - ${type}`,
                    startTime: startTimeIso,
                    duration: dur,
                    timezone: 'UTC',
                    agenda: `Interview with ${candidate.name}`
                });
                updates.zoom_join_url = zoomResult.joinUrl || null;
                console.log('Zoom join URL created:', updates.zoom_join_url);
            } catch (zoomErr) {
                console.error('Zoom integration failed:', zoomErr.message);
                // Continue without Zoom - don't fail the whole request
            }
        }

        const updatedInterview = await Interview.findByIdAndUpdate(
            interview._id,
            updates,
            { new: true }
        );

        res.status(201).json(updatedInterview);
    } catch (err) {
        console.error('Error scheduling external interview:', err);
        res.status(500).json({ error: 'Failed to schedule interview', details: err.message });
    }
});

/**
 * GET /api/candidates/:id
 * Get single candidate details with interview history
 */
router.get('/candidates/:id', authenticateToken, async (req, res) => {
    try {
        const candidate = await Candidate.findOne({
            _id: req.params.id,
            company_id: new mongoose.Types.ObjectId(req.user.companyId)
        });

        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const interviews = await Interview.find({ candidate_id: candidate._id })
            .sort({ scheduled_date: -1 });

        res.json({
            ...candidate.toObject(),
            interviews
        });
    } catch (err) {
        console.error('Error fetching candidate:', err);
        res.status(500).json({ error: 'Failed to fetch candidate' });
    }
});

/**
 * POST /api/candidates
 * Create new candidate
 */
router.post('/candidates', authenticateToken, async (req, res) => {
    try {
        const { name, email, phone, role, jobId, resumeUrl, matchScore } = req.body;

        if (!name || !email || !jobId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const candidate = new Candidate({
            company_id: new mongoose.Types.ObjectId(req.user.companyId),
            job_id: new mongoose.Types.ObjectId(jobId),
            name,
            email,
            phone: phone || null,
            role: role || null,
            status: 'applied',
            match_score: matchScore || 0,
            resume_url: resumeUrl || null,
            created_at: new Date(),
            updated_at: new Date()
        });

        const savedCandidate = await candidate.save();
        res.status(201).json(savedCandidate);
    } catch (err) {
        console.error('Error creating candidate:', err);
        res.status(500).json({ error: 'Failed to create candidate' });
    }
});

/**
 * PATCH /api/candidates/:id
 * Update candidate status (Applied → Shortlisted → Interview → Offered → Hired)
 */
router.patch('/candidates/:id', authenticateToken, async (req, res) => {
    try {
        const { status, matchScore, notes } = req.body;
        const validStatuses = ['applied', 'shortlisted', 'interview', 'offered', 'hired', 'rejected'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updateData = { updated_at: new Date() };

        if (status) {
            updateData.status = status;
        }

        if (matchScore !== undefined) {
            updateData.match_score = matchScore;
        }

        if (notes) {
            updateData.notes = notes;
        }

        const candidate = await Candidate.findOneAndUpdate(
            {
                _id: req.params.id,
                company_id: new mongoose.Types.ObjectId(req.user.companyId)
            },
            updateData,
            { new: true }
        );

        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        res.json(candidate);
    } catch (err) {
        console.error('Error updating candidate:', err);
        res.status(500).json({ error: 'Failed to update candidate' });
    }
});

/**
 * DELETE /api/candidates/:id
 * Delete candidate
 */
router.delete('/candidates/:id', authenticateToken, async (req, res) => {
    try {
        const candidate = await Candidate.findOneAndDelete({
            _id: req.params.id,
            company_id: new mongoose.Types.ObjectId(req.user.companyId)
        });

        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        res.json({ message: 'Candidate deleted successfully' });
    } catch (err) {
        console.error('Error deleting candidate:', err);
        res.status(500).json({ error: 'Failed to delete candidate' });
    }
});

/**
 * GET /api/pipeline/:jobId
 * Get pipeline view grouped by stages
 */
router.get('/pipeline/:jobId', authenticateToken, async (req, res) => {
    try {
        const candidates = await Candidate.find({
            job_id: new mongoose.Types.ObjectId(req.params.jobId),
            company_id: new mongoose.Types.ObjectId(req.user.companyId)
        });

        // Group by status
        const statusOrder = ['applied', 'shortlisted', 'interview', 'offered', 'hired', 'rejected'];
        const grouped = {};

        statusOrder.forEach(status => {
            grouped[status] = [];
        });

        candidates.forEach(candidate => {
            if (grouped[candidate.status]) {
                grouped[candidate.status].push({
                    id: candidate._id,
                    name: candidate.name,
                    email: candidate.email,
                    role: candidate.role,
                    match_score: candidate.match_score,
                    created_at: candidate.created_at
                });
            }
        });

        // Format response
        const result = Object.entries(grouped)
            .filter(([_, candidates]) => candidates.length > 0)
            .map(([status, candidateList]) => ({
                status,
                count: candidateList.length,
                candidates: candidateList
            }));

        res.json(result);
    } catch (err) {
        console.error('Error fetching pipeline:', err);
        res.status(500).json({ error: 'Failed to fetch pipeline' });
    }
});

// ============================================================================
// FEATURE 2: INTERVIEW SCHEDULING INTEGRATION
// ============================================================================

/**
 * GET /api/interviews
 * Get all interviews with filtering
 */
router.get('/interviews', authenticateToken, async (req, res) => {
    try {
        const { candidateId, status, from, to } = req.query;

        const filter = {};

        if (candidateId) {
            filter.candidate_id = new mongoose.Types.ObjectId(candidateId);
        }

        if (status) {
            filter.status = status;
        }

        if (from && to) {
            filter.scheduled_date = {
                $gte: new Date(from),
                $lte: new Date(to)
            };
        }

        // Get interviews with candidate info
        const interviews = await Interview.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'candidates',
                    localField: 'candidate_id',
                    foreignField: '_id',
                    as: 'candidate'
                }
            },
            { $unwind: '$candidate' },
            {
                $match: {
                    'candidate.company_id': new mongoose.Types.ObjectId(req.user.companyId)
                }
            },
            {
                $project: {
                    _id: 1,
                    candidate_id: 1,
                    scheduled_date: 1,
                    duration: 1,
                    type: 1,
                    medium: 1,
                    status: 1,
                    confirmed: 1,
                    score: 1,
                    feedback: 1,
                    notes: 1,
                    google_calendar_event_id: 1,
                    google_meet_link: 1,
                    created_at: 1,
                    updated_at: 1,
                    candidate_name: '$candidate.name',
                    candidate_email: '$candidate.email'
                }
            },
            { $sort: { scheduled_date: 1 } }
        ]);

        res.json(interviews);
    } catch (err) {
        console.error('Error fetching interviews:', err);
        res.status(500).json({ error: 'Failed to fetch interviews' });
    }
});

/**
 * GET /api/interviews/:id
 * Get single interview with details
 */
router.get('/interviews/:id', authenticateToken, async (req, res) => {
    try {
        const interview = await Interview.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
            {
                $lookup: {
                    from: 'candidates',
                    localField: 'candidate_id',
                    foreignField: '_id',
                    as: 'candidate'
                }
            },
            { $unwind: '$candidate' },
            {
                $match: {
                    'candidate.company_id': new mongoose.Types.ObjectId(req.user.companyId)
                }
            },
            {
                $project: {
                    _id: 1,
                    candidate_id: 1,
                    scheduled_date: 1,
                    duration: 1,
                    type: 1,
                    medium: 1,
                    interviewers: 1,
                    status: 1,
                    confirmed: 1,
                    score: 1,
                    feedback: 1,
                    notes: 1,
                    google_calendar_event_id: 1,
                    google_meet_link: 1,
                    created_at: 1,
                    updated_at: 1,
                    candidate_name: '$candidate.name',
                    candidate_email: '$candidate.email'
                }
            }
        ]);

        if (interview.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        res.json(interview[0]);
    } catch (err) {
        console.error('Error fetching interview:', err);
        res.status(500).json({ error: 'Failed to fetch interview' });
    }
});

/**
 * POST /api/interviews
 * Schedule new interview
 * External API Integration: Google Calendar API
 */
router.post('/interviews', authenticateToken, async (req, res) => {
    try {
        const { candidateId, scheduledDate, duration, type, medium, interviewers, googleMeetLink } = req.body;

        if (!candidateId || !scheduledDate || !type || !medium) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create interview
        const interview = new Interview({
            candidate_id: new mongoose.Types.ObjectId(candidateId),
            scheduled_date: new Date(scheduledDate),
            duration: duration || 60,
            type,
            medium,
            interviewers: interviewers || [],
            google_meet_link: googleMeetLink || null,
            status: 'scheduled',
            created_at: new Date(),
            updated_at: new Date()
        });

        let savedInterview = await interview.save();

        // Sync with Google Calendar (if medium includes Google Meet)
        if (medium === 'Google Meet' && req.user.googleAccessToken) {
            try {
                oauth2Client.setCredentials({
                    access_token: req.user.googleAccessToken,
                    refresh_token: req.user.googleRefreshToken
                });

                const candidate = await Candidate.findById(candidateId);

                const event = {
                    summary: `Interview: ${candidate.name} - ${type}`,
                    description: `Interview Type: ${type}\nCandidate: ${candidate.name}\nEmail: ${candidate.email}`,
                    start: {
                        dateTime: new Date(scheduledDate).toISOString(),
                        timeZone: 'UTC'
                    },
                    end: {
                        dateTime: new Date(new Date(scheduledDate).getTime() + (duration || 60) * 60000).toISOString(),
                        timeZone: 'UTC'
                    },
                    conferenceData: {
                        createRequest: {
                            requestId: `interview-${savedInterview._id}`
                        }
                    },
                    attendees: [
                        { email: candidate.email, responseStatus: 'needsAction' },
                        ...((interviewers || []).map(interviewer => ({ email: interviewer })))
                    ]
                };

                const response = await calendar.events.insert({
                    calendarId: 'primary',
                    resource: event,
                    conferenceDataVersion: 1
                });

                // Update interview with Google Calendar event ID and Meet link
                savedInterview = await Interview.findByIdAndUpdate(
                    savedInterview._id,
                    {
                        google_calendar_event_id: response.data.id,
                        google_meet_link: response.data.conferenceData?.entryPoints?.[0]?.uri || null,
                        updated_at: new Date()
                    },
                    { new: true }
                );

                return res.status(201).json(savedInterview);
            } catch (calendarError) {
                console.error('Google Calendar sync failed:', calendarError);
                // Continue without calendar sync - still return the created interview
                return res.status(201).json(savedInterview);
            }
        }

        res.status(201).json(savedInterview);
    } catch (err) {
        console.error('Error creating interview:', err);
        res.status(500).json({ error: 'Failed to create interview' });
    }
});

/**
 * PATCH /api/interviews/:id
 * Update interview (reschedule, confirm, score)
 */
router.patch('/interviews/:id', authenticateToken, async (req, res) => {
    try {
        const { status, scheduledDate, duration, type, medium, score, notes, confirmed } = req.body;

        const updateData = { updated_at: new Date() };

        if (status) updateData.status = status;
        if (scheduledDate) updateData.scheduled_date = new Date(scheduledDate);
        if (duration) updateData.duration = Number(duration);
        if (type) updateData.type = type;
        if (medium) updateData.medium = medium;
        if (score !== undefined) updateData.score = score;
        if (notes) updateData.notes = notes;
        if (confirmed !== undefined) updateData.confirmed = confirmed;

        // Verify interview belongs to user's company
        const interview = await Interview.findById(req.params.id);
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const candidate = await Candidate.findById(interview.candidate_id);
        if (!candidate || candidate.company_id.toString() !== req.user.companyId) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        // Sync with external APIs if date/duration/medium changes
        if (scheduledDate || duration || medium) {
            try {
                const googleOAuth = loadGoogleOAuthConfig(process.env, { baseDir: __dirname });
                const apiManager = new UnifiedAPIManager({
                    googleClientId: googleOAuth.clientId,
                    googleClientSecret: googleOAuth.clientSecret,
                    googleRedirectUrl: googleOAuth.redirectUrl,
                    zoomClientId: process.env.ZOOM_CLIENT_ID,
                    zoomClientSecret: process.env.ZOOM_CLIENT_SECRET,
                    zoomAccountId: process.env.ZOOM_ACCOUNT_ID
                });

                const updatedDate = scheduledDate ? new Date(scheduledDate) : interview.scheduled_date;
                const updatedDur = duration ? Number(duration) : interview.duration;
                const updatedMedium = medium || interview.medium;
                const startTimeIso = updatedDate.toISOString();
                const endTimeIso = new Date(updatedDate.getTime() + updatedDur * 60000).toISOString();

                // 1. Handle Google Calendar Update
                if (interview.google_calendar_event_id) {
                    const userKey = String(req.user.email || req.user.companyId || 'default');
                    const tokenDoc = await GoogleOAuthToken.findOne({ user_id: userKey }).lean();
                    if (tokenDoc) {
                        const googleCalendarService = new GoogleCalendarService(
                            googleOAuth.clientId,
                            googleOAuth.clientSecret,
                            googleOAuth.redirectUrl
                        );
                        // Refresh token if needed
                        const oauth2Client = new google.auth.OAuth2(googleOAuth.clientId, googleOAuth.clientSecret, googleOAuth.redirectUrl);
                        oauth2Client.setCredentials({ access_token: tokenDoc.access_token, refresh_token: tokenDoc.refresh_token });
                        const at = await oauth2Client.getAccessToken();
                        
                        await googleCalendarService.updateEvent(at.token, interview.google_calendar_event_id, {
                            summary: `Interview: ${candidate.name} - ${type || interview.type}`,
                            startTime: startTimeIso,
                            endTime: endTimeIso,
                            timeZone: 'UTC'
                        });
                    }
                }

                // 2. Handle Zoom Update (simplified - check if zoomMeetingId exists in a real scenario, here we use zoom_join_url)
                // Note: The current Zoom implementation doesn't store meetingId separately, 
                // but we could extract it from joinUrl if needed. For now, we'll just log or attempt update if we had the ID.
            } catch (syncErr) {
                console.error('External API sync during patch failed:', syncErr.message);
            }
        }

        const updatedInterview = await Interview.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json(updatedInterview);
    } catch (err) {
        console.error('Error updating interview:', err);
        res.status(500).json({ error: 'Failed to update interview' });
    }
});

/**
 * DELETE /api/interviews/:id
 * Cancel interview and remove from Google Calendar
 */
router.delete('/interviews/:id', authenticateToken, async (req, res) => {
    try {
        // Get interview details
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        // Verify interview belongs to user's company
        const candidate = await Candidate.findById(interview.candidate_id);
        if (!candidate || candidate.company_id.toString() !== req.user.companyId) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        // Delete from Google Calendar if event ID exists
        if (interview.google_calendar_event_id && req.user.googleAccessToken) {
            try {
                oauth2Client.setCredentials({
                    access_token: req.user.googleAccessToken,
                    refresh_token: req.user.googleRefreshToken
                });

                await calendar.events.delete({
                    calendarId: 'primary',
                    eventId: interview.google_calendar_event_id
                });
            } catch (calendarError) {
                console.error('Failed to delete Google Calendar event:', calendarError);
            }
        }

        // Delete from database
        await Interview.findByIdAndDelete(req.params.id);

        res.json({ message: 'Interview canceled successfully' });
    } catch (err) {
        console.error('Error deleting interview:', err);
        res.status(500).json({ error: 'Failed to delete interview' });
    }
});

/**
 * POST /api/interviews/:id/confirm
 * Confirm interview and send calendar invitations
 */
router.post('/interviews/:id/confirm', authenticateToken, async (req, res) => {
    try {
        // Verify interview belongs to user's company
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const candidate = await Candidate.findById(interview.candidate_id);
        if (!candidate || candidate.company_id.toString() !== req.user.companyId) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const updatedInterview = await Interview.findByIdAndUpdate(
            req.params.id,
            {
                confirmed: true,
                status: 'confirmed',
                updated_at: new Date()
            },
            { new: true }
        );

        // TODO: Send email confirmation to candidate and interviewers
        res.json({ message: 'Interview confirmed', interview: updatedInterview });
    } catch (err) {
        console.error('Error confirming interview:', err);
        res.status(500).json({ error: 'Failed to confirm interview' });
    }
});

/**
 * POST /api/calendar/sync
 * Sync all pending interviews with Google Calendar
 * External API Integration: Google Calendar API
 */
router.post('/calendar/sync', authenticateToken, async (req, res) => {
    try {
        if (!req.user.googleAccessToken) {
            return res.status(401).json({ error: 'Google Calendar not connected' });
        }

        oauth2Client.setCredentials({
            access_token: req.user.googleAccessToken,
            refresh_token: req.user.googleRefreshToken
        });

        // Get pending interviews for this company
        const interviews = await Interview.aggregate([
            {
                $lookup: {
                    from: 'candidates',
                    localField: 'candidate_id',
                    foreignField: '_id',
                    as: 'candidate'
                }
            },
            { $unwind: '$candidate' },
            {
                $match: {
                    'candidate.company_id': new mongoose.Types.ObjectId(req.user.companyId),
                    google_calendar_event_id: null,
                    status: 'scheduled'
                }
            },
            { $limit: 20 },
            {
                $project: {
                    _id: 1,
                    candidate_id: 1,
                    scheduled_date: 1,
                    duration: 1,
                    type: 1,
                    interviewers: 1,
                    candidate_name: '$candidate.name',
                    candidate_email: '$candidate.email'
                }
            }
        ]);

        const syncResults = [];

        for (const interview of interviews) {
            try {
                const event = {
                    summary: `Interview: ${interview.candidate_name} - ${interview.type}`,
                    start: {
                        dateTime: new Date(interview.scheduled_date).toISOString(),
                        timeZone: 'UTC'
                    },
                    end: {
                        dateTime: new Date(
                            new Date(interview.scheduled_date).getTime() + (interview.duration || 60) * 60000
                        ).toISOString(),
                        timeZone: 'UTC'
                    },
                    conferenceData: {
                        createRequest: {
                            requestId: `interview-${interview._id}`
                        }
                    },
                    attendees: [{ email: interview.candidate_email }]
                };

                const response = await calendar.events.insert({
                    calendarId: 'primary',
                    resource: event,
                    conferenceDataVersion: 1
                });

                await Interview.findByIdAndUpdate(
                    interview._id,
                    {
                        google_calendar_event_id: response.data.id,
                        google_meet_link: response.data.conferenceData?.entryPoints?.[0]?.uri || null,
                        updated_at: new Date()
                    }
                );

                syncResults.push({ interviewId: interview._id, synced: true });
            } catch (error) {
                console.error(`Failed to sync interview ${interview._id}:`, error);
                syncResults.push({ interviewId: interview._id, synced: false, error: error.message });
            }
        }

        res.json({
            message: 'Calendar sync completed',
            syncResults,
            totalSynced: syncResults.filter(s => s.synced).length
        });
    } catch (err) {
        console.error('Error syncing calendar:', err);
        res.status(500).json({ error: 'Failed to sync calendar' });
    }
});

// ============================================================================
// FEATURE 3: JOB POSTING CRUD WITH SKILL TAGGING (Member 2)
// ============================================================================

/**
 * GET /api/jobs
 * Retrieve all job postings with filtering and search
 * Query params: search, status
 */
router.get('/jobs', authenticateToken, async (req, res) => {
    try {
        const { search, status } = req.query;

        const filter = { company_id: new mongoose.Types.ObjectId(req.user.companyId) };

        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { 'required_skills.skill_name': { $regex: search, $options: 'i' } }
            ];
        }

        const jobs = await JobPosting.find(filter)
            .sort({ created_at: -1 })
            .lean();

        res.json(jobs);
    } catch (err) {
        console.error('Error fetching jobs:', err);
        res.status(500).json({ error: 'Failed to fetch job postings' });
    }
});

/**
 * GET /api/jobs/:id
 * Get single job posting details
 */
router.get('/jobs/:id', authenticateToken, async (req, res) => {
    try {
        const job = await JobPosting.findOne({
            _id: req.params.id,
            company_id: new mongoose.Types.ObjectId(req.user.companyId)
        });

        if (!job) {
            return res.status(404).json({ error: 'Job posting not found' });
        }

        // Get candidate count for this job
        const candidateCount = await Candidate.countDocuments({
            job_id: job._id
        });

        res.json({
            ...job.toObject(),
            candidate_count: candidateCount
        });
    } catch (err) {
        console.error('Error fetching job:', err);
        res.status(500).json({ error: 'Failed to fetch job posting' });
    }
});

/**
 * POST /api/jobs
 * Create new job posting with skill tagging
 */
router.post('/jobs', authenticateToken, async (req, res) => {
    try {
        const { title, description, department, required_skills, nice_to_have_skills, employment_type, location, remote_policy, salary_min, salary_max, currency } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        const job = new JobPosting({
            company_id: new mongoose.Types.ObjectId(req.user.companyId),
            title,
            description,
            department: department || null,
            required_skills: required_skills || [],
            nice_to_have_skills: nice_to_have_skills || [],
            employment_type: employment_type || 'Full-time',
            location: location || null,
            remote_policy: remote_policy || 'Hybrid',
            salary_min: salary_min || null,
            salary_max: salary_max || null,
            currency: currency || 'USD',
            status: 'draft',
            created_by: req.user.email,
            updated_by: req.user.email,
            created_at: new Date(),
            updated_at: new Date()
        });

        const savedJob = await job.save();
        res.status(201).json(savedJob);
    } catch (err) {
        console.error('Error creating job:', err);
        res.status(500).json({ error: 'Failed to create job posting' });
    }
});

/**
 * PATCH /api/jobs/:id
 * Update job posting (including skill tags)
 */
router.patch('/jobs/:id', authenticateToken, async (req, res) => {
    try {
        const { title, description, department, required_skills, nice_to_have_skills, employment_type, location, remote_policy, salary_min, salary_max, status } = req.body;

        const validStatuses = ['draft', 'open', 'closed', 'on_hold'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updateData = { updated_at: new Date(), updated_by: req.user.email };

        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (department) updateData.department = department;
        if (required_skills) updateData.required_skills = required_skills;
        if (nice_to_have_skills) updateData.nice_to_have_skills = nice_to_have_skills;
        if (employment_type) updateData.employment_type = employment_type;
        if (location) updateData.location = location;
        if (remote_policy) updateData.remote_policy = remote_policy;
        if (salary_min !== undefined) updateData.salary_min = salary_min;
        if (salary_max !== undefined) updateData.salary_max = salary_max;
        if (status) {
            updateData.status = status;
            if (status === 'open') updateData.published_at = new Date();
            if (status === 'closed') updateData.closed_at = new Date();
        }

        const job = await JobPosting.findOneAndUpdate(
            {
                _id: req.params.id,
                company_id: new mongoose.Types.ObjectId(req.user.companyId)
            },
            updateData,
            { new: true }
        );

        if (!job) {
            return res.status(404).json({ error: 'Job posting not found' });
        }

        res.json(job);
    } catch (err) {
        console.error('Error updating job:', err);
        res.status(500).json({ error: 'Failed to update job posting' });
    }
});

/**
 * DELETE /api/jobs/:id
 * Delete job posting
 */
router.delete('/jobs/:id', authenticateToken, async (req, res) => {
    try {
        const job = await JobPosting.findOneAndDelete({
            _id: req.params.id,
            company_id: new mongoose.Types.ObjectId(req.user.companyId)
        });

        if (!job) {
            return res.status(404).json({ error: 'Job posting not found' });
        }

        res.json({ message: 'Job posting deleted successfully', job });
    } catch (err) {
        console.error('Error deleting job:', err);
        res.status(500).json({ error: 'Failed to delete job posting' });
    }
});

/**
 * GET /api/jobs/:id/candidates
 * Get all candidates for a job posting
 */
router.get('/jobs/:id/candidates', authenticateToken, async (req, res) => {
    try {
        const candidates = await Candidate.find({
            job_id: new mongoose.Types.ObjectId(req.params.id),
            company_id: new mongoose.Types.ObjectId(req.user.companyId)
        }).sort({ created_at: -1 });

        res.json(candidates);
    } catch (err) {
        console.error('Error fetching job candidates:', err);
        res.status(500).json({ error: 'Failed to fetch candidates for job posting' });
    }
});

// ============================================================================
// FEATURE 4: INTERVIEW EVALUATION SCORING SYSTEM (Member 2)
// ============================================================================

/**
 * POST /api/interviews/:id/evaluate
 * Create or update interview evaluation with scoring
 */
router.post('/interviews/:id/evaluate', authenticateToken, async (req, res) => {
    try {
        const { evaluation_criteria, evaluation_scores } = req.body;

        if (!evaluation_criteria || !evaluation_scores) {
            return res.status(400).json({ error: 'Evaluation criteria and scores are required' });
        }

        // Verify interview belongs to user's company
        const interview = await Interview.findById(req.params.id);
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const candidate = await Candidate.findById(interview.candidate_id);
        if (!candidate || candidate.company_id.toString() !== req.user.companyId) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        // Validate evaluation data
        if (!Array.isArray(evaluation_criteria) || !Array.isArray(evaluation_scores)) {
            return res.status(400).json({ error: 'Evaluation criteria and scores must be arrays' });
        }

        // Calculate overall score based on weights
        let totalWeightedScore = 0;
        let totalWeight = 0;

        const scoringMap = {};
        evaluation_scores.forEach(score => {
            scoringMap[score.criterion_id] = score;
        });

        evaluation_criteria.forEach(criterion => {
            const score = scoringMap[criterion.criterion_id];
            if (score) {
                const weight = criterion.weight || 0;
                totalWeightedScore += (score.score || 0) * weight;
                totalWeight += weight;
            }
        });

        const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

        // Update interview with evaluation data
        const updatedInterview = await Interview.findByIdAndUpdate(
            req.params.id,
            {
                evaluation_criteria,
                evaluation_scores: evaluation_scores.map(s => ({
                    ...s,
                    scored_at: new Date()
                })),
                overall_score: overallScore,
                evaluated_by: req.user.email,
                evaluation_date: new Date(),
                evaluation_completed: true,
                score: overallScore, // Also update the legacy score field
                status: 'completed',
                updated_at: new Date()
            },
            { new: true }
        );

        res.json({
            message: 'Interview evaluation completed',
            interview: updatedInterview,
            overall_score: overallScore
        });
    } catch (err) {
        console.error('Error evaluating interview:', err);
        res.status(500).json({ error: 'Failed to evaluate interview' });
    }
});

/**
 * GET /api/interviews/:id/evaluation
 * Get interview evaluation details
 */
router.get('/interviews/:id/evaluation', authenticateToken, async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        // Verify interview belongs to user's company
        const candidate = await Candidate.findById(interview.candidate_id);
        if (!candidate || candidate.company_id.toString() !== req.user.companyId) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        if (!interview.evaluation_completed) {
            return res.status(404).json({ error: 'No evaluation found for this interview' });
        }

        res.json({
            _id: interview._id,
            candidate_id: interview.candidate_id,
            interview_date: interview.scheduled_date,
            interview_type: interview.type,
            evaluation_criteria: interview.evaluation_criteria,
            evaluation_scores: interview.evaluation_scores,
            overall_score: interview.overall_score,
            evaluated_by: interview.evaluated_by,
            evaluation_date: interview.evaluation_date,
            feedback: interview.feedback,
            notes: interview.notes
        });
    } catch (err) {
        console.error('Error fetching evaluation:', err);
        res.status(500).json({ error: 'Failed to fetch interview evaluation' });
    }
});

/**
 * GET /api/interviews/evaluations/report
 * Get evaluation report for all interviews (with filters)
 */
router.get('/interviews/evaluations/report', authenticateToken, async (req, res) => {
    try {
        const { candidateId, from, to, minScore, maxScore } = req.query;

        const filter = {
            evaluation_completed: true,
            $or: [
                {
                    'candidate.company_id': new mongoose.Types.ObjectId(req.user.companyId)
                }
            ]
        };

        if (candidateId) {
            filter.candidate_id = new mongoose.Types.ObjectId(candidateId);
        }

        if (minScore || maxScore) {
            filter.overall_score = {};
            if (minScore) filter.overall_score.$gte = parseInt(minScore);
            if (maxScore) filter.overall_score.$lte = parseInt(maxScore);
        }

        const evaluations = await Interview.aggregate([
            {
                $lookup: {
                    from: 'candidates',
                    localField: 'candidate_id',
                    foreignField: '_id',
                    as: 'candidate'
                }
            },
            { $unwind: '$candidate' },
            {
                $match: {
                    'candidate.company_id': new mongoose.Types.ObjectId(req.user.companyId),
                    evaluation_completed: true
                }
            },
            {
                $project: {
                    _id: 1,
                    candidate_name: '$candidate.name',
                    candidate_email: '$candidate.email',
                    interview_type: '$type',
                    interview_date: '$scheduled_date',
                    overall_score: 1,
                    evaluation_date: 1,
                    evaluated_by: 1,
                    evaluation_count: { $size: '$evaluation_scores' },
                    feedback: 1
                }
            },
            { $sort: { evaluation_date: -1 } }
        ]);

        // Add statistics
        const stats = {
            total_evaluations: evaluations.length,
            average_score: evaluations.length > 0
                ? Math.round(evaluations.reduce((sum, e) => sum + (e.overall_score || 0), 0) / evaluations.length)
                : 0,
            highest_score: evaluations.length > 0
                ? Math.max(...evaluations.map(e => e.overall_score || 0))
                : 0,
            lowest_score: evaluations.length > 0
                ? Math.min(...evaluations.map(e => e.overall_score || 0))
                : 0
        };

        res.json({
            statistics: stats,
            evaluations
        });
    } catch (err) {
        console.error('Error generating evaluation report:', err);
        res.status(500).json({ error: 'Failed to generate evaluation report' });
    }
});

module.exports = router;
