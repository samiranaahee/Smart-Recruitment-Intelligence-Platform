require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const connectDB = require("./config/db");

const candidateRoutes   = require("./routes/candidateRoutes");
const authRoutes        = require("./routes/authRoutes");
const dashboardRoutes   = require("./routes/dashboardRoutes");
const jobRoutes         = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const interviewRoutes   = require("./routes/interviewRoutes");
const enterpriseRoutes  = require("./routes/enterpriseRoutes");
const googleAuthRoutes  = require("./routes/googleAuthRoutes"); // ← new

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/candidates",   candidateRoutes);
app.use("/api/auth",         authRoutes);
app.use("/api/auth",         googleAuthRoutes); // ← /api/auth/google + /api/auth/google/callback
app.use("/api/dashboard",    dashboardRoutes);
app.use("/api/jobs",         jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews",   interviewRoutes);
app.use("/api/enterprise",   enterpriseRoutes);

app.get("/", (req, res) => res.send("AI Recruiter API is running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));