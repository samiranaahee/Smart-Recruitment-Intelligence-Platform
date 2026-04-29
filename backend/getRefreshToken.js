/**
 * Run this ONCE to get your Google refresh token.
 *
 * Steps:
 *   1. Make sure your .env has GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
 *   2. Run:  node getRefreshToken.js
 *   3. Open the URL it prints in your browser
 *   4. Sign in with the Google account whose calendar you want to use
 *   5. Copy the "code" from the redirect URL and paste it when prompted
 *   6. Copy the printed refresh_token into your .env as GOOGLE_REFRESH_TOKEN
 */

require("dotenv").config();
const { google } = require("googleapis");
const readline = require("readline");

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // forces refresh token to be returned every time
});

console.log("\n──────────────────────────────────────────────────");
console.log("1. Open this URL in your browser:\n");
console.log(authUrl);
console.log("\n──────────────────────────────────────────────────");
console.log('2. After signing in, you\'ll be redirected to your REDIRECT_URI.');
console.log('   Copy the "code" query parameter from the URL.\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("3. Paste the code here: ", async (code) => {
    rl.close();
    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log("\n✅ Success! Add this to your .env:\n");
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log("\n──────────────────────────────────────────────────\n");
    } catch (err) {
        console.error("❌ Error getting token:", err.message);
    }
});
