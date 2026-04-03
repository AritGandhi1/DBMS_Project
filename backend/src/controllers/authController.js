const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const env = require("../config/env");
const {
  createStudentUser,
  findUserForLogin,
  findStudentByCollegeEmail,
  findStudentById
} = require("../services/userStore");

function buildUserResponse(user) {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email
  };
}

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.jwtSecret, {
    expiresIn: "1h"
  });
}

async function register(req, res, next) {
  try {
    const { studentId, name, batch, email, password, branch, personalEmail, phone, dob } = req.body;
    const normalizedStudentId = String(studentId || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedBranch = String(branch || "").trim();
    const normalizedPersonalEmail = personalEmail ? String(personalEmail).trim().toLowerCase() : null;
    const normalizedPhone = phone ? String(phone).trim() : null;
    const normalizedDob = dob ? String(dob).trim() : null;
    const batchNumber = Number(batch);

    if (!normalizedStudentId || !name || !batch || !normalizedEmail || !password || !normalizedBranch) {
      const error = new Error("studentId, name, batch, email, branch, and password are required");
      error.status = 400;
      throw error;
    }

    if (Number.isNaN(batchNumber)) {
      const error = new Error("batch must be a valid number");
      error.status = 400;
      throw error;
    }

    if (String(password).length < 6) {
      const error = new Error("password must be at least 6 characters");
      error.status = 400;
      throw error;
    }

    const [existingStudent, existingEmail] = await Promise.all([
      findStudentById(normalizedStudentId),
      findStudentByCollegeEmail(normalizedEmail)
    ]);

    if (existingStudent) {
      const error = new Error("studentId is already registered");
      error.status = 409;
      throw error;
    }

    if (existingEmail) {
      const error = new Error("email is already registered");
      error.status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await createStudentUser({
      studentId: normalizedStudentId,
      name,
      batch: batchNumber,
      email: normalizedEmail,
      passwordHash,
      branch: normalizedBranch,
      personalEmail: normalizedPersonalEmail,
      phone: normalizedPhone,
      dob: normalizedDob
    });
    const token = signAccessToken(user);

    res.status(201).json({
      message: "registered",
      token,
      user: buildUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      const error = new Error("userId and password are required");
      error.status = 400;
      throw error;
    }

    const user = await findUserForLogin(userId);
    if (!user) {
      const error = new Error("invalid credentials");
      error.status = 401;
      throw error;
    }

    const providedPassword = String(password);
    const storedPassword = String(user.passwordHash || "");

    let isMatch = false;
    if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
      isMatch = await bcrypt.compare(providedPassword, storedPassword);
    } else {
      isMatch = providedPassword === storedPassword;
    }

    if (!isMatch) {
      const error = new Error("invalid credentials");
      error.status = 401;
      throw error;
    }

    const token = signAccessToken(user);

    res.status(200).json({
      message: "logged in",
      token,
      user: buildUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  res.status(200).json({
    user: buildUserResponse(req.user)
  });
}

module.exports = {
  register,
  login,
  me
};
