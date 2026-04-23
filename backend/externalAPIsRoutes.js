/**
 * External APIs Routes
 * Handles Google Calendar, Google Meet, and Zoom API endpoints
 */

const express = require('express');
const router = express.Router();
const UnifiedAPIManager = require('./services/unifiedAPIManager');
const GoogleCalendarService = require('./services/googleCalendarService');
const { loadGoogleOAuthConfig } = require('./config/googleOAuthConfig');
const { GoogleOAuthToken } = require('./models');

const googleOAuth = loadGoogleOAuthConfig(process.env, { baseDir: __dirname });

// Initialize API Manager
const apiManager = new UnifiedAPIManager({
    googleClientId: googleOAuth.clientId,
    googleClientSecret: googleOAuth.clientSecret,
    googleRedirectUrl: googleOAuth.redirectUrl,
    zoomClientId: process.env.ZOOM_CLIENT_ID,
    zoomClientSecret: process.env.ZOOM_CLIENT_SECRET,
    zoomAccountId: process.env.ZOOM_ACCOUNT_ID
});

const googleCalendarService = new GoogleCalendarService(
    googleOAuth.clientId,
    googleOAuth.clientSecret,
    googleOAuth.redirectUrl
);

// ============================================================================
// GOOGLE CALENDAR & MEET API ENDPOINTS
// ============================================================================

/**
 * GET /api/external/google/auth-url
 * Get Google OAuth2 authorization URL
 */
