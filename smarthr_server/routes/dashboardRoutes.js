const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMIddleware");
const {
  getKPIs,
  getCostPerHire,
  getMonthlyTrends,
} = require("../controllers/dashboardController");

router.get("/kpis", protect, getKPIs);
router.get("/cost-per-hire", protect, getCostPerHire);
router.get("/monthly-trends", protect, getMonthlyTrends);

module.exports = router;
const Application = require("../models/Application");

router.post("/add-application", protect, async (req, res) => {
  try {
    const app = await Application.create({
      company_id: req.company.id,
      ...req.body,
    });
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});
