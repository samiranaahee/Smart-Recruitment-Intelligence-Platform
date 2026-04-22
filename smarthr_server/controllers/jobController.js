const Job = require("../models/Job");

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ company_id: req.company.id }).sort({
      createdAt: -1,
    });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const addJob = async (req, res) => {
  try {
    const job = await Job.create({
      company_id: req.company.id,
      ...req.body,
    });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteJob = async (req, res) => {
  try {
    await Job.findOneAndDelete({
      _id: req.params.id,
      company_id: req.company.id,
    });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getJobs, addJob, deleteJob };
