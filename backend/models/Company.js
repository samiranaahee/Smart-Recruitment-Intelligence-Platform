const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    industry: { type: String },
    size: { type: String },
    logo: { type: String },
    costPerHireTarget: { type: Number, default: 5000 },
    timeToHireTarget: { type: Number, default: 30 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", CompanySchema);