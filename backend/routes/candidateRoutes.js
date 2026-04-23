const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const { protect } = require("../middleware/authMiddleware");
const {
  uploadCandidate,
  getCandidates,
  getCandidateById,
  deleteCandidate,
} = require("../controllers/candidateController");
const Job = require("../models/Job");

const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── Public: candidate-facing routes (no auth required) ────────────────────

// GET /api/candidates/jobs — returns open jobs for the application dropdown
// Public so candidates can see jobs without logging in
router.get("/jobs", async (req, res) => {
  try {
    const companyId = req.query.companyId || process.env.DEV_COMPANY_ID;
    const jobs = await Job.find({ company: companyId, status: "Open" })
      .select("title department location type requiredSkills description")
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/candidates/upload — resume upload (protected so company is known)
router.post("/upload", protect, upload.single("resume"), uploadCandidate);

// ── Protected: HR-facing routes ───────────────────────────────────────────
router.get("/",    protect, getCandidates);
router.get("/:id", protect, getCandidateById);
router.delete("/:id", protect, deleteCandidate);

module.exports = router;