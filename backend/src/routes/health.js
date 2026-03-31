const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV || "development",
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
