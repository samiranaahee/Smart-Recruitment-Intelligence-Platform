const Application = require("../models/Application");
const { sendOfferEmail, sendRejectionEmail } = require("../services/emailService");

// Shape one application into the flat object App.js expects
const formatApp = (app) => ({
  _id:           app._id,
  // frontend reads candidateName / jobTitle directly
  candidateName: app.candidate?.name  || app.candidate || "",
  email:         app.candidate?.email || "",
  jobTitle:      app.job?.title       || app.job        || "",
  stage:         app.stage,
  appliedAt:     app.appliedAt,
  notes:         app.notes,
});

const getApplications = async (req, res) => {
  try {
    const apps = await Application.find({ company: req.company.id })
      .populate("candidate", "name email skills skillMatchScore aiSummary")
      .populate("job", "title requiredSkills")
      .sort({ createdAt: -1 });
    res.json(apps.map(formatApp));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const app = await Application.findOne({
      _id: req.params.id,
      company: req.company.id,
    })
      .populate("candidate")
      .populate("job");

    if (!app) return res.status(404).json({ error: "Application not found" });

    app.stage = stage;
    if (stage === "Hired")    app.hiredAt   = new Date();
    if (stage === "Offered") {
      app.offeredAt = new Date();
      // Guard: email service may not be configured yet
      try { await sendOfferEmail(app.candidate, app.job); } catch (_) {}
    }
    if (stage === "Rejected") {
      try { await sendRejectionEmail(app.candidate, app.job); } catch (_) {}
    }

    await app.save();
    res.json(formatApp(app));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPipeline = async (req, res) => {
  try {
    const stages = ["Applied", "Shortlisted", "Interview", "Offered", "Hired", "Rejected"];
    const pipeline = {};
    for (const stage of stages) {
      const docs = await Application.find({ company: req.company.id, stage })
        .populate("candidate", "name email skillMatchScore")
        .populate("job", "title");
      pipeline[stage] = docs.map(formatApp);
    }
    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getApplications, updateStage, getPipeline };