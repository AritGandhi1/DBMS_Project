const express = require("express");

const healthRoute = require("./health");
const authRoute = require("./auth");
const studentRoute = require("./student");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

router.use("/health", healthRoute);
router.use("/auth", authRoute);
router.use("/student", studentRoute);

module.exports = router;
