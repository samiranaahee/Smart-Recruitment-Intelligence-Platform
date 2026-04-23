const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { compareCandidates, getRecruiterPerformance, predictHiringSuccess } = require("../controllers/enterpriseController");

router.post("/compare", protect, compareCandidates);
router.get("/recruiters", protect, getRecruiterPerformance);
router.post("/predict", protect, predictHiringSuccess);

module.exports = router;