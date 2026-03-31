const express = require("express");

const authenticate = require("../middlewares/auth");
const { register, login, me } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);

module.exports = router;
