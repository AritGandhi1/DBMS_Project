const express = require("express");

const authenticate = require("../middlewares/auth");
const {
	getStudentDetails,
	getStudentCourses,
	getStudentTranscript,
	getStudentResults,
	getStudentAttendance,
	getStudentExams,
	getStudentInternships,
	applyInternship,
	getStudentPlacements,
	applyPlacement,
	getStudentTimetable,
	getEnrollmentOptions,
	enrollCourse,
	getTAEnrollmentOptions,
	applyTAEnrollment,
	getCoursesForFeedback,
	submitFeedback,
	getStudentNotifications,
	submitLeaveApplication,
	getPastLeaveApplications,
	uploadResume,
	getStudentResumes,
	deleteResume,
	downloadResume
} = require("../controllers/studentController");

const router = express.Router();

router.get("/me", authenticate, getStudentDetails);
router.get("/courses", authenticate, getStudentCourses);
router.get("/enrollment-options", authenticate, getEnrollmentOptions);
router.post("/enroll", authenticate, enrollCourse);
router.get("/ta-enrollment-options", authenticate, getTAEnrollmentOptions);
router.post("/ta-enroll", authenticate, applyTAEnrollment);
router.get("/transcript", authenticate, getStudentTranscript);
router.get("/results", authenticate, getStudentResults);
router.get("/attendance", authenticate, getStudentAttendance);
router.get("/exams", authenticate, getStudentExams);
router.get("/internships", authenticate, getStudentInternships);
router.post("/internships/apply", authenticate, applyInternship);
router.get("/placements", authenticate, getStudentPlacements);
router.post("/placements/apply", authenticate, applyPlacement);
router.get("/timetable", authenticate, getStudentTimetable);
router.get("/notifications", authenticate, getStudentNotifications);
router.get("/feedback/courses", authenticate, getCoursesForFeedback);
router.post("/feedback/submit", authenticate, submitFeedback);
router.post("/leave-application/apply", authenticate, submitLeaveApplication);
router.get("/leave-application/past", authenticate, getPastLeaveApplications);

// Resume management routes
router.post("/resume/upload", authenticate, uploadResume);
router.get("/resume/list", authenticate, getStudentResumes);
router.post("/resume/delete", authenticate, deleteResume);
router.get("/resume/download/:resumeId", authenticate, downloadResume);

module.exports = router;
