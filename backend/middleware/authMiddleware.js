const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  // DEV BYPASS — remove before deploying
  if (process.env.NODE_ENV !== "production") {
    req.company = { id: process.env.DEV_COMPANY_ID || "000000000000000000000001" };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    req.company = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = { protect };