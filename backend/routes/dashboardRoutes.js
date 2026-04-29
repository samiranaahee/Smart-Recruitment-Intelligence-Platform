const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getKPIs,
  getMonthlyTrends,
  getCostPerHire,
} = require("../controllers/dashboardController");

router.get("/kpis", protect, getKPIs);
router.get("/trends", protect, getMonthlyTrends);
router.get("/cost-per-hire", protect, getCostPerHire);

module.exports = router;
