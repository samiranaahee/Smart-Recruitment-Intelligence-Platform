const mongoose = require("mongoose");

const RecruiterSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    jobsHandled: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
    hiresMade: { type: Number, default: 0 },
    avgTimeToHire: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recruiter", RecruiterSchema);