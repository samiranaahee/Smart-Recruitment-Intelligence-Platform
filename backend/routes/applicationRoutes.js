const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getApplications, updateStage, getPipeline } = require("../controllers/applicationController");

router.get("/",              protect, getApplications);
router.get("/pipeline",      protect, getPipeline);
router.put("/:id/stage",     protect, updateStage);   // keep existing
router.patch("/:id/stage",   protect, updateStage);   // App.js uses PATCH

module.exports = router;
