const Company = require("../models/Company");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// POST /api/auth/register
const registerCompany = async (req, res) => {
  const { company_name, email, password } = req.body;

  try {
    const exists = await Company.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Company already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const company = await Company.create({
      company_name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: company._id, email: company.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.status(201).json({
      company: {
        id: company._id,
        company_name: company.company_name,
        email: company.email,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/login
const loginCompany = async (req, res) => {
  const { email, password } = req.body;

  try {
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: company._id, email: company.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.json({
      company: {
        id: company._id,
        company_name: company.company_name,
        email: company.email,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerCompany, loginCompany };
