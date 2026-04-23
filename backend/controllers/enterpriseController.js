const Candidate = require("../models/Candidate");
const Application = require("../models/Application");
const Recruiter = require("../models/Recruiter");
const Interview = require("../models/Interview");

const compareCandidates = async (req, res) => {
  try {
    const { candidateIds } = req.body;
    const candidates = await Candidate.find({ _id: { $in: candidateIds } })
      .select("-resumeText");
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRecruiterPerformance = async (req, res) => {
  try {
    const recruiters = await Recruiter.find({ company: req.company.id });
    res.json(recruiters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const predictHiringSuccess = async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;
    const candidate = await Candidate.findById(candidateId);
    const interviews = await Interview.find({ candidate: candidateId });

    const avgInterviewScore = interviews.length
      ? interviews.reduce((acc, i) => {
          const scores = Object.values(i.scores || {}).filter(Boolean);
          return acc + (scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
        }, 0) / interviews.length
      : 0;

    const skillScore = candidate.skillMatchScore || 0;
    const probability = Math.min(100, Math.round((skillScore * 0.6) + (avgInterviewScore * 4)));

    res.json({
      candidate: candidate.name,
      skillMatchScore: skillScore,
      avgInterviewScore: Math.round(avgInterviewScore * 10) / 10,
      hiringSuccessProbability: probability,
      recommendation: probability >= 70 ? "Strong Hire" : probability >= 50 ? "Possible Hire" : "Not Recommended",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { compareCandidates, getRecruiterPerformance, predictHiringSuccess };