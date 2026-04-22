const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support multiple token payload shapes so older tokens still work.
    const companyId = decoded?.id || decoded?._id || decoded?.companyId;
    if (!companyId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.company = {
      ...decoded,
      id: companyId,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = protect;
