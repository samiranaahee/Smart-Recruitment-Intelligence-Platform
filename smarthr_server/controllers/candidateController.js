const Candidate = require("../models/Application");

const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find({
      company_id: req.company.id,
    }).sort({ createdAt: -1 });
    res.json(candidates);
  } catch (err) {
    console.error("Error fetching candidates:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

const addCandidate = async (req, res) => {
  try {
    const data = {
      company_id: req.company.id,
      ...req.body,
    };

    // Clean up empty date strings
    if (!data.applied_date || data.applied_date === "") {
      delete data.applied_date;
    }
    if (!data.hired_date || data.hired_date === "") {
      delete data.hired_date;
    }

    const candidates = await Candidate.create(data);
    res.status(201).json(candidates);
  } catch (err) {
    console.error("Error adding candidate:", err);
    if (err.code === 11000) {
      return res.status(409).json({
        message: "A candidate with the same unique fields already exists.",
      });
    }
    res.status(500).json({ message: err.message || "Server error" });
  }
};

const updateCandidateStatus = async (req, res) => {
  try {
    const candidates = await Candidate.findOneAndUpdate(
      { _id: req.params.id, company_id: req.company.id },
      { ...req.body },
      { new: true },
    );
    if (!candidates) return res.status(404).json({ message: "Not found" });
    res.json(candidates);
  } catch (err) {
    console.error("Error updating candidate:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    await Candidate.findOneAndDelete({
      _id: req.params.id,
      company_id: req.company.id,
    });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Error deleting candidate:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = {
  getCandidates,
  addCandidate,
  updateCandidateStatus,
  deleteCandidate,
};
