/**
 * Google Meet API Service
 * Handles Google Meet space and conference operations
 */

const { google } = require('googleapis');

class GoogleMeetService {
    constructor(clientId, clientSecret, redirectUrl) {
        this.oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUrl
        );
        this.meet = google.meet({ version: 'v2' });
    }

    /**
     * Set access token for authenticated requests
     */
    setAccessToken(accessToken) {
        this.oauth2Client.setCredentials({ access_token: accessToken });
        this.meet = google.meet({
            version: 'v2',
            auth: this.oauth2Client
        });
    }

    /**
     * Create a new Google Meet space
     */
    async createMeetSpace(accessToken, spaceName) {
        try {
            this.setAccessToken(accessToken);

            const response = await this.meet.spaces.create({
                requestBody: {
                    displayName: spaceName || 'Interview Meeting'
                }
            });

            return {
                success: true,
                spaceId: response.data.name,
                meetLink: response.data.meetingUri,
                space: response.data
            };
        } catch (error) {
            console.error('Error creating Meet space:', error);
            throw error;
        }
    }

    /**
     * Get Meet space details
     */
    async getMeetSpace(accessToken, spaceName) {
        try {
            this.setAccessToken(accessToken);

            const response = await this.meet.spaces.get({
                name: spaceName
            });

            return {
                success: true,
                space: response.data
            };
        } catch (error) {
            console.error('Error getting Meet space:', error);
            throw error;
        }
    }

    /**
     * Update Meet space (add recording, etc)
     */
    async updateMeetSpace(accessToken, spaceName, updates) {
        try {
            this.setAccessToken(accessToken);

            const response = await this.meet.spaces.patch({
                name: spaceName,
                updateMask: 'displayName,config',
                requestBody: updates
            });

            return {
                success: true,
                space: response.data
            };
        } catch (error) {
            console.error('Error updating Meet space:', error);
            throw error;
        }
    }

    /**
     * End Meet space
     */
    async endMeetSpace(accessToken, spaceName) {
        try {
            this.setAccessToken(accessToken);

            const response = await this.meet.spaces.endActive({
                name: spaceName
            });

            return {
                success: true,
                message: 'Meet space ended successfully',
                response: response.data
            };
        } catch (error) {
            console.error('Error ending Meet space:', error);
            throw error;
        }
    }

    /**
     * Get participant list from Meet space
     */
    async getParticipants(accessToken, spaceName) {
        try {
            this.setAccessToken(accessToken);

            const response = await this.meet.spaces.participants.list({
                parent: spaceName
            });

            return {
                success: true,
                participants: response.data.participants || []
            };
        } catch (error) {
            console.error('Error getting participants:', error);
            throw error;
        }
    }

    /**
     * Generate Meet link from calendar event
     * (This is typically done via Calendar API with conferenceData)
     */
    generateMeetLinkFromEvent(event) {
        try {
            const meetLink = event.conferenceData?.entryPoints?.find(
                ep => ep.entryPointType === 'video'
            )?.uri;

            return meetLink || null;
        } catch (error) {
            console.error('Error generating Meet link:', error);
            return null;
        }
    }

    /**
     * Validate Meet link
     */
    validateMeetLink(meetLink) {
        try {
            const meetUrlPattern = /^https:\/\/meet\.google\.com\/[a-z-]+$/i;
            return meetUrlPattern.test(meetLink);
        } catch (error) {
            console.error('Error validating Meet link:', error);
            return false;
        }
    }
}

module.exports = GoogleMeetService;
