const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    stage: {
      type: String,
      enum: ["Applied", "Shortlisted", "Interview", "Offered", "Hired", "Rejected"],
      default: "Applied",
    },
    appliedAt: { type: Date, default: Date.now },
    hiredAt: { type: Date },
    offeredAt: { type: Date },
    rejectionReason: { type: String },
    notes: { type: String },
    costIncurred: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", ApplicationSchema);