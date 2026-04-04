const express = require("express");

const authenticate = require("../middlewares/auth");
const {
	getFacultyDashboard,
	getFacultyCurrentCourses,
	getMarksForOffering,
	updateMarksForStudent,
	getAttendanceForOffering,
	updateAttendanceForStudent,
	markAttendanceSession,
	sendFacultyNotification,
	getFacultyNotificationFeed,
	getFacultyTAApplications,
	decideFacultyTAApplication,
	getFacultyLeaveApplications,
	decideFacultyLeaveApplication,
	getCdcInternshipManagement,
	createCdcInternshipOpening,
	decideCdcInternshipApplication,
	getCdcPlacementManagement,
	createCdcPlacementOpening,
	decideCdcPlacementApplication,
	getPicTtCourseTimetable,
	createPicTtCourseTimetable,
	updatePicTtCourseTimetable,
	getPicTtExamTimetable,
	createPicTtExamTimetable,
	updatePicTtExamTimetable,
	getHodCourseManagement,
	createHodCourse,
	updateHodCourse,
	deleteHodCourse,
	createHodCourseOffering,
	updateHodCourseOffering,
	deleteHodCourseOffering,
	addHodCoursePrerequisite,
	updateHodCoursePrerequisite,
	deleteHodCoursePrerequisite
} = require("../controllers/facultyController");

const router = express.Router();

router.get("/dashboard", authenticate, getFacultyDashboard);
router.get("/courses", authenticate, getFacultyCurrentCourses);
router.get("/marks", authenticate, getMarksForOffering);
router.post("/marks/update", authenticate, updateMarksForStudent);
router.get("/attendance", authenticate, getAttendanceForOffering);
router.post("/attendance/update", authenticate, updateAttendanceForStudent);
router.post("/attendance/mark-session", authenticate, markAttendanceSession);
router.post("/notifications", authenticate, sendFacultyNotification);
router.get("/notifications", authenticate, getFacultyNotificationFeed);
router.get("/ta-applications", authenticate, getFacultyTAApplications);
router.post("/ta-applications/:taId/decision", authenticate, decideFacultyTAApplication);
router.get("/leave-applications", authenticate, getFacultyLeaveApplications);
router.post("/leave-applications/:leaveId/decision", authenticate, decideFacultyLeaveApplication);
router.get("/cdc/internships", authenticate, getCdcInternshipManagement);
router.post("/cdc/internships/openings", authenticate, createCdcInternshipOpening);
router.post("/cdc/internships/applications/:internshipId/decision", authenticate, decideCdcInternshipApplication);
router.get("/cdc/placements", authenticate, getCdcPlacementManagement);
router.post("/cdc/placements/openings", authenticate, createCdcPlacementOpening);
router.post("/cdc/placements/applications/:placementId/decision", authenticate, decideCdcPlacementApplication);
router.get("/tt/courses", authenticate, getPicTtCourseTimetable);
router.post("/tt/courses", authenticate, createPicTtCourseTimetable);
router.put("/tt/courses/:timetableId", authenticate, updatePicTtCourseTimetable);
router.get("/tt/exams", authenticate, getPicTtExamTimetable);
router.post("/tt/exams", authenticate, createPicTtExamTimetable);
router.put("/tt/exams/:examId", authenticate, updatePicTtExamTimetable);
router.get("/hod/courses", authenticate, getHodCourseManagement);
router.post("/hod/courses", authenticate, createHodCourse);
router.put("/hod/courses/:courseId", authenticate, updateHodCourse);
router.delete("/hod/courses/:courseId", authenticate, deleteHodCourse);
router.post("/hod/course-offerings", authenticate, createHodCourseOffering);
router.put("/hod/course-offerings/:offeringId", authenticate, updateHodCourseOffering);
router.delete("/hod/course-offerings/:offeringId", authenticate, deleteHodCourseOffering);
router.post("/hod/courses/:courseId/prerequisites", authenticate, addHodCoursePrerequisite);
router.put("/hod/courses/:courseId/prerequisites/:prereqCourseId", authenticate, updateHodCoursePrerequisite);
router.delete("/hod/courses/:courseId/prerequisites/:prereqCourseId", authenticate, deleteHodCoursePrerequisite);

module.exports = router;
