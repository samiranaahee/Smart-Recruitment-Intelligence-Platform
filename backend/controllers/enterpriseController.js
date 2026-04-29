const Candidate  = require("../models/Candidate");
const Interview  = require("../models/Interview");
const Recruiter  = require("../models/Recruiter");
const { sendInterviewInvite, sendOfferEmail, sendRejectionEmail } = require("../services/emailService");

// ── POST /api/enterprise/compare ──────────────────────────────────────────
const compareCandidates = async (req, res) => {
  try {
    const { candidateIds } = req.body;
    const candidates = await Candidate.find({ _id: { $in: candidateIds } }).select("-resumeText");
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/enterprise/recruiters ────────────────────────────────────────
const getRecruiterPerformance = async (req, res) => {
  try {
    const recruiters = await Recruiter.find({ company: req.company.id });
    res.json(recruiters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/enterprise/recruiters ───────────────────────────────────────
const addRecruiter = async (req, res) => {
  try {
    const { name, email, role, hiresMade, avgTimeToHire, successRate } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const existing = await Recruiter.findOne({ email, company: req.company.id });
    if (existing) {
      return res.status(400).json({ error: "Recruiter with this email already exists" });
    }

    // Calculate efficiency score from provided stats
    const hires   = Number(hiresMade)    || 0;
    const tth     = Number(avgTimeToHire) || 0;
    const success = Number(successRate)  || 0;

    // Efficiency: weighted average of success rate + speed bonus
    const speedBonus    = tth > 0 ? Math.max(0, 100 - tth * 2) : 50;
    const efficiencyScore = Math.min(100, Math.round(success * 0.7 + speedBonus * 0.3));

    const recruiter = await Recruiter.create({
      company: req.company.id,
      name,
      email,
      role:           role          || "Recruiter",
      hiresMade:      hires,
      avgTimeToHire:  tth,
      successRate:    success,
      efficiencyScore,
    });

    res.status(201).json(recruiter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE /api/enterprise/recruiters/:id ─────────────────────────────────
const deleteRecruiter = async (req, res) => {
  try {
    await Recruiter.findOneAndDelete({ _id: req.params.id, company: req.company.id });
    res.json({ message: "Recruiter removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/enterprise/predict ──────────────────────────────────────────
const predictHiringSuccess = async (req, res) => {
  try {
    const { candidateId } = req.body;
    const candidate  = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });

    const interviews = await Interview.find({ candidate: candidateId });

    const avgInterviewScore = interviews.length
      ? interviews.reduce((acc, iv) => {
          const vals = Object.values(iv.scores || {}).filter(Boolean);
          return acc + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
        }, 0) / interviews.length
      : 0;

    const skillScore  = candidate.skillMatchScore || 0;
    const probability = Math.min(100, Math.round(skillScore * 0.6 + avgInterviewScore * 4));

    res.json({
      candidate:                candidate.name,
      skillMatchScore:          skillScore,
      avgInterviewScore:        Math.round(avgInterviewScore * 10) / 10,
      hiringSuccessProbability: probability,
      recommendation:
        probability >= 70 ? "Strong Hire" :
        probability >= 50 ? "Possible Hire" : "Not Recommended",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/enterprise/notify ───────────────────────────────────────────
const sendNotification = async (req, res) => {
  try {
    const { to, type, candidateName, jobTitle, message } = req.body;
    const fakeCandidate = { name: candidateName, email: to };
    const fakeJob       = { title: jobTitle };

    if (type === "interview") {
      await sendInterviewInvite(fakeCandidate, { notes: message }, fakeJob);
    } else if (type === "offer") {
      await sendOfferEmail(fakeCandidate, fakeJob);
    } else if (type === "rejection") {
      await sendRejectionEmail(fakeCandidate, fakeJob);
    }

    res.json({ message: "Email sent successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  compareCandidates,
  getRecruiterPerformance,
  addRecruiter,
  deleteRecruiter,
  predictHiringSuccess,
  sendNotification,
};