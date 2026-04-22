const express = require("express");
const router = express.Router();
const {
  registerCompany,
  loginCompany,
} = require("../controllers/authController");

router.post("/register", registerCompany);
router.post("/login", loginCompany);

module.exports = router;
