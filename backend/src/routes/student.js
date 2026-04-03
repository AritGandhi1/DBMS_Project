const express = require("express");

const authenticate = require("../middlewares/auth");
const {
	getStudentDetails,
	getStudentCourses,
	getStudentTranscript,
	getStudentResults,
	getStudentAttendance,
	getStudentInternships,
	applyInternship,
	getStudentPlacements,
	applyPlacement,
	getStudentTimetable,
	getEnrollmentOptions,
	enrollCourse,
	getCoursesForFeedback,
	submitFeedback,
	getStudentNotifications
} = require("../controllers/studentController");

const router = express.Router();

router.get("/me", authenticate, getStudentDetails);
router.get("/courses", authenticate, getStudentCourses);
router.get("/enrollment-options", authenticate, getEnrollmentOptions);
router.post("/enroll", authenticate, enrollCourse);
router.get("/transcript", authenticate, getStudentTranscript);
router.get("/results", authenticate, getStudentResults);
router.get("/attendance", authenticate, getStudentAttendance);
router.get("/internships", authenticate, getStudentInternships);
router.post("/internships/apply", authenticate, applyInternship);
router.get("/placements", authenticate, getStudentPlacements);
router.post("/placements/apply", authenticate, applyPlacement);
router.get("/timetable", authenticate, getStudentTimetable);
router.get("/notifications", authenticate, getStudentNotifications);
router.get("/feedback/courses", authenticate, getCoursesForFeedback);
router.post("/feedback/submit", authenticate, submitFeedback);

module.exports = router;
