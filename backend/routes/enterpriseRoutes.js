const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  compareCandidates,
  getRecruiterPerformance,
  predictHiringSuccess,
  addRecruiter,
  deleteRecruiter,
  sendNotification,
} = require("../controllers/enterpriseController");

router.post("/compare",         protect, compareCandidates);
router.get("/recruiters",       protect, getRecruiterPerformance);
router.post("/recruiters",      protect, addRecruiter);
router.delete("/recruiters/:id",protect, deleteRecruiter);
router.post("/predict",         protect, predictHiringSuccess);
router.post("/notify",          protect, sendNotification);

module.exports = router;