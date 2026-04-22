const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const jobRoutes = require("./routes/jobRoutes");
const Candidate = require("./models/Application");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/jobs", jobRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "SmartHR API is running ✅" });
});

const cleanupLegacyCandidateIndex = async () => {
  const legacyIndexName = "company_id_1_email_1_job_id_1";

  try {
    const indexes = await Candidate.collection.indexes();
    const hasLegacyIndex = indexes.some((idx) => idx.name === legacyIndexName);

    if (hasLegacyIndex) {
      await Candidate.collection.dropIndex(legacyIndexName);
      console.log(`Dropped legacy index: ${legacyIndexName}`);
    }
  } catch (err) {
    console.error("Failed to clean up legacy candidate index:", err.message);
  }
};

// Connect to MongoDB then start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected ✅");
    await cleanupLegacyCandidateIndex();
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
