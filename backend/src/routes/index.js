const express = require("express");

const healthRoute = require("./health");
const authRoute = require("./auth");
const studentRoute = require("./student");
const facultyRoute = require("./faculty");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

router.use("/health", healthRoute);
router.use("/auth", authRoute);
router.use("/student", studentRoute);
router.use("/faculty", facultyRoute);

module.exports = router;
