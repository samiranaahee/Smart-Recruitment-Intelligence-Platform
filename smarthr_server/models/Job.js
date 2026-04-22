const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    job_title: { type: String, required: true },
    department: { type: String, default: "" },
    location: { type: String, default: "" },
    status: {
      type: String,
      enum: ["open", "closed", "paused"],
      default: "open",
    },
    budget: { type: Number, default: 0 },
    posted_date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Job", jobSchema);