router.get('/google/auth-url', (req, res) => {
    try {
        const authUrl = googleCalendarService.getAuthUrl();
        res.json({
            success: true,
            authUrl: authUrl,
            message: 'Visit this URL to authorize Google access'
        });
    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/external/google/callback
 * Handle Google OAuth2 callback with authorization code
 * Body: { code: string, userId: string }
 */
router.post('/google/callback', async (req, res) => {
    try {
        const { code, userId } = req.body;

        if (!code || !userId) {
            return res.status(400).json({ error: 'Missing code or userId' });
        }

        // Get access token from code
        const tokens = await googleCalendarService.getAccessTokenFromCode(code);

        await GoogleOAuthToken.findOneAndUpdate(
            { user_id: String(userId) },
            {
                user_id: String(userId),
                access_token: tokens.access_token || null,
                refresh_token: tokens.refresh_token || null,
                scope: tokens.scope || null,
                token_type: tokens.token_type || null,
                expiry_date: tokens.expiry_date || null,
                updated_at: new Date()
            },
            { upsert: true, new: true }
        );

        // Keep a fast in-memory copy for this process too
        if (tokens.access_token) {
            apiManager.storeAccessToken(userId, tokens.access_token);
        }

        res.json({
            success: true,
            message: 'Google authorization successful',
            expiresIn: tokens.expiry_date,
            token: tokens.access_token
        });
    } catch (error) {
        console.error('Error handling Google callback:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/external/google/calendar/events
 * Create a calendar event
 * Body: {
 *   userId: string,
 *   summary: string,
 *   description: string,
 *   startTime: ISO string,
 *   endTime: ISO string,
 *   attendees: array,
 *   timeZone: string
 * }
 */
router.post('/google/calendar/events', async (req, res) => {
    try {
        const { userId, summary, description, startTime, endTime, attendees, timeZone } = req.body;

        const accessToken = apiManager.getAccessToken(userId);
        if (!accessToken) {
            return res.status(401).json({ error: 'No Google authorization found. Please authorize first.' });
        }

        const result = await googleCalendarService.createEvent(accessToken, {
            summary,
            description,
            startTime,
            endTime,
            attendees,
            timeZone
        });

        res.status(201).json({
            success: true,
            data: result,
            message: 'Calendar event created successfully'
        });
    } catch (error) {
        console.error('Error creating calendar event:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/external/google/calendar/events
 * List calendar events
 * Query: { userId: string, maxResults?: number }
 */
router.get('/google/calendar/events', async (req, res) => {
    try {
        const { userId, maxResults } = req.query;

        const accessToken = apiManager.getAccessToken(userId);
        if (!accessToken) {
            return res.status(401).json({ error: 'No Google authorization found. Please authorize first.' });
        }

        const events = await googleCalendarService.listEvents(accessToken, {
            maxResults: parseInt(maxResults) || 10
        });

        res.json({
            success: true,
            events: events,
            count: events.length
        });
    } catch (error) {
        console.error('Error listing calendar events:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/external/google/calendar/events/:eventId
 * Get specific calendar event
 * Query: { userId: string }
 */
router.get('/google/calendar/events/:eventId', async (req, res) => {
    try {
        const { userId } = req.query;
        const { eventId } = req.params;

        const accessToken = apiManager.getAccessToken(userId);
        if (!accessToken) {
            return res.status(401).json({ error: 'No Google authorization found. Please authorize first.' });
        }

        const event = await googleCalendarService.getEvent(accessToken, eventId);

        res.json({
            success: true,
            event: event
        });
    } catch (error) {
        console.error('Error getting calendar event:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/external/google/calendar/events/:eventId
 * Update calendar event
 */
router.patch('/google/calendar/events/:eventId', async (req, res) => {
    try {
        const { userId, summary, description, startTime, endTime, attendees, timeZone } = req.body;
        const { eventId } = req.params;

        const accessToken = apiManager.getAccessToken(userId);
        if (!accessToken) {
            return res.status(401).json({ error: 'No Google authorization found. Please authorize first.' });
        }

        const result = await googleCalendarService.updateEvent(accessToken, eventId, {
            summary,
            description,
            startTime,
            endTime,
            attendees,
            timeZone
        });

        res.json({
            success: true,
            data: result,
            message: 'Calendar event updated successfully'
        });
    } catch (error) {
        console.error('Error updating calendar event:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/external/google/calendar/events/:eventId
 * Delete calendar event
 * Query: { userId: string }
 */
router.delete('/google/calendar/events/:eventId', async (req, res) => {
    try {
        const { userId } = req.query;
        const { eventId } = req.params;

        const accessToken = apiManager.getAccessToken(userId);
        if (!accessToken) {
            return res.status(401).json({ error: 'No Google authorization found. Please authorize first.' });
        }

        const result = await googleCalendarService.deleteEvent(accessToken, eventId);

        res.json({
            success: true,
            data: result,
            message: 'Calendar event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/external/google/calendar/events/:eventId/meet-link
 * Get Google Meet link from calendar event
 * Query: { userId: string }
 */
router.get('/google/calendar/events/:eventId/meet-link', async (req, res) => {
    try {
        const { userId } = req.query;
        const { eventId } = req.params;

        const accessToken = apiManager.getAccessToken(userId);
        if (!accessToken) {
            return res.status(401).json({ error: 'No Google authorization found. Please authorize first.' });
        }

        const meetLink = await googleCalendarService.getMeetLink(accessToken, eventId);

        res.json({
            success: !!meetLink,
            meetLink: meetLink,
            message: meetLink ? 'Meet link retrieved' : 'No Meet link available'
        });
    } catch (error) {
        console.error('Error getting Meet link:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// ZOOM API ENDPOINTS
// ============================================================================

/**
 * POST /api/external/zoom/meetings
 * Create a Zoom meeting
 * Body: {
 *   userId: string (Zoom user ID),
 *   topic: string,
 *   description: string,
 *   startTime: ISO string,
 *   duration: number (minutes),
 *   timeZone: string,
 *   password?: string
 * }
 */
router.post('/zoom/meetings', async (req, res) => {
    try {
        const { userId, topic, description, startTime, duration, timeZone, password } = req.body;

        if (!userId || !startTime) {
            return res.status(400).json({ error: 'Missing required fields: userId, startTime' });
        }

        const result = await apiManager.zoom.createMeeting(userId, {
            topic,
            startTime,
            duration: duration || 60,
            timezone: timeZone || 'UTC',
            agenda: description,
            password
        });

        res.status(201).json({
            success: true,
            data: result,
            message: 'Zoom meeting created successfully'
        });
    } catch (error) {
        console.error('Error creating Zoom meeting:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/external/zoom/meetings/:meetingId
 * Get Zoom meeting details
 */
router.get('/zoom/meetings/:meetingId', async (req, res) => {
    try {
        const { meetingId } = req.params;

        if (!apiManager.zoom.validateMeetingId(meetingId)) {
            return res.status(400).json({ error: 'Invalid Zoom meeting ID format' });
        }

        const result = await apiManager.zoom.getMeeting(meetingId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error getting Zoom meeting:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/external/zoom/meetings/:meetingId
 * Update Zoom meeting
 */
router.patch('/zoom/meetings/:meetingId', async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { topic, startTime, duration, description } = req.body;

        if (!apiManager.zoom.validateMeetingId(meetingId)) {
            return res.status(400).json({ error: 'Invalid Zoom meeting ID format' });
        }

        const result = await apiManager.zoom.updateMeeting(meetingId, {
            topic,
            startTime,
            duration,
            agenda: description
        });

        res.json({
            success: true,
            data: result,
            message: 'Zoom meeting updated successfully'
        });
    } catch (error) {
        console.error('Error updating Zoom meeting:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/external/zoom/meetings/:meetingId
 * Delete Zoom meeting
 */
router.delete('/zoom/meetings/:meetingId', async (req, res) => {
    try {
        const { meetingId } = req.params;

        if (!apiManager.zoom.validateMeetingId(meetingId)) {
            return res.status(400).json({ error: 'Invalid Zoom meeting ID format' });
        }

        const result = await apiManager.zoom.deleteMeeting(meetingId);

        res.json({
            success: true,
            data: result,
            message: 'Zoom meeting deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting Zoom meeting:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/external/zoom/meetings/:meetingId/registrants
 * Add registrant to Zoom meeting
 * Body: { firstName: string, lastName: string, email: string }
 */
router.post('/zoom/meetings/:meetingId/registrants', async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { firstName, lastName, email } = req.body;

        if (!firstName || !lastName || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await apiManager.zoom.addRegistrant(meetingId, {
            firstName,
            lastName,
            email
        });

        res.status(201).json({
            success: true,
            data: result,
            message: 'Registrant added successfully'
        });
    } catch (error) {
        console.error('Error adding registrant:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/external/zoom/meetings/:meetingId/registrants
 * Get Zoom meeting registrants
 */
router.get('/zoom/meetings/:meetingId/registrants', async (req, res) => {
    try {
        const { meetingId } = req.params;

        const result = await apiManager.zoom.getRegistrants(meetingId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error getting registrants:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// UNIFIED INTERVIEW SCHEDULING
// ============================================================================

/**
 * POST /api/external/interviews/schedule
 * Schedule interview across multiple platforms
 * Body: {
 *   userId: string,
 *   title: string,
 *   description: string,
 *   startTime: ISO string,
 *   endTime: ISO string,
 *   duration: number,
 *   timeZone: string,
 *   attendees: array,
 *   useGoogleCalendar: boolean,
 *   useZoom: boolean,
 *   zoomUserId?: string
 * }
 */
router.post('/interviews/schedule', async (req, res) => {
    try {
        const { userId, ...interviewData } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        const result = await apiManager.scheduleInterview(userId, interviewData);

        res.status(201).json(result);
    } catch (error) {
        console.error('Error scheduling interview:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/external/interviews/update
 * Update interview across multiple platforms
 */
router.patch('/interviews/update', async (req, res) => {
    try {
        const { userId, ...interviewData } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        const result = await apiManager.updateInterview(userId, interviewData);

        res.json(result);
    } catch (error) {
        console.error('Error updating interview:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/external/interviews/cancel
 * Cancel interview across multiple platforms
 */
router.delete('/interviews/cancel', async (req, res) => {
    try {
        const { userId, googleEventId, zoomMeetingId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        const result = await apiManager.cancelInterview(userId, {
            googleEventId,
            zoomMeetingId
        });

        res.json(result);
    } catch (error) {
        console.error('Error cancelling interview:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/external/health
 * Check API health/connectivity
 */
router.get('/health', async (req, res) => {
    try {
        const health = await apiManager.checkAPIHealth();

        res.json({
            success: true,
            health: health,
            message: 'API health check complete'
        });
    } catch (error) {
        console.error('Error checking API health:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
