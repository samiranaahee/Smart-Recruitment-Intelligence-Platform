const mongoose = require("mongoose");

const InterviewSchema = new mongoose.Schema(
  {
    // Relational refs — optional so interviews can be created standalone
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
    candidate:   { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
    company:     { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },

    // Flat name fields — always stored so frontend can display them
    // even when no Candidate/Application document exists yet
    candidateName:   { type: String },
    interviewerName: { type: String },
    jobTitle:        { type: String },

    scheduledAt: { type: Date, required: true },
    duration:    { type: Number, default: 60 }, // minutes

    // Frontend sends: Technical, HR, Cultural Fit, Final
    type:    { type: String, default: "Technical" },
    status:  { type: String, enum: ["Scheduled", "Completed", "Cancelled"], default: "Scheduled" },

    meetLink:    { type: String }, // auto-filled from Google Calendar
    notes:       { type: String },

    // Google Calendar fields
    calendarEventId: { type: String }, // used to delete/update event later
    calendarLink:    { type: String }, // link to open event in Google Calendar

    // Evaluation
    scores: {
      technical:      { type: Number, min: 0, max: 10 },
      communication:  { type: Number, min: 0, max: 10 },
      problemSolving: { type: Number, min: 0, max: 10 },
      cultural:       { type: Number, min: 0, max: 10 },
    },
    feedback:       { type: String },
    recommendation: { type: String, enum: ["Strong Yes", "Yes", "Maybe", "No", "Strong No"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", InterviewSchema);