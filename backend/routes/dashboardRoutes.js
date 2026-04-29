const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getKPIs, getMonthlyTrends } = require("../controllers/dashboardController");

router.get("/kpis", protect, getKPIs);
router.get("/trends", protect, getMonthlyTrends);

module.exports = router;