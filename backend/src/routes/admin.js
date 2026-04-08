const express = require("express");
const multer = require("multer");

const authenticate = require("../middlewares/auth");
const {
  getAdminFeedbackStatus,
  updateAdminFeedbackStatus,
  getAdminEnrollmentStatus,
  updateAdminEnrollmentStatus,
  endAdminTerm,
  getAdminUserManagement,
  createAdminStudent,
  updateAdminStudent,
  bulkUploadAdminStudents,
  createAdminFaculty,
  updateAdminFaculty,
  bulkUploadAdminFaculty,
  getAdminRooms,
  createAdminRoom,
  updateAdminRoom,
  deleteAdminRoom
} = require("../controllers/adminController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.get("/users", authenticate, getAdminUserManagement);
router.get("/feedback-status", authenticate, getAdminFeedbackStatus);
router.put("/feedback-status", authenticate, updateAdminFeedbackStatus);
router.get("/enrollment-status", authenticate, getAdminEnrollmentStatus);
router.put("/enrollment-status", authenticate, updateAdminEnrollmentStatus);
router.post("/end-term", authenticate, endAdminTerm);
router.post("/students", authenticate, createAdminStudent);
router.post("/students/bulk-upload", authenticate, upload.single("file"), bulkUploadAdminStudents);
router.put("/students/:studentId", authenticate, updateAdminStudent);
router.post("/faculty", authenticate, createAdminFaculty);
router.post("/faculty/bulk-upload", authenticate, upload.single("file"), bulkUploadAdminFaculty);
router.put("/faculty/:facultyId", authenticate, updateAdminFaculty);
router.get("/rooms", authenticate, getAdminRooms);
router.post("/rooms", authenticate, createAdminRoom);
router.put("/rooms/:roomId", authenticate, updateAdminRoom);
router.delete("/rooms/:roomId", authenticate, deleteAdminRoom);

module.exports = router;
