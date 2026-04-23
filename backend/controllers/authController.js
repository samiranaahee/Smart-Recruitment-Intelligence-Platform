const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Company = require("../models/Company");

const register = async (req, res) => {
  try {
    const { companyName, email, password, industry, size } = req.body;

    const exists = await Company.findOne({ email });
    if (exists) return res.status(400).json({ error: "Company already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const company = await Company.create({ companyName, email, password: hashed, industry, size });

    const token = jwt.sign({ id: company._id, email: company.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ token, company: { id: company._id, companyName, email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const company = await Company.findOne({ email });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const match = await bcrypt.compare(password, company.password);
    if (!match) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ id: company._id, email: company.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, company: { id: company._id, companyName: company.companyName, email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login };