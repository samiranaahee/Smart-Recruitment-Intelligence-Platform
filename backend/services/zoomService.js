/**
 * Zoom API Service
 * Handles Zoom meeting creation and management
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

class ZoomAPIService {
    constructor(clientId, clientSecret, accountId) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.accountId = accountId;
        this.baseURL = 'https://api.zoom.us/v2';
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Generate Zoom JWT token
     */
    generateJWT() {
        try {
            const payload = {
                iss: this.clientId,
                exp: Math.floor(Date.now() / 1000) + 3600
            };

            return jwt.sign(payload, this.clientSecret, { algorithm: 'HS256' });
        } catch (error) {
            console.error('Error generating JWT:', error);
            throw error;
        }
    }

    /**
     * Get OAuth access token (Server-to-Server)
     */
    async getAccessToken() {
        try {
            if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
                return this.accessToken;
            }

            const response = await axios.post(
                'https://zoom.us/oauth/token',
                null,
                {
                    params: {
                        grant_type: 'account_credentials',
                        account_id: this.accountId
                    },
                    auth: {
                        username: this.clientId,
                        password: this.clientSecret
                    }
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

            return this.accessToken;
        } catch (error) {
            console.error('Error getting Zoom access token:', error);
            throw error;
        }
    }

    /**
     * Create a Zoom meeting
     */
    async createMeeting(userId, meetingData) {
        try {
            const token = await this.getAccessToken();

            const response = await axios.post(
                `${this.baseURL}/users/${userId}/meetings`,
                {
                    topic: meetingData.topic || 'Interview Meeting',
                    type: 2, // Scheduled meeting
                    start_time: new Date(meetingData.startTime).toISOString(),
                    duration: meetingData.duration || 60,
                    timezone: meetingData.timezone || 'UTC',
                    password: meetingData.password || this.generatePassword(),
                    agenda: meetingData.agenda || 'Interview Discussion',
                    settings: {
                        host_video: true,
                        participant_video: true,
                        cn_meeting: false,
                        in_meeting: false,
                        join_before_host: true,
                        mute_upon_entry: false,
                        waiting_room: true,
                        auto_recording: 'cloud'
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                meetingId: response.data.id,
                joinUrl: response.data.join_url,
                password: response.data.password,
                startTime: response.data.start_time,
                meeting: response.data
            };
        } catch (error) {
            console.error('Error creating Zoom meeting:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Update a Zoom meeting
     */
    async updateMeeting(meetingId, meetingData) {
        try {
            const token = await this.getAccessToken();

            const response = await axios.patch(
                `${this.baseURL}/meetings/${meetingId}`,
                {
                    topic: meetingData.topic,
                    start_time: meetingData.startTime ? new Date(meetingData.startTime).toISOString() : undefined,
                    duration: meetingData.duration,
                    agenda: meetingData.agenda
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                meeting: response.data
            };
        } catch (error) {
            console.error('Error updating Zoom meeting:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get Zoom meeting details
     */
    async getMeeting(meetingId) {
        try {
            const token = await this.getAccessToken();

            const response = await axios.get(
                `${this.baseURL}/meetings/${meetingId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            return {
                success: true,
                meeting: response.data
            };
        } catch (error) {
            console.error('Error getting Zoom meeting:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Delete a Zoom meeting
     */
    async deleteMeeting(meetingId) {
        try {
            const token = await this.getAccessToken();

            await axios.delete(
                `${this.baseURL}/meetings/${meetingId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            return {
                success: true,
                message: 'Meeting deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting Zoom meeting:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Add registrant to Zoom meeting
     */
    async addRegistrant(meetingId, registrantData) {
        try {
            const token = await this.getAccessToken();

            const response = await axios.post(
                `${this.baseURL}/meetings/${meetingId}/registrants`,
                {
                    first_name: registrantData.firstName,
                    last_name: registrantData.lastName,
                    email: registrantData.email,
                    action: 'create'
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                registrantId: response.data.id,
                joinUrl: response.data.join_url,
                registrant: response.data
            };
        } catch (error) {
            console.error('Error adding registrant:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get meeting registrants
     */
    async getRegistrants(meetingId) {
        try {
            const token = await this.getAccessToken();

            const response = await axios.get(
                `${this.baseURL}/meetings/${meetingId}/registrants`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            return {
                success: true,
                registrants: response.data.registrants || []
            };
        } catch (error) {
            console.error('Error getting registrants:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get user ID (needed for creating meetings)
     */
    async getUserId(email) {
        try {
            const token = await this.getAccessToken();

            const response = await axios.get(
                `${this.baseURL}/users`,
                {
                    params: { login_type: '100' },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const user = response.data.users?.find(u => u.email === email);
            return user?.id || response.data.users?.[0]?.id;
        } catch (error) {
            console.error('Error getting user ID:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Generate random password for Zoom meeting
     */
    generatePassword(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    /**
     * Validate Zoom meeting ID format
     */
    validateMeetingId(meetingId) {
        return /^\d{9,11}$/.test(meetingId);
    }
}

module.exports = ZoomAPIService;
