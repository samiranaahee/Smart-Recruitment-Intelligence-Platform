const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getCandidates,
  addCandidate,
  updateCandidateStatus,
  deleteCandidate,
} = require("../controllers/candidateController");

router.get("/", protect, getCandidates);
router.post("/", protect, addCandidate);
router.put("/:id", protect, updateCandidateStatus);
router.delete("/:id", protect, deleteCandidate);

module.exports = router;
