const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requiredSkills: [String],
    location: { type: String },
    type: { type: String, enum: ["Full-time", "Part-time", "Contract", "Remote"], default: "Full-time" },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    status: { type: String, enum: ["Open", "Closed", "Draft"], default: "Open" },
    deadline: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", JobSchema);