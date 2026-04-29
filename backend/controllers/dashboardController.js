const Application = require("../models/Application");

// ================= KPI CONTROLLER =================
const getKPIs = async (req, res) => {
  try {
    // TEMP: no auth yet → don't use req.company
    const total = await Application.countDocuments({});
    const shortlisted = await Application.countDocuments({ stage: "Shortlisted" });
    const interviews = await Application.countDocuments({ stage: "Interview" });
    const offered = await Application.countDocuments({ stage: "Offered" });
    const hired = await Application.countDocuments({ stage: "Hired" });

    const hiredApps = await Application.find({
      stage: "Hired",
      hiredAt: { $exists: true },
    });

    const avgTimeToHire = hiredApps.length
      ? Math.round(
          hiredApps.reduce(
            (acc, a) =>
              acc +
              (new Date(a.hiredAt) - new Date(a.appliedAt)) /
                (1000 * 60 * 60 * 24),
            0
          ) / hiredApps.length
        )
      : 0;

    const totalCost = hiredApps.reduce(
      (acc, a) => acc + (a.costIncurred || 0),
      0
    );

    const costPerHire = hired > 0 ? Math.round(totalCost / hired) : 0;

    res.json({
      totalApplicants: total,
      shortlisted,
      interviews,
      offered,
      hired,
      interviewRate: total > 0 ? Math.round((interviews / total) * 100) : 0,
      offerRate: total > 0 ? Math.round((offered / total) * 100) : 0,
      hireRate: total > 0 ? Math.round((hired / total) * 100) : 0,
      timeToHire: avgTimeToHire, // match frontend
      costPerHire,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= TRENDS CONTROLLER =================
const getMonthlyTrends = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trends = await Application.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          applied: { $sum: 1 },
          hired: {
            $sum: { $cond: [{ $eq: ["$stage", "Hired"] }, 1, 0] },
          },
          offered: {
            $sum: { $cond: [{ $eq: ["$stage", "Offered"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getKPIs, getMonthlyTrends };