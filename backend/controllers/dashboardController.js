const Application = require("../models/Application");
const mongoose = require("mongoose");

// ================= HIRING FUNNEL - KPI CONTROLLER =================
const getKPIs = async (req, res) => {
  try {
    const companyId = req.company?.id;

    // Build match filter - include company filter if available
    const matchFilter = companyId
      ? { company: new mongoose.Types.ObjectId(companyId) }
      : {};

    const applications = await Application.find(matchFilter);

    const total_applicants = applications.length;
    const total_interviews = applications.filter(
      (a) => a.stage === "Interview",
    ).length;
    const total_offers = applications.filter(
      (a) => a.stage === "Offered",
    ).length;
    const total_hired = applications.filter((a) => a.stage === "Hired").length;

    // Calculate average time to hire
    const hiredWithDates = applications.filter(
      (a) => a.stage === "Hired" && a.hiredAt && a.appliedAt,
    );
    const avg_time_to_hire =
      hiredWithDates.length > 0
        ? (
            hiredWithDates.reduce((sum, a) => {
              const diff =
                (new Date(a.hiredAt) - new Date(a.appliedAt)) /
                (1000 * 60 * 60 * 24);
              return sum + diff;
            }, 0) / hiredWithDates.length
          ).toFixed(1)
        : 0;

    // Calculate rates
    const interview_rate =
      total_applicants > 0
        ? ((total_interviews / total_applicants) * 100).toFixed(1)
        : 0;

    const offer_rate =
      total_interviews > 0
        ? ((total_offers / total_interviews) * 100).toFixed(1)
        : 0;

    const total_cost = applications.reduce(
      (sum, a) => sum + (a.costIncurred || 0),
      0,
    );

    const cost_per_hire =
      total_hired > 0 ? (total_cost / total_hired).toFixed(2) : 0;

    res.json({
      total_applicants,
      total_interviews,
      total_offers,
      total_hired,
      avg_time_to_hire,
      interview_rate: `${interview_rate}%`,
      offer_rate: `${offer_rate}%`,
      cost_per_hire,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= MONTHLY HIRING TRENDS CONTROLLER =================
const getMonthlyTrends = async (req, res) => {
  try {
    const companyId = req.company?.id;

    // Build match filter - include company filter if available
    const matchFilter = companyId
      ? {
          company: new mongoose.Types.ObjectId(companyId),
        }
      : {};

    const trends = await Application.aggregate([
      {
        $match: matchFilter,
      },
      {
        $group: {
          _id: {
            year: { $year: "$appliedAt" },
            month: { $month: "$appliedAt" },
          },
          total_applications: { $sum: 1 },
          total_hired: {
            $sum: { $cond: [{ $eq: ["$stage", "Hired"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: "$_id.month" },
              "/",
              { $toString: "$_id.year" },
            ],
          },
          total_applications: 1,
          total_hired: 1,
        },
      },
    ]);

    res.json(trends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= COST PER HIRE CONTROLLER =================
const getCostPerHire = async (req, res) => {
  try {
    const companyId = req.company?.id;

    const matchFilter = companyId
      ? { company: new mongoose.Types.ObjectId(companyId) }
      : {};

    const applications = await Application.find(matchFilter);

    const total_cost = applications.reduce(
      (sum, a) => sum + (a.costIncurred || 0),
      0,
    );
    const total_hired = applications.filter((a) => a.stage === "Hired").length;
    const cost_per_hire =
      total_hired > 0 ? (total_cost / total_hired).toFixed(2) : 0;

    res.json({ total_cost, total_hired, cost_per_hire });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { getKPIs, getMonthlyTrends, getCostPerHire };
