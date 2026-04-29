const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { scheduleInterview, submitEvaluation, getInterviews } = require("../controllers/interviewController");

router.post("/",               protect, scheduleInterview);
router.get("/",                protect, getInterviews);
router.put("/:id/evaluate",    protect, submitEvaluation);   // keep existing
router.patch("/:id/evaluate",  protect, submitEvaluation);   // App.js uses PATCH

module.exports = router;