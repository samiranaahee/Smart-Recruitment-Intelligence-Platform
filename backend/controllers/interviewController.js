const Interview          = require("../models/Interview");
const Application        = require("../models/Application");
const Candidate          = require("../models/Candidate");
const { sendInterviewInvite }                        = require("../services/emailService");
const { createInterviewEvent, deleteInterviewEvent } = require("../services/googleCalendar");

// ── Formatter ──────────────────────────────────────────────────────────────
const formatInterview = (iv) => {
  const s = iv.scores || {};
  const vals = [s.technical, s.communication, s.problemSolving, s.cultural].filter(
    (v) => v != null
  );
  const evalScore =
    vals.length > 0
      ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      : null;

  return {
    _id:             iv._id,
    candidateName:   iv.candidateName   || iv.candidate?.name  || "",
    email:           iv.candidate?.email || "",
    interviewerName: iv.interviewerName || "",
    jobTitle:        iv.jobTitle        || iv.application?.job?.title || "",
    date: iv.scheduledAt
      ? new Date(iv.scheduledAt).toISOString().split("T")[0]
      : "",
    time: iv.scheduledAt
      ? new Date(iv.scheduledAt).toTimeString().slice(0, 5)
      : "",
    type:            iv.type,
    status:          iv.status,
    evalScore,
    evalNotes:       iv.feedback || "",
    meetLink:        iv.meetLink,
    calendarEventId: iv.calendarEventId,
    calendarLink:    iv.calendarLink,
    scores:          iv.scores,
    recommendation:  iv.recommendation,
    notes:           iv.notes,
  };
};

// ── POST /api/interviews ───────────────────────────────────────────────────

const scheduleInterview = async (req, res) => {
  try {
    const {
      candidateName,
      jobTitle,
      interviewerName,
      date,
      time,
      type,
      notes,
      meetLink: manualMeetLink,
      duration = 60,
      applicationId,
      candidateId,
      scheduledAt: rawScheduledAt,
    } = req.body;

    const scheduledAt =
      rawScheduledAt ||
      (date && time ? new Date(`${date}T${time}:00`) : new Date());

    // Resolve candidate + email
    let resolvedCandidateId = candidateId || null;
    let candidateEmail = null;

    if (!resolvedCandidateId && candidateName) {
      const found = await Candidate.findOne({
        name: { $regex: new RegExp(candidateName, "i") },
      });
      if (found) {
        resolvedCandidateId = found._id;
        candidateEmail = found.email;
      }
    }

    if (resolvedCandidateId && !candidateEmail) {
      const found = await Candidate.findById(resolvedCandidateId);
      if (found) candidateEmail = found.email;
    }

    // Resolve application
    let resolvedApplicationId = applicationId || null;
    if (!resolvedApplicationId && resolvedCandidateId) {
      const app = await Application.findOne({
        candidate: resolvedCandidateId,
        company: req.company.id,
      }).sort({ createdAt: -1 });
      if (app) resolvedApplicationId = app._id;
    }

    // Google Calendar event
    let meetLink = manualMeetLink || null;
    let calendarEventId = null;
    let calendarLink = null;

    try {
      const calResult = await createInterviewEvent({
        candidateName:   candidateName   || "Candidate",
        candidateEmail:  candidateEmail  || "",
        jobTitle:        jobTitle        || "Position",
        interviewerName: interviewerName || "HR Team",
        scheduledAt,
        duration,
        type,
        notes,
      });
      meetLink = calResult.meetLink || meetLink;
      calendarEventId = calResult.eventId;
      calendarLink = calResult.htmlLink;
      console.log("✅ Calendar event created:", calendarLink);
    } catch (calErr) {
      console.warn("⚠️  Google Calendar (non-fatal):", calErr.message);
    }

    // Save interview
    const interview = await Interview.create({
      application:    resolvedApplicationId || undefined,
      candidate:      resolvedCandidateId   || undefined,
      company:        req.company.id,
      candidateName,
      interviewerName,
      jobTitle,
      scheduledAt,
      duration,
      type,
      notes,
      meetLink,
      calendarEventId,
      calendarLink,
    });

    if (resolvedApplicationId) {
      await Application.findByIdAndUpdate(resolvedApplicationId, { stage: "Interview" });
    }

    // Send email invite
    if (candidateEmail) {
      try {
        const candidate = await Candidate.findById(resolvedCandidateId);
        if (candidate) await sendInterviewInvite(candidate, interview, { title: jobTitle });
        console.log("✅ Interview invite sent to:", candidateEmail);
      } catch (emailErr) {
        console.warn("⚠️  Email invite (non-fatal):", emailErr.message);
      }
    }

    res.status(201).json(formatInterview(interview));
  } catch (err) {
    console.error("❌ scheduleInterview:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── PATCH /api/interviews/:id/evaluate ────────────────────────────────────
const submitEvaluation = async (req, res) => {
  try {
    const { score, notes, scores, feedback, recommendation } = req.body;

    const resolvedScores = scores || {
      technical:      score,
      communication:  score,
      problemSolving: score,
      cultural:       score,
    };

    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, company: req.company.id },
      {
        scores:         resolvedScores,
        feedback:       feedback || notes || "",
        recommendation: recommendation ||
          (score >= 8 ? "Yes" : score >= 5 ? "Maybe" : "No"),
        status:         "Completed",
      },
      { new: true }
    )
      .populate("candidate", "name email")
      .populate({ path: "application", populate: { path: "job", select: "title" } });

    if (!interview) return res.status(404).json({ error: "Interview not found" });
    res.json(formatInterview(interview));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/interviews ────────────────────────────────────────────────────
const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ company: req.company.id })
      .populate("candidate", "name email")
      .populate({ path: "application", populate: { path: "job", select: "title" } })
      .sort({ scheduledAt: 1 });
    res.json(interviews.map(formatInterview));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { scheduleInterview, submitEvaluation, getInterviews };