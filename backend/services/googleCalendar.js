const { google } = require("googleapis");

const getOAuth2Client = () => {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) return null;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  client.setCredentials({ refresh_token: refreshToken });

  // Auto-persist any new refresh tokens
  client.on("tokens", (tokens) => {
    if (tokens.refresh_token) {
      process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
      try {
        const fs   = require("fs");
        const path = require("path");
        const envPath = path.resolve(__dirname, "../../.env");
        if (fs.existsSync(envPath)) {
          let content = fs.readFileSync(envPath, "utf8");
          content = content.replace(
            /GOOGLE_REFRESH_TOKEN=.*/,
            `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`
          );
          fs.writeFileSync(envPath, content);
        }
      } catch (_) {}
    }
  });

  return client;
};

// Called by OAuth callback after sign-in — updates the env var live
const reinitialize = (refreshToken) => {
  process.env.GOOGLE_REFRESH_TOKEN = refreshToken;
  console.log("✅ Google Calendar client re-initialized");
};

const createInterviewEvent = async ({
  candidateName,
  candidateEmail,
  jobTitle,
  interviewerName,
  scheduledAt,
  duration = 60,
  type = "Technical",
  notes = "",
}) => {
  // Always build fresh from process.env so it works after reinitialize()
  const auth = getOAuth2Client();
  if (!auth) {
    throw new Error(
      "Google Calendar not connected. Visit http://localhost:5000/api/auth/google to connect."
    );
  }

  const calendar  = google.calendar({ version: "v3", auth });
  const startTime = new Date(scheduledAt);
  const endTime   = new Date(startTime.getTime() + duration * 60 * 1000);

  const attendees = [];
  if (candidateEmail && candidateEmail.includes("@")) {
    attendees.push({ email: candidateEmail, displayName: candidateName });
  }

  const event = {
    summary: `Interview: ${candidateName} — ${jobTitle}`,
    description: [
      `<b>Position:</b> ${jobTitle}`,
      `<b>Interview Type:</b> ${type}`,
      `<b>Candidate:</b> ${candidateName}`,
      `<b>Interviewer:</b> ${interviewerName || "TBD"}`,
      notes ? `<b>Notes:</b> ${notes}` : "",
    ]
      .filter(Boolean)
      .join("<br>"),
    start: { dateTime: startTime.toISOString(), timeZone: "Asia/Dhaka" },
    end:   { dateTime: endTime.toISOString(),   timeZone: "Asia/Dhaka" },
    attendees,
    conferenceData: {
      createRequest: {
        requestId: `interview-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId:            "primary",
    resource:              event,
    conferenceDataVersion: 1,
    sendUpdates:           "all",
  });

  const { id: eventId, hangoutLink: meetLink, htmlLink } = response.data;
  return { eventId, meetLink: meetLink || null, htmlLink };
};

const deleteInterviewEvent = async (eventId) => {
  if (!eventId) return;
  const auth = getOAuth2Client();
  if (!auth) return;
  try {
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({
      calendarId:  "primary",
      eventId,
      sendUpdates: "all",
    });
  } catch (err) {
    console.warn("Could not delete calendar event:", err.message);
  }
};

module.exports = { createInterviewEvent, deleteInterviewEvent, reinitialize };