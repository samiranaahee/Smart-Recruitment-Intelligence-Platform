const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  // ── DEV BYPASS ──────────────────────────────────────────────────────────────
  // If no JWT_SECRET is set OR the header says "Bearer dev", inject a fake
  // company so every route works during local development without logging in.
  // Remove this block (or set NODE_ENV=production) before deploying.
  if (
    process.env.NODE_ENV !== "production" &&
    (!process.env.JWT_SECRET ||
      req.headers.authorization === "Bearer dev")
  ) {
    req.company = { id: process.env.DEV_COMPANY_ID || "000000000000000000000001" };
    return next();
  }
  // ────────────────────────────────────────────────────────────────────────────

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.company = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = { protect };