/**
 * Google Calendar API Service
 * Handles all Google Calendar operations for interview scheduling
 */

const { google } = require('googleapis');

class GoogleCalendarService {
    constructor(clientId, clientSecret, redirectUrl) {
        this.oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUrl
        );
        this.calendar = google.calendar({ version: 'v3' });
    }

    /**
     * Set access token for authenticated requests
     */
    setAccessToken(accessToken) {
        this.oauth2Client.setCredentials({ access_token: accessToken });
        this.calendar = google.calendar({
            version: 'v3',
            auth: this.oauth2Client
        });
    }

    /**
     * Get Google OAuth2 authorization URL
     */
    getAuthUrl() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/meetings.space.readonly'
            ]
        });
    }

    /**
     * Get access token from authorization code
     */
    async getAccessTokenFromCode(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            return tokens;
        } catch (error) {
            console.error('Error getting access token:', error);
            throw error;
        }
    }

    /**
     * Create calendar event (interview)
     */
    async createEvent(accessToken, eventData) {
        try {
            this.setAccessToken(accessToken);

            const event = {
                summary: eventData.summary || 'Interview',
                description: eventData.description || '',
                start: {
                    dateTime: new Date(eventData.startTime),
                    timeZone: eventData.timeZone || 'UTC'
                },
                end: {
                    dateTime: new Date(eventData.endTime),
                    timeZone: eventData.timeZone || 'UTC'
                },
                attendees: eventData.attendees || [],
                conferenceData: {
                    createRequest: {
                        requestId: `event-${Date.now()}`,
                        conferenceSolution: {
                            key: {
                                conferenceType: 'hangoutsMeet'
                            }
                        }
                    }
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 10 }
                    ]
                }
            };

            const response = await this.calendar.events.insert({
                calendarId: 'primary',
                resource: event,
                conferenceDataVersion: 1,
                sendUpdates: 'all'
            });

            return {
                success: true,
                eventId: response.data.id,
                eventLink: response.data.htmlLink,
                meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri,
                event: response.data
            };
        } catch (error) {
            console.error('Error creating calendar event:', error);
            throw error;
        }
    }

    /**
     * Update calendar event
     */
    async updateEvent(accessToken, eventId, eventData) {
        try {
            this.setAccessToken(accessToken);

            const event = {
                summary: eventData.summary || 'Interview',
                description: eventData.description || '',
                start: {
                    dateTime: new Date(eventData.startTime),
                    timeZone: eventData.timeZone || 'UTC'
                },
                end: {
                    dateTime: new Date(eventData.endTime),
                    timeZone: eventData.timeZone || 'UTC'
                },
                attendees: eventData.attendees || [],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 10 }
                    ]
                }
            };

            const response = await this.calendar.events.update({
                calendarId: 'primary',
                eventId: eventId,
                resource: event,
                sendUpdates: 'all'
            });

            return {
                success: true,
                eventId: response.data.id,
                event: response.data
            };
        } catch (error) {
            console.error('Error updating calendar event:', error);
            throw error;
        }
    }

    /**
     * Delete calendar event
     */
    async deleteEvent(accessToken, eventId) {
        try {
            this.setAccessToken(accessToken);

            await this.calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
                sendUpdates: 'all'
            });

            return {
                success: true,
                message: 'Event deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting calendar event:', error);
            throw error;
        }
    }

    /**
     * Get calendar event details
     */
    async getEvent(accessToken, eventId) {
        try {
            this.setAccessToken(accessToken);

            const response = await this.calendar.events.get({
                calendarId: 'primary',
                eventId: eventId
            });

            return response.data;
        } catch (error) {
            console.error('Error getting calendar event:', error);
            throw error;
        }
    }

    /**
     * List calendar events
     */
    async listEvents(accessToken, options = {}) {
        try {
            this.setAccessToken(accessToken);

            const response = await this.calendar.events.list({
                calendarId: 'primary',
                timeMin: new Date().toISOString(),
                maxResults: options.maxResults || 10,
                singleEvents: true,
                orderBy: 'startTime',
                ...options
            });

            return response.data.items || [];
        } catch (error) {
            console.error('Error listing calendar events:', error);
            throw error;
        }
    }

    /**
     * Get Google Meet link from calendar event
     */
    async getMeetLink(accessToken, eventId) {
        try {
            const event = await this.getEvent(accessToken, eventId);
            return event.conferenceData?.entryPoints?.[0]?.uri || null;
        } catch (error) {
            console.error('Error getting meet link:', error);
            throw error;
        }
    }
}

module.exports = GoogleCalendarService;
