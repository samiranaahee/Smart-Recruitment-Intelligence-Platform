const Candidate   = require("../models/Candidate");
const Application = require("../models/Application");
const Job         = require("../models/Job");
const { parseResume } = require("../utils/parser");
const {
  extractSkills,
  scoreSkillMatch,
  analyzeSkillGap,
  generateCandidateSummary,
} = require("../services/aiService");

// POST /api/candidates/upload
const uploadCandidate = async (req, res) => {
  try {
    const { name, email, phone, jobDescription, jobId, companyId } = req.body;

    if (!name || !email || !jobDescription) {
      return res.status(400).json({ error: "name, email, and jobDescription are required" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Resume PDF is required" });
    }

    // Resolve job — use jobId if provided, otherwise find by description match
    let resolvedJob = null;
    if (jobId) {
      resolvedJob = await Job.findById(jobId);
    }

    // Use job's description for AI scoring if no custom description provided
    const descriptionForAI = jobDescription || resolvedJob?.description || "";

    // Step 1: Parse resume PDF
    const resumeText = await parseResume(req.file.buffer);

    // Step 2: Run all AI tasks in parallel
    const [skills, matchResult, gapResult, summary] = await Promise.all([
      extractSkills(resumeText),
      scoreSkillMatch(resumeText, descriptionForAI),
      analyzeSkillGap(resumeText, descriptionForAI),
      generateCandidateSummary(resumeText),
    ]);

    // Step 3: Resolve company — from jobId or from companyId param
    const resolvedCompanyId =
      companyId ||
      resolvedJob?.company ||
      req.company?.id ||       // set by authMiddleware in protected routes
      process.env.DEV_COMPANY_ID;

    // Step 4: Save candidate
    const candidate = new Candidate({
      name,
      email,
      phone,
      appliedJob:       resolvedJob?._id,
      company:          resolvedCompanyId,
      resumeText,
      skills,
      skillMatchScore:  matchResult.score,
      matchReason:      matchResult.reason,
      missingSkills:    gapResult.missingSkills,
      skillGapAnalysis: gapResult.explanation,
      aiSummary:        summary,
      jobDescription,
    });

    await candidate.save();

    // Step 5: Auto-create Application record so they appear in Pipeline
    if (resolvedJob && resolvedCompanyId) {
      // Avoid duplicate applications (same candidate + same job)
      const existing = await Application.findOne({
        candidate: candidate._id,
        job:       resolvedJob._id,
      });

      if (!existing) {
        await Application.create({
          candidate: candidate._id,
          job:       resolvedJob._id,
          company:   resolvedCompanyId,
          stage:     "Applied",
          appliedAt: new Date(),
        });
      }
    }

    res.status(201).json({
      message: "Candidate processed successfully",
      candidate: {
        id:               candidate._id,
        name:             candidate.name,
        email:            candidate.email,
        phone:            candidate.phone,
        skills:           candidate.skills,
        skillMatchScore:  candidate.skillMatchScore,
        matchReason:      candidate.matchReason,
        missingSkills:    candidate.missingSkills,
        skillGapAnalysis: candidate.skillGapAnalysis,
        aiSummary:        candidate.aiSummary,
        appliedJob:       resolvedJob?.title || null,
        createdAt:        candidate.createdAt,
      },
    });
  } catch (err) {
    console.error("uploadCandidate error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/candidates
const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .select("-resumeText -jobDescription")
      .populate("appliedJob", "title department")
      .sort({ skillMatchScore: -1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/candidates/:id
const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .select("-resumeText")
      .populate("appliedJob", "title department location");
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/candidates/:id
const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });
    // Also remove their applications
    await Application.deleteMany({ candidate: req.params.id });
    res.json({ message: "Candidate deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { uploadCandidate, getCandidates, getCandidateById, deleteCandidate };