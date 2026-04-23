const Job = require("../models/Job");

// Map frontend field names → schema field names
const mapJobFields = (body) => ({
  title:         body.title,
  description:   body.description || body.title, // frontend has no desc field on list view
  // frontend sends "skills", schema stores "requiredSkills"
  requiredSkills: body.skills || body.requiredSkills || [],
  location:      body.location,
  // frontend sends "Full-Time" / "Part-Time", schema enum uses "Full-time" / "Part-time"
  type: (body.type || "Full-time").replace("-T", "-t").replace("-P", "-p"),
  status:        body.status || "Open",
  salaryMin:     body.salaryMin,
  salaryMax:     body.salaryMax,
  deadline:      body.deadline,
  department:    body.department, // stored as extra field, no harm
});

const createJob = async (req, res) => {
  try {
    const job = await Job.create({
      ...mapJobFields(req.body),
      company: req.company.id,
    });
    // Return in the shape the frontend expects
    res.status(201).json(formatJob(job));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ company: req.company.id }).sort({ createdAt: -1 });
    res.json(jobs.map(formatJob));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateJob = async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, company: req.company.id },
      mapJobFields(req.body),
      { new: true }
    );
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(formatJob(job));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    await Job.findOneAndDelete({ _id: req.params.id, company: req.company.id });
    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Shape returned to frontend: use "skills" and "applicants" keys App.js expects
const formatJob = (job) => ({
  _id:        job._id,
  title:      job.title,
  department: job.department || "",
  location:   job.location || "",
  type:       job.type,
  description:job.description,
  skills:     job.requiredSkills || [],      // frontend reads .skills
  status:     job.status === "Open" ? "Active" : job.status,
  applicants: job.applicants || 0,           // will be 0 until you join Applications
  createdAt:  job.createdAt,
});

module.exports = { createJob, getJobs, updateJob, deleteJob };