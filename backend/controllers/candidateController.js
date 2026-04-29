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
    const { name, email, phone, jobId, candidateStatement } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const allowedDomains = ["gmail.com", "yahoo.com", "yahoo.co.uk", "g.bracu.ac.bd", "bracu.ac.bd", "outlook.com", "hotmail.com"];
    const emailDomain = email.split("@")[1]?.toLowerCase();
    
    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      return res.status(400).json({ error: "Please use a valid email" });
}

    if (!jobId) {
      return res.status(400).json({ error: "Please select a job to apply for" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Resume PDF is required" });
    }
    // Resolve job
    const resolvedJob = await Job.findById(jobId);
    if (!resolvedJob) {
      return res.status(404).json({ error: "Job not found" });
    }

    const jobDescription = resolvedJob.description || "";
    const statement      = candidateStatement || "";

    // Step 1: Parse resume PDF
    const resumeText = await parseResume(req.file.buffer);

    // Step 2: Run all AI tasks in parallel
    // All functions now receive candidateStatement for richer analysis
    const [skills, matchResult, gapResult, summary] = await Promise.all([
      extractSkills(resumeText),
      scoreSkillMatch(resumeText, jobDescription, statement),
      analyzeSkillGap(resumeText, jobDescription, statement),
      generateCandidateSummary(resumeText, statement),
    ]);

    // Step 3: Resolve company
    const resolvedCompanyId =
      resolvedJob.company ||
      req.company?.id     ||
      process.env.DEV_COMPANY_ID;

    // Step 4: Save candidate
    const candidate = new Candidate({
      name,
      email,
      phone,
      appliedJob:        resolvedJob._id,
      company:           resolvedCompanyId,
      resumeText,
      candidateStatement: statement,
      skills,
      skillMatchScore:   matchResult.score,
      matchReason:       matchResult.reason,
      missingSkills:     gapResult.missingSkills,
      skillGapAnalysis:  gapResult.explanation,
      aiSummary:         summary,
      jobDescription,
    });

    await candidate.save();

    // Step 5: Auto-create Application + increment job applicant count
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
      await Job.findByIdAndUpdate(resolvedJob._id, { $inc: { applicants: 1 } });
    }

    res.status(201).json({
      message: "Candidate processed successfully",
      candidate: {
        id:                candidate._id,
        name:              candidate.name,
        email:             candidate.email,
        phone:             candidate.phone,
        skills:            candidate.skills,
        skillMatchScore:   candidate.skillMatchScore,
        matchReason:       candidate.matchReason,
        missingSkills:     candidate.missingSkills,
        skillGapAnalysis:  candidate.skillGapAnalysis,
        aiSummary:         candidate.aiSummary,
        candidateStatement: statement,
        appliedJob:        resolvedJob.title,
        createdAt:         candidate.createdAt,
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
    const candidates = await Candidate.find({ company: req.company.id })
      .select("-resumeText -jobDescription")
      .populate("appliedJob", "title department requiredSkills")
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
      .populate("appliedJob", "title department location requiredSkills");
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

    if (candidate.appliedJob) {
      await Job.findByIdAndUpdate(candidate.appliedJob, { $inc: { applicants: -1 } });
    }
    await Application.deleteMany({ candidate: req.params.id });

    res.json({ message: "Candidate deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { uploadCandidate, getCandidates, getCandidateById, deleteCandidate };