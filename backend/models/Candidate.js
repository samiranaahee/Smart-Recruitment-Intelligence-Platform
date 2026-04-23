const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, trim: true, lowercase: true },
    phone:    { type: String, trim: true },

    // Which job they applied for
    appliedJob: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    // Which company they applied to
    company:    { type: mongoose.Schema.Types.ObjectId, ref: "Company" },

    resumeText:       { type: String },
    skills:           { type: [String], default: [] },
    skillMatchScore:  { type: Number, min: 0, max: 100 },
    matchReason:      { type: String },
    missingSkills:    { type: [String], default: [] },
    skillGapAnalysis: { type: String },
    aiSummary:        { type: String },
    jobDescription:   { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Candidate", CandidateSchema);