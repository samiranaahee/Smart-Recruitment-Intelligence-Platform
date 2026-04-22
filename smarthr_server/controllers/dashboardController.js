const Application = require("../models/Application");

// GET /api/dashboard/kpis
const getKPIs = async (req, res) => {
  const companyId = req.company.id;

  try {
    const applications = await Application.find({ company_id: companyId });

    const total_applicants = applications.length;
    const total_interviews = applications.filter(
      (a) => a.status === "interview",
    ).length;
    const total_offers = applications.filter(
      (a) => a.status === "offered",
    ).length;
    const total_hired = applications.filter((a) => a.status === "hired").length;

    const hiredWithDates = applications.filter(
      (a) => a.status === "hired" && a.hired_date && a.applied_date,
    );
    const avg_time_to_hire =
      hiredWithDates.length > 0
        ? (
            hiredWithDates.reduce((sum, a) => {
              const diff =
                (new Date(a.hired_date) - new Date(a.applied_date)) /
                (1000 * 60 * 60 * 24);
              return sum + diff;
            }, 0) / hiredWithDates.length
          ).toFixed(1)
        : 0;

    const interview_rate =
      total_applicants > 0
        ? ((total_interviews / total_applicants) * 100).toFixed(1)
        : 0;

    const offer_rate =
      total_interviews > 0
        ? ((total_offers / total_interviews) * 100).toFixed(1)
        : 0;

    res.json({
      total_applicants,
      total_interviews,
      total_offers,
      total_hired,
      avg_time_to_hire,
      interview_rate: `${interview_rate}%`,
      offer_rate: `${offer_rate}%`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/dashboard/cost-per-hire
const getCostPerHire = async (req, res) => {
  const companyId = req.company.id;

  try {
    const applications = await Application.find({ company_id: companyId });

    const total_cost = applications.reduce(
      (sum, a) => sum + (a.hiring_cost || 0),
      0,
    );
    const total_hired = applications.filter((a) => a.status === "hired").length;
    const cost_per_hire =
      total_hired > 0 ? (total_cost / total_hired).toFixed(2) : 0;

    res.json({ total_cost, total_hired, cost_per_hire });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/dashboard/monthly-trends
const getMonthlyTrends = async (req, res) => {
  const companyId = req.company.id;

  try {
    const trends = await Application.aggregate([
      {
        $match: {
          company_id:
            require("mongoose").Types.ObjectId.createFromHexString(companyId),
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$applied_date" },
            month: { $month: "$applied_date" },
          },
          total_applications: { $sum: 1 },
          total_hired: {
            $sum: { $cond: [{ $eq: ["$status", "hired"] }, 1, 0] },
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
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getKPIs, getCostPerHire, getMonthlyTrends };
