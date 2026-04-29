const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
];

const getOAuth2Client = () =>
    new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

// ── GET /api/auth/google ───────────────────────────────────────────────────
// Visit this in the browser to kick off the OAuth flow
router.get("/google", (req, res) => {
    const oauth2Client = getOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent", // always return refresh_token
    });
    res.redirect(url);
});

// ── GET /api/auth/google/callback ─────────────────────────────────────────
// Google redirects here after the user approves
router.get("/google/callback", async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        return res.status(400).send(`
      <h2 style="font-family:sans-serif;color:#dc2626">❌ Google Auth Failed</h2>
      <p>${error}</p>
    `);
    }

    try {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
            return res.status(400).send(`
        <h2 style="font-family:sans-serif;color:#d97706">⚠️ No Refresh Token Returned</h2>
        <p>This usually means the app was already authorized.
           Go to <a href="https://myaccount.google.com/permissions">Google Account Permissions</a>,
           revoke access for your app, then <a href="/api/auth/google">try again</a>.</p>
      `);
        }

        // ── Write refresh token directly into .env ────────────────────────────
        const envPath = path.resolve(__dirname, "../.env");
        let envContent = fs.readFileSync(envPath, "utf8");

        envContent = envContent.includes("GOOGLE_REFRESH_TOKEN=")
            ? envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/, `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`)
            : envContent + `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`;

        fs.writeFileSync(envPath, envContent);
        process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;

        console.log("✅ Refresh token saved:", tokens.refresh_token);

        // ── Also set it live on the running process so no restart needed ──────
        process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;

        // ── Re-initialize the googleCalendar service with the new token ───────
        try {
            const calService = require("../services/googleCalendar");
            calService.reinitialize(tokens.refresh_token);
        } catch (_) { }

        res.send(`
      <html>
        <body style="font-family:sans-serif;background:#0f0f13;color:#f0f0f8;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
          <div style="text-align:center;padding:40px;background:#17171e;border-radius:16px;border:1px solid #2a2a38;max-width:420px">
            <div style="font-size:48px;margin-bottom:16px">✅</div>
            <h2 style="color:#16a34a;margin-bottom:8px">Google Calendar Connected!</h2>
            <p style="color:#8888a8;margin-bottom:24px">
              Interviews will now automatically create calendar events.<br>
              No restart needed — it's live immediately.
            </p>
            <a href="http://localhost:3000"
               style="background:#6c63ff;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              ← Back to App
            </a>
          </div>
        </body>
      </html>
    `);
    } catch (err) {
        console.error("Google OAuth callback error:", err.message);
        res.status(500).send(`
      <h2 style="font-family:sans-serif;color:#dc2626">❌ Error</h2>
      <p>${err.message}</p>
      <a href="/api/auth/google">Try again</a>
    `);
    }
});

// ── GET /api/auth/google/status ────────────────────────────────────────────
// Check if Google Calendar is connected
router.get("/google/status", (req, res) => {
    const connected = !!process.env.GOOGLE_REFRESH_TOKEN;
    res.json({
        connected,
        message: connected
            ? "Google Calendar is connected"
            : "Not connected. Visit /api/auth/google to connect.",
    });
});

module.exports = router;
