const express = require("express");

const healthRoute = require("./health");
const authRoute = require("./auth");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

router.use("/health", healthRoute);
router.use("/auth", authRoute);

module.exports = router;
