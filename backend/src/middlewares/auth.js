const jwt = require("jsonwebtoken");

const env = require("../config/env");
const { findUserByIdAndRole } = require("../services/userStore");

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("Missing or invalid authorization header");
    error.status = 401;
    return next(error);
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await findUserByIdAndRole(payload.sub, payload.role);

    if (!user) {
      const error = new Error("User not found");
      error.status = 401;
      return next(error);
    }

    req.user = user;
    return next();
  } catch (err) {
    const error = new Error("Invalid or expired token");
    error.status = 401;
    return next(error);
  }
}

module.exports = authenticate;
