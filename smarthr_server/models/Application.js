const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    candidate_name: { type: String },
    job_title: { type: String },
    status: {
      type: String,
      enum: [
        "applied",
        "shortlisted",
        "interview",
        "offered",
        "hired",
        "rejected",
      ],
      default: "applied",
    },
    hiring_cost: { type: Number, default: 0 },
    applied_date: { type: Date, default: Date.now },
    hired_date: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Candidate", applicationSchema);
