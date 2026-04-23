/**
 * Unified Meeting API Manager
 * Handles integration of Google Calendar, Google Meet, and Zoom APIs
 */

const GoogleCalendarService = require('./googleCalendarService');
const GoogleMeetService = require('./googleMeetService');
const ZoomAPIService = require('./zoomService');

class UnifiedAPIManager {
    constructor(config = {}) {
        // Initialize services
        this.googleCalendar = new GoogleCalendarService(
            config.googleClientId,
            config.googleClientSecret,
            config.googleRedirectUrl
        );

        this.googleMeet = new GoogleMeetService(
            config.googleClientId,
            config.googleClientSecret,
            config.googleRedirectUrl
        );

        this.zoom = new ZoomAPIService(
            config.zoomClientId,
            config.zoomClientSecret,
            config.zoomAccountId
        );

        this.accessTokens = {}; // Store tokens per user
    }

    /**
     * Store access token for user
     */
    storeAccessToken(userId, accessToken) {
        this.accessTokens[userId] = {
            token: accessToken,
            storedAt: Date.now()
        };
    }

    /**
     * Get stored access token
     */
    getAccessToken(userId) {
        return this.accessTokens[userId]?.token;
    }

    /**
     * Schedule interview with all APIs
     */
    async scheduleInterview(userId, interviewData) {
        try {
            const results = {
                googleCalendar: null,
                googleMeet: null,
                zoom: null,
                errors: []
            };

            const accessToken = this.getAccessToken(userId);

            // Create Google Calendar event with Meet link
            if (interviewData.useGoogleCalendar && accessToken) {
                try {
                    const calendarResult = await this.googleCalendar.createEvent(
                        accessToken,
                        {
                            summary: interviewData.title || 'Interview',
                            description: interviewData.description || '',
                            startTime: interviewData.startTime,
                            endTime: interviewData.endTime,
                            timeZone: interviewData.timeZone || 'UTC',
                            attendees: interviewData.attendees || []
                        }
                    );

                    results.googleCalendar = calendarResult;
                } catch (error) {
                    results.errors.push({
                        service: 'Google Calendar',
                        error: error.message
                    });
                }
            }

            // Create Zoom meeting
            if (interviewData.useZoom) {
                try {
                    const zoomResult = await this.zoom.createMeeting(
                        interviewData.zoomUserId || 'me',
                        {
                            topic: interviewData.title || 'Interview',
                            startTime: interviewData.startTime,
                            duration: interviewData.duration || 60,
                            timezone: interviewData.timeZone || 'UTC',
                            agenda: interviewData.description || '',
                            password: interviewData.zoomPassword
                        }
                    );

                    results.zoom = zoomResult;
                } catch (error) {
                    results.errors.push({
                        service: 'Zoom',
                        error: error.message
                    });
                }
            }

            return {
                success: results.errors.length === 0,
                data: results,
                message: results.errors.length === 0
                    ? 'Interview scheduled successfully'
                    : `Interview scheduled with ${results.errors.length} service error(s)`
            };
        } catch (error) {
            console.error('Error scheduling interview:', error);
            throw error;
        }
    }

    /**
     * Update interview across all APIs
     */
    async updateInterview(userId, interviewData) {
        try {
            const results = {
                googleCalendar: null,
                zoom: null,
                errors: []
            };

            const accessToken = this.getAccessToken(userId);

            // Update Google Calendar event
            if (interviewData.googleEventId && accessToken) {
                try {
                    const updateResult = await this.googleCalendar.updateEvent(
                        accessToken,
                        interviewData.googleEventId,
                        {
                            summary: interviewData.title,
                            description: interviewData.description || '',
                            startTime: interviewData.startTime,
                            endTime: interviewData.endTime,
                            timeZone: interviewData.timeZone || 'UTC'
                        }
                    );

                    results.googleCalendar = updateResult;
                } catch (error) {
                    results.errors.push({
                        service: 'Google Calendar',
                        error: error.message
                    });
                }
            }

            // Update Zoom meeting
            if (interviewData.zoomMeetingId) {
                try {
                    const zoomResult = await this.zoom.updateMeeting(
                        interviewData.zoomMeetingId,
                        {
                            topic: interviewData.title,
                            startTime: interviewData.startTime,
                            duration: interviewData.duration || 60,
                            agenda: interviewData.description || ''
                        }
                    );

                    results.zoom = zoomResult;
                } catch (error) {
                    results.errors.push({
                        service: 'Zoom',
                        error: error.message
                    });
                }
            }

            return {
                success: results.errors.length === 0,
                data: results,
                message: results.errors.length === 0
                    ? 'Interview updated successfully'
                    : `Interview updated with ${results.errors.length} service error(s)`
            };
        } catch (error) {
            console.error('Error updating interview:', error);
            throw error;
        }
    }

    /**
     * Cancel interview across all APIs
     */
    async cancelInterview(userId, interviewData) {
        try {
            const results = {
                googleCalendar: null,
                zoom: null,
                errors: []
            };

            const accessToken = this.getAccessToken(userId);

            // Delete Google Calendar event
            if (interviewData.googleEventId && accessToken) {
                try {
                    const deleteResult = await this.googleCalendar.deleteEvent(
                        accessToken,
                        interviewData.googleEventId
                    );

                    results.googleCalendar = deleteResult;
                } catch (error) {
                    results.errors.push({
                        service: 'Google Calendar',
                        error: error.message
                    });
                }
            }

            // Delete Zoom meeting
            if (interviewData.zoomMeetingId) {
                try {
                    const zoomResult = await this.zoom.deleteMeeting(
                        interviewData.zoomMeetingId
                    );

                    results.zoom = zoomResult;
                } catch (error) {
                    results.errors.push({
                        service: 'Zoom',
                        error: error.message
                    });
                }
            }

            return {
                success: results.errors.length === 0,
                data: results,
                message: results.errors.length === 0
                    ? 'Interview cancelled successfully'
                    : `Interview cancelled with ${results.errors.length} service error(s)`
            };
        } catch (error) {
            console.error('Error cancelling interview:', error);
            throw error;
        }
    }

    /**
     * Check API health/connectivity
     */
    async checkAPIHealth() {
        const health = {
            googleCalendar: 'unknown',
            googleMeet: 'unknown',
            zoom: 'unknown',
            timestamp: new Date().toISOString()
        };

        try {
            // Test Zoom API
            await this.zoom.getAccessToken();
            health.zoom = 'healthy';
        } catch (error) {
            health.zoom = `error: ${error.message}`;
        }

        return health;
    }
}

module.exports = UnifiedAPIManager;
