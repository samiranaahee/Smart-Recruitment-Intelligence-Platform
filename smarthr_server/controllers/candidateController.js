const Application = require("../models/Application");

const getCandidates = async (req, res) => {
  try {
    const candidates = await Application.find({
      company_id: req.company.id,
    }).sort({ createdAt: -1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const addCandidate = async (req, res) => {
  try {
    const candidate = await Application.create({
      company_id: req.company.id,
      ...req.body,
    });
    res.status(201).json(candidate);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateCandidateStatus = async (req, res) => {
  try {
    const candidate = await Application.findOneAndUpdate(
      { _id: req.params.id, company_id: req.company.id },
      { ...req.body },
      { new: true },
    );
    if (!candidate) return res.status(404).json({ message: "Not found" });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    await Application.findOneAndDelete({
      _id: req.params.id,
      company_id: req.company.id,
    });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getCandidates,
  addCandidate,
  updateCandidateStatus,
  deleteCandidate,
};
