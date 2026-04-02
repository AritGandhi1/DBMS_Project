const express = require("express");

const authenticate = require("../middlewares/auth");
const {
	getStudentDetails,
	getStudentCourses,
	getStudentTranscript,
	getStudentAttendance
} = require("../controllers/studentController");

const router = express.Router();

router.get("/me", authenticate, getStudentDetails);
router.get("/courses", authenticate, getStudentCourses);
router.get("/transcript", authenticate, getStudentTranscript);
router.get("/attendance", authenticate, getStudentAttendance);

module.exports = router;
