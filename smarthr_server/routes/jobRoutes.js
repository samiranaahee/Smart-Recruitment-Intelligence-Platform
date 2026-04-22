const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getJobs, addJob, deleteJob } = require("../controllers/jobController");

router.get("/", protect, getJobs);
router.post("/", protect, addJob);
router.delete("/:id", protect, deleteJob);

module.exports = router;
