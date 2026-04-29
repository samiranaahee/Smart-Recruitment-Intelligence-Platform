require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const connectDB = require("./config/db");

const app = express();

// ── Database ───────────────────────────────────────────────────────────────
connectDB();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────────────────────

// Company auth (register / login)
app.use("/api/auth",      require("./routes/authRoutes"));

// Google OAuth (no JWT protect — this IS the auth flow)
app.use("/api/google",         require("./routes/googleAuthRoutes"));

// Core resources
app.use("/api/candidates",   require("./routes/candidateRoutes"));
app.use("/api/jobs",         require("./routes/jobRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/interviews",   require("./routes/interviewRoutes"));

// Dashboard & analytics
app.use("/api/dashboard",    require("./routes/dashboardRoutes"));

// Enterprise intelligence
app.use("/api/enterprise",   require("./routes/enterpriseRoutes"));

// ── Health check ───────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "AI Recruiter API running ✅" }));

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));