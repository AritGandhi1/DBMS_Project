const pool = require("../config/db");

async function getCurrentTermForFaculty(facultyId) {
  const [termRows] = await pool.execute(
    `SELECT COALESCE(MAX(term_number), 0) AS current_term
     FROM COURSE_OFFERING
     WHERE faculty_id = ?`,
    [facultyId]
  );

  return Number(termRows[0]?.current_term || 0);
}

async function assertFacultyOwnsOffering(facultyId, offeringId) {
  const [rows] = await pool.execute(
    `SELECT offering_id
     FROM COURSE_OFFERING
     WHERE offering_id = ?
       AND faculty_id = ?
     LIMIT 1`,
    [Number(offeringId), facultyId]
  );

  if (!rows[0]) {
    const error = new Error("You can only access your own course offerings");
    error.status = 403;
    throw error;
  }
}

function ensureFacultyRole(req) {
  if (req.user.role !== "FACULTY") {
    const error = new Error("Only faculty can access this endpoint");
    error.status = 403;
    throw error;
  }
}

function ensureFacultyOrAdminRole(req) {
  if (req.user.role !== "FACULTY" && req.user.role !== "ADMIN") {
    const error = new Error("Only faculty or admin can access this endpoint");
    error.status = 403;
    throw error;
  }
}

function ensurePicCdcRole(req) {
  ensureFacultyRole(req);
  if (String(req.user.facultyDesignation || "").toUpperCase() !== "PIC_CDC") {
    const error = new Error("Only PIC_CDC faculty can access this endpoint");
    error.status = 403;
    throw error;
  }
}

function ensurePicTtRole(req) {
  ensureFacultyRole(req);
  if (String(req.user.facultyDesignation || "").toUpperCase() !== "PIC_TT") {
    const error = new Error("Only PIC_TT faculty can access this endpoint");
    error.status = 403;
    throw error;
  }
}

function ensureHodRole(req) {
  ensureFacultyRole(req);
  if (String(req.user.facultyDesignation || "").toUpperCase() !== "HOD") {
    const error = new Error("Only HOD faculty can access this endpoint");
    error.status = 403;
    throw error;
  }
}

async function assertCourseInDepartment(courseId, department) {
  const [rows] = await pool.execute(
    `SELECT course_id
     FROM COURSE
     WHERE course_id = ?
       AND UPPER(branch) = ?
     LIMIT 1`,
    [String(courseId).trim(), String(department).trim().toUpperCase()]
  );

  if (!rows[0]) {
    const error = new Error("Course not found in your department");
    error.status = 404;
    throw error;
  }
}

async function assertFacultyInDepartment(facultyId, department) {
  const [rows] = await pool.execute(
    `SELECT faculty_id
     FROM FACULTY
     WHERE faculty_id = ?
       AND UPPER(department) = ?
     LIMIT 1`,
    [String(facultyId).trim(), String(department).trim().toUpperCase()]
  );

  if (!rows[0]) {
    const error = new Error("Faculty not found in your department");
    error.status = 404;
    throw error;
  }
}

function parseOpeningFilePayload(fileName, fileData) {
  if (!fileName && !fileData) {
    return null;
  }

  if (!fileName || !fileData) {
    const error = new Error("fileName and fileData are required when uploading a file");
    error.status = 400;
    throw error;
  }

  const fileSize = Buffer.byteLength(fileData, "base64");
  if (fileSize > 5 * 1024 * 1024) {
    const error = new Error("File size exceeds 5MB limit");
    error.status = 400;
    throw error;
  }

  return {
    fileName: String(fileName).trim(),
    fileData: Buffer.from(fileData, "base64"),
    fileSize
  };
}

async function getFacultyDashboard(req, res, next) {
  try {
    ensureFacultyRole(req);

    const facultyId = String(req.user.id || "").trim();

    const [facultyRows] = await pool.execute(
      `SELECT
        faculty_id,
        name,
        department,
        email
       FROM FACULTY
       WHERE faculty_id = ?
       LIMIT 1`,
      [facultyId]
    );

    if (!facultyRows[0]) {
      const error = new Error("Faculty profile not found");
      error.status = 404;
      throw error;
    }

    const currentTermNumber = await getCurrentTermForFaculty(facultyId);

    const [courseRows] = await pool.execute(
      `SELECT
        co.offering_id,
        co.term_number,
        c.course_id,
        c.course_name
       FROM COURSE_OFFERING co
       JOIN COURSE c ON c.course_id = co.course_id
       WHERE co.faculty_id = ?
       ORDER BY co.term_number DESC, c.course_id`,
      [facultyId]
    );

    const [taRows] = await pool.execute(
      `SELECT
        ta.student_id,
        s.name AS student_name,
        s.college_email,
        ta.role,
        c.course_name
       FROM TA_ASSIGNMENT ta
       JOIN STUDENT s ON s.student_id = ta.student_id
       LEFT JOIN COURSE_OFFERING co ON co.offering_id = ta.offering_id
       LEFT JOIN COURSE c ON c.course_id = co.course_id
       WHERE ta.faculty_id = ?
         AND ta.term_number = ?
       ORDER BY s.name, ta.student_id`,
      [facultyId, currentTermNumber]
    );

    res.status(200).json({
      message: "Faculty dashboard data retrieved",
      currentTermNumber,
      faculty: {
        id: facultyRows[0].faculty_id,
        name: facultyRows[0].name,
        department: facultyRows[0].department,
        email: facultyRows[0].email
      },
      courses: courseRows.map((row) => ({
        offeringId: row.offering_id,
        termNumber: row.term_number,
        courseId: row.course_id,
        courseName: row.course_name
      })),
      tas: taRows.map((row) => ({
        studentId: row.student_id,
        name: row.student_name,
        collegeEmail: row.college_email,
        role: row.role,
        courseName: row.course_name || "Unassigned"
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function getFacultyCurrentCourses(req, res, next) {
  try {
    ensureFacultyRole(req);

    const facultyId = String(req.user.id || "").trim();

    const [courseRows] = await pool.execute(
      `SELECT
        co.offering_id,
        co.term_number,
        c.course_id,
        c.course_name
       FROM COURSE_OFFERING co
       JOIN COURSE c ON c.course_id = co.course_id
       WHERE co.faculty_id = ?
       ORDER BY co.term_number DESC, c.course_id`,
      [facultyId]
    );

    res.status(200).json({
      message: "Faculty courses retrieved",
      courses: courseRows.map((row) => ({
        offeringId: row.offering_id,
        termNumber: row.term_number,
        courseId: row.course_id,
        courseName: row.course_name
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function getMarksForOffering(req, res, next) {
  try {
    ensureFacultyRole(req);

    const facultyId = String(req.user.id || "").trim();
    const offeringId = Number(req.query.offeringId);

    if (Number.isNaN(offeringId)) {
      const error = new Error("offeringId is required and must be numeric");
      error.status = 400;
      throw error;
    }

    await assertFacultyOwnsOffering(facultyId, offeringId);

    const [rows] = await pool.execute(
      `SELECT
        e.student_id,
        s.name,
        m.mid_sem,
        m.end_sem,
        m.internal,
        m.total,
        m.grade
       FROM ENROLLMENT e
       JOIN STUDENT s ON s.student_id = e.student_id
       LEFT JOIN MARKS m
         ON m.student_id = e.student_id
        AND m.offering_id = e.offering_id
       WHERE e.offering_id = ?
       ORDER BY e.student_id`,
      [offeringId]
    );

    res.status(200).json({
      message: "Marks retrieved",
      students: rows.map((row) => ({
        studentId: row.student_id,
        name: row.name,
        midSem: row.mid_sem,
        endSem: row.end_sem,
        internal: row.internal,
        total: row.total,
        grade: row.grade
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function updateMarksForStudent(req, res, next) {
  try {
    ensureFacultyRole(req);

    const facultyId = String(req.user.id || "").trim();
    const { offeringId, studentId, midSem, endSem, internal, grade } = req.body;
    const numericOfferingId = Number(offeringId);

    if (Number.isNaN(numericOfferingId) || !studentId) {
      const error = new Error("offeringId and studentId are required");
      error.status = 400;
      throw error;
    }

    await assertFacultyOwnsOffering(facultyId, numericOfferingId);

    const [offeringRows] = await pool.execute(
      `SELECT course_id, term_number
       FROM COURSE_OFFERING
       WHERE offering_id = ?
       LIMIT 1`,
      [numericOfferingId]
    );

    if (!offeringRows[0]) {
      const error = new Error("Course offering not found");
      error.status = 404;
      throw error;
    }

    const [enrollmentRows] = await pool.execute(
      `SELECT enrollment_id
       FROM ENROLLMENT
       WHERE offering_id = ?
         AND student_id = ?
       LIMIT 1`,
      [numericOfferingId, String(studentId).trim()]
    );

    if (!enrollmentRows[0]) {
      const error = new Error("Student is not enrolled in this course");
      error.status = 404;
      throw error;
    }

    await pool.execute(
      `INSERT INTO MARKS (
        student_id,
        offering_id,
        mid_sem,
        end_sem,
        internal,
        grade
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        mid_sem = VALUES(mid_sem),
        end_sem = VALUES(end_sem),
        internal = VALUES(internal),
        grade = VALUES(grade)`,
      [
        String(studentId).trim(),
        numericOfferingId,
        midSem == null || midSem === "" ? null : Number(midSem),
        endSem == null || endSem === "" ? null : Number(endSem),
        internal == null || internal === "" ? null : Number(internal),
        grade ? String(grade).trim().toUpperCase() : null
      ]
    );

    const courseId = offeringRows[0].course_id;
    const termNumber = Number(offeringRows[0].term_number);

    await pool.execute(
      `INSERT INTO ACADEMIC_TRANSCRIPT (
        student_id,
        course_id,
        term_number,
        mid_sem,
        end_sem,
        internal,
        grade
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        mid_sem = VALUES(mid_sem),
        end_sem = VALUES(end_sem),
        internal = VALUES(internal),
        grade = VALUES(grade),
        recorded_date = CURRENT_TIMESTAMP`,
      [
        String(studentId).trim(),
        courseId,
        termNumber,
        midSem == null || midSem === "" ? null : Number(midSem),
        endSem == null || endSem === "" ? null : Number(endSem),
        internal == null || internal === "" ? null : Number(internal),
        grade ? String(grade).trim().toUpperCase() : null
      ]
    );

    res.status(200).json({
      message: "Marks updated"
    });
  } catch (error) {
    next(error);
  }
}

async function getAttendanceForOffering(req, res, next) {
  try {
    ensureFacultyRole(req);

    const facultyId = String(req.user.id || "").trim();
    const offeringId = Number(req.query.offeringId);

    if (Number.isNaN(offeringId)) {
      const error = new Error("offeringId is required and must be numeric");
      error.status = 400;
      throw error;
    }

    await assertFacultyOwnsOffering(facultyId, offeringId);

    const [rows] = await pool.execute(
      `SELECT
        e.student_id,
        s.name,
        a.classes_attended_count,
        co.total_classes_conducted
       FROM ENROLLMENT e
       JOIN STUDENT s ON s.student_id = e.student_id
       JOIN COURSE_OFFERING co ON co.offering_id = e.offering_id
       LEFT JOIN ATTENDANCE a
         ON a.student_id = e.student_id
        AND a.offering_id = e.offering_id
       WHERE e.offering_id = ?
       ORDER BY e.student_id`,
      [offeringId]
    );

    res.status(200).json({
      message: "Attendance retrieved",
      totalClassesConducted: Number(rows[0]?.total_classes_conducted || 0),
      students: rows.map((row) => ({
        studentId: row.student_id,
        name: row.name,
        classesAttendedCount: row.classes_attended_count
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function markAttendanceSession(req, res, next) {
  try {
    ensureFacultyRole(req);

    const facultyId = String(req.user.id || "").trim();
    const { offeringId, classHours, records } = req.body;
    const numericOfferingId = Number(offeringId);
    const numericClassHours = Number(classHours);

    if (Number.isNaN(numericOfferingId)) {
      const error = new Error("offeringId is required");
      error.status = 400;
      throw error;
    }

    if (![1, 2].includes(numericClassHours)) {
      const error = new Error("classHours must be 1 or 2");
      error.status = 400;
      throw error;
    }

    if (!Array.isArray(records) || records.length === 0) {
      const error = new Error("records are required");
      error.status = 400;
      throw error;
    }

    await assertFacultyOwnsOffering(facultyId, numericOfferingId);

    const [enrolledRows] = await pool.execute(
      `SELECT student_id
       FROM ENROLLMENT
       WHERE offering_id = ?`,
      [numericOfferingId]
    );

    const enrolledStudentIds = new Set(enrolledRows.map((row) => String(row.student_id)));

    const submittedIds = records.map((item) => String(item.studentId || "").trim());
    const uniqueSubmittedIds = new Set(submittedIds);

    if (uniqueSubmittedIds.size !== enrolledStudentIds.size) {
      const error = new Error("Attendance must be marked for all enrolled students exactly once");
      error.status = 400;
      throw error;
    }

    for (const studentId of uniqueSubmittedIds) {
      if (!enrolledStudentIds.has(studentId)) {
        const error = new Error(`Invalid studentId in attendance records: ${studentId}`);
        error.status = 400;
        throw error;
      }
    }

    const presentStudents = [];
    for (const item of records) {
      const studentId = String(item.studentId || "").trim();
      const status = String(item.status || "").trim().toUpperCase();

      if (status !== "PRESENT" && status !== "ABSENT") {
        const error = new Error(`Invalid status for ${studentId}. Use PRESENT or ABSENT`);
        error.status = 400;
        throw error;
      }

      if (status === "PRESENT") {
        presentStudents.push(studentId);
      }
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        `UPDATE COURSE_OFFERING
         SET total_classes_conducted = total_classes_conducted + ?
         WHERE offering_id = ?`,
        [numericClassHours, numericOfferingId]
      );

      for (const studentId of presentStudents) {
        await connection.execute(
          `INSERT INTO ATTENDANCE (
            student_id,
            offering_id,
            classes_attended_count
          ) VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            classes_attended_count = classes_attended_count + VALUES(classes_attended_count)`,
          [studentId, numericOfferingId, numericClassHours]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    res.status(200).json({
      message: "Attendance session marked",
      classHours: numericClassHours,
      markedPresentCount: presentStudents.length,
      markedAbsentCount: records.length - presentStudents.length
    });
  } catch (error) {
    next(error);
  }
}

async function updateAttendanceForStudent(req, res, next) {
  try {
    ensureFacultyRole(req);

    const facultyId = String(req.user.id || "").trim();
    const { offeringId, studentId, classesAttendedCount } = req.body;
    const numericOfferingId = Number(offeringId);
    const numericClasses = Number(classesAttendedCount);

    if (Number.isNaN(numericOfferingId) || !studentId || Number.isNaN(numericClasses)) {
      const error = new Error("offeringId, studentId and classesAttendedCount are required");
      error.status = 400;
      throw error;
    }

    await assertFacultyOwnsOffering(facultyId, numericOfferingId);

    const [enrollmentRows] = await pool.execute(
      `SELECT enrollment_id
       FROM ENROLLMENT
       WHERE offering_id = ?
         AND student_id = ?
       LIMIT 1`,
      [numericOfferingId, String(studentId).trim()]
    );

    if (!enrollmentRows[0]) {
      const error = new Error("Student is not enrolled in this course");
      error.status = 404;
      throw error;
    }

    await pool.execute(
      `INSERT INTO ATTENDANCE (
        student_id,
        offering_id,
        classes_attended_count
      ) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        classes_attended_count = VALUES(classes_attended_count)`,
      [String(studentId).trim(), numericOfferingId, numericClasses]
    );

    res.status(200).json({
      message: "Attendance updated"
    });
  } catch (error) {
    next(error);
  }
}

async function sendFacultyNotification(req, res, next) {
  try {
    ensureFacultyOrAdminRole(req);

    const senderId = String(req.user.id || "").trim();
    const isAdmin = req.user.role === "ADMIN";
    const { targetType, targetId, message } = req.body;

    const normalizedTargetType = String(targetType || "").trim().toUpperCase();
    const normalizedTargetId = String(targetId || "").trim();
    const normalizedMessage = String(message || "").trim();

    if (!["COURSE", "STUDENT", "FACULTY_ADVISOR"].includes(normalizedTargetType)) {
      const error = new Error("targetType must be COURSE, STUDENT, or FACULTY_ADVISOR");
      error.status = 400;
      throw error;
    }

    if (!normalizedMessage) {
      const error = new Error("message is required");
      error.status = 400;
      throw error;
    }

    if (normalizedTargetType !== "FACULTY_ADVISOR" && !normalizedTargetId) {
      const error = new Error("targetId is required");
      error.status = 400;
      throw error;
    }

    let notificationTargetId = normalizedTargetId;

    if (normalizedTargetType === "COURSE") {
      if (isAdmin) {
        const [courseRows] = await pool.execute(
          `SELECT offering_id
           FROM COURSE_OFFERING
           WHERE course_id = ?
           LIMIT 1`,
          [normalizedTargetId]
        );

        if (!courseRows[0]) {
          const error = new Error("Course not found");
          error.status = 404;
          throw error;
        }
      } else {
        const [courseRows] = await pool.execute(
          `SELECT co.offering_id
           FROM COURSE_OFFERING co
           WHERE co.faculty_id = ?
             AND co.course_id = ?
           LIMIT 1`,
          [senderId, normalizedTargetId]
        );

        if (!courseRows[0]) {
          const error = new Error("Course not found under your offerings");
          error.status = 403;
          throw error;
        }
      }
    }

    if (normalizedTargetType === "STUDENT") {
      if (isAdmin) {
        const [studentRows] = await pool.execute(
          `SELECT student_id
           FROM STUDENT
           WHERE student_id = ?
           LIMIT 1`,
          [normalizedTargetId]
        );

        if (!studentRows[0]) {
          const error = new Error("Student not found");
          error.status = 404;
          throw error;
        }
      } else {
        const [studentRows] = await pool.execute(
          `SELECT e.enrollment_id
           FROM ENROLLMENT e
           JOIN COURSE_OFFERING co ON co.offering_id = e.offering_id
           WHERE co.faculty_id = ?
             AND e.student_id = ?
           LIMIT 1`,
          [senderId, normalizedTargetId]
        );

        if (!studentRows[0]) {
          const error = new Error("Student is not enrolled in your courses");
          error.status = 403;
          throw error;
        }
      }
    }

    if (normalizedTargetType === "FACULTY_ADVISOR") {
      if (isAdmin) {
        const error = new Error("FACULTY_ADVISOR target is only available for faculty advisors");
        error.status = 403;
        throw error;
      }

      const [adviseeRows] = await pool.execute(
        `SELECT student_id
         FROM STUDENT
         WHERE advisor_id = ?
         LIMIT 1`,
        [senderId]
      );

      if (!adviseeRows[0]) {
        const error = new Error("You are not assigned as Faculty Advisor to any student");
        error.status = 403;
        throw error;
      }

      // Faculty-advisor broadcast uses faculty_id as notification target id.
      notificationTargetId = senderId;
    }

    const [result] = await pool.execute(
      `INSERT INTO NOTIFICATION (id, sent_by, message)
       VALUES (?, ?, ?)`,
      [notificationTargetId, senderId, normalizedMessage]
    );

    res.status(201).json({
      message: "Notification sent",
      notificationId: result.insertId
    });
  } catch (error) {
    next(error);
  }
}

async function getFacultyNotificationFeed(req, res, next) {
  try {
    ensureFacultyOrAdminRole(req);

    const senderId = String(req.user.id || "").trim();

    const [rows] = await pool.execute(
      `SELECT
        n.notification_id,
        n.id,
        n.sent_by,
        n.message,
        n.created_at
       FROM NOTIFICATION n
       WHERE n.sent_by = ?
       ORDER BY n.created_at DESC, n.notification_id DESC
       LIMIT 50`,
      [senderId]
    );

    res.status(200).json({
      message: "Faculty notifications retrieved",
      notifications: rows.map((row) => ({
        notificationId: row.notification_id,
        targetId: row.id,
        sentBy: row.sent_by,
        message: row.message,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function getFacultyTAApplications(req, res, next) {
  try {
    ensureFacultyRole(req);

    const facultyId = String(req.user.id || "").trim();

    const [rows] = await pool.execute(
      `SELECT
        ta.ta_id,
        ta.student_id,
        s.name AS student_name,
        s.branch,
        s.college_email,
        ta.term_number,
        ta.resume_id,
        ta.role,
        ta.status,
        ta.applied_at
       FROM TA_ASSIGNMENT ta
       JOIN STUDENT s ON s.student_id = ta.student_id
       WHERE ta.faculty_id = ?
         AND ta.offering_id IS NULL
       ORDER BY CASE ta.status WHEN 'Pending' THEN 0 WHEN 'Accepted' THEN 1 ELSE 2 END,
                ta.applied_at DESC,
                ta.ta_id DESC`,
      [facultyId]
    );

    res.status(200).json({
      message: "Faculty TA applications retrieved",
      applications: rows.map((row) => ({
        taId: row.ta_id,
        studentId: row.student_id,
        studentName: row.student_name,
        branch: row.branch,
        collegeEmail: row.college_email,
        termNumber: row.term_number,
        resumeId: row.resume_id,
        role: row.role,
        status: row.status,
        appliedAt: row.applied_at
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function decideFacultyTAApplication(req, res, next) {
  try {
    ensureFacultyRole(req);

    const facultyId = String(req.user.id || "").trim();
    const taId = Number(req.params.taId);
    const { action } = req.body;
    const normalizedAction = String(action || "").trim().toUpperCase();

    if (Number.isNaN(taId)) {
      const error = new Error("taId must be numeric");
      error.status = 400;
      throw error;
    }

    if (!["ACCEPT", "REJECT"].includes(normalizedAction)) {
      const error = new Error("action must be ACCEPT or REJECT");
      error.status = 400;
      throw error;
    }

    const [rows] = await pool.execute(
      `SELECT ta_id, student_id, status
       FROM TA_ASSIGNMENT
       WHERE ta_id = ?
         AND faculty_id = ?
         AND offering_id IS NULL
       LIMIT 1`,
      [taId, facultyId]
    );

    if (!rows[0]) {
      const error = new Error("TA application not found");
      error.status = 404;
      throw error;
    }

    if (rows[0].status !== 'Pending') {
      const error = new Error("Only pending applications can be reviewed");
      error.status = 409;
      throw error;
    }

    const nextStatus = normalizedAction === 'ACCEPT' ? 'Accepted' : 'Rejected';

    await pool.execute(
      `UPDATE TA_ASSIGNMENT
       SET status = ?
       WHERE ta_id = ?
         AND faculty_id = ?`,
      [nextStatus, taId, facultyId]
    );

    res.status(200).json({
      message: `TA application ${nextStatus.toLowerCase()} successfully`,
      taId,
      status: nextStatus
    });
  } catch (error) {
    next(error);
  }
}

async function downloadFacultyTAResume(req, res, next) {
  try {
    ensureFacultyRole(req);

    const facultyId = String(req.user.id || "").trim();
    const taId = Number(req.params.taId);

    if (Number.isNaN(taId)) {
      const error = new Error("taId must be numeric");
      error.status = 400;
      throw error;
    }

    const [rows] = await pool.execute(
      `SELECT
        ta.ta_id,
        ta.resume_id,
        sr.file_name,
        sr.file_data,
        sr.is_deleted
       FROM TA_ASSIGNMENT ta
       LEFT JOIN STUDENT_RESUME sr ON sr.resume_id = ta.resume_id
       WHERE ta.ta_id = ?
         AND ta.faculty_id = ?
         AND ta.offering_id IS NULL
       LIMIT 1`,
      [taId, facultyId]
    );

    const record = rows[0];
    if (!record) {
      const error = new Error("TA application not found");
      error.status = 404;
      throw error;
    }

    if (!record.resume_id || !record.file_data || Number(record.is_deleted) === 1) {
      const error = new Error("Resume not available for this TA application");
      error.status = 404;
      throw error;
    }

    const safeFileName = String(record.file_name || `ta-${taId}-resume.pdf`).replace(/[^a-zA-Z0-9._-]/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
    return res.send(record.file_data);
  } catch (error) {
    next(error);
  }
}

async function getFacultyLeaveApplications(req, res, next) {
  try {
    ensureFacultyRole(req);

    const facultyId = String(req.user.id || "").trim();

    const [rows] = await pool.execute(
      `SELECT
        la.leave_id,
        la.student_id,
        s.name AS student_name,
        s.branch,
        s.college_email,
        la.start_date,
        la.end_date,
        la.reason,
        la.status,
        la.applied_on
       FROM LEAVE_APPLICATION la
       JOIN STUDENT s ON s.student_id = la.student_id
       WHERE s.advisor_id = ?
       ORDER BY CASE la.status WHEN 'Pending' THEN 0 WHEN 'Approved' THEN 1 ELSE 2 END,
                la.applied_on DESC,
                la.leave_id DESC`,
      [facultyId]
    );

    const applications = rows.map((row) => ({
      leaveId: row.leave_id,
      studentId: row.student_id,
      studentName: row.student_name,
      branch: row.branch,
      collegeEmail: row.college_email,
      startDate: row.start_date,
      endDate: row.end_date,
      reason: row.reason,
      status: row.status,
      appliedOn: row.applied_on
    }));

    res.status(200).json({
      message: "Faculty leave applications retrieved",
      currentApplications: applications.filter((item) => item.status === 'Pending'),
      history: applications
    });
  } catch (error) {
    next(error);
  }
}

async function decideFacultyLeaveApplication(req, res, next) {
  try {
    ensureFacultyRole(req);

    const facultyId = String(req.user.id || "").trim();
    const leaveId = Number(req.params.leaveId);
    const { action } = req.body;
    const normalizedAction = String(action || "").trim().toUpperCase();

    if (Number.isNaN(leaveId)) {
      const error = new Error("leaveId must be numeric");
      error.status = 400;
      throw error;
    }

    if (!["APPROVE", "REJECT"].includes(normalizedAction)) {
      const error = new Error("action must be APPROVE or REJECT");
      error.status = 400;
      throw error;
    }

    const [rows] = await pool.execute(
      `SELECT la.leave_id, la.student_id, la.status, s.advisor_id
       FROM LEAVE_APPLICATION la
       JOIN STUDENT s ON s.student_id = la.student_id
       WHERE la.leave_id = ?
         AND s.advisor_id = ?
       LIMIT 1`,
      [leaveId, facultyId]
    );

    if (!rows[0]) {
      const error = new Error("Leave application not found");
      error.status = 404;
      throw error;
    }

    if (rows[0].status !== 'Pending') {
      const error = new Error("Only pending leave applications can be reviewed");
      error.status = 409;
      throw error;
    }

    const nextStatus = normalizedAction === 'APPROVE' ? 'Approved' : 'Rejected';

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        `UPDATE LEAVE_APPLICATION
         SET status = ?
         WHERE leave_id = ?`,
        [nextStatus, leaveId]
      );

      const notificationMessage = `Your leave application (ID: ${leaveId}) has been ${nextStatus.toLowerCase()} by your faculty advisor.`;
      await connection.execute(
        `INSERT INTO NOTIFICATION (id, sent_by, message)
         VALUES (?, ?, ?)`,
        [rows[0].student_id, facultyId, notificationMessage]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    res.status(200).json({
      message: `Leave application ${nextStatus.toLowerCase()} successfully`,
      leaveId,
      status: nextStatus
    });
  } catch (error) {
    next(error);
  }
}

async function getCdcInternshipManagement(req, res, next) {
  try {
    ensurePicCdcRole(req);

    const facultyId = String(req.user.id || "").trim();
    const department = String(req.user.department || "").trim().toUpperCase();

    const [openingRows] = await pool.execute(
      `SELECT
        io.opening_id,
        io.company,
        io.role,
        io.stipend,
        io.duration_months,
        io.file_name,
        io.is_active
       FROM INTERNSHIP_OPENING io
       JOIN INTERNSHIP_BRANCH ib ON ib.opening_id = io.opening_id
       WHERE UPPER(ib.branch) = ?
       ORDER BY io.opening_id DESC`,
      [department]
    );

    const [applicationRows] = await pool.execute(
      `SELECT
        i.internship_id,
        i.opening_id,
        i.student_id,
        s.name AS student_name,
        s.branch,
        i.status,
        i.applied_at,
        i.decision_at,
        i.company,
        i.role,
        i.package,
        i.duration
       FROM INTERNSHIP i
       JOIN STUDENT s ON s.student_id = i.student_id
       JOIN INTERNSHIP_BRANCH ib ON ib.opening_id = i.opening_id
       WHERE UPPER(ib.branch) = ?
       ORDER BY i.applied_at DESC, i.internship_id DESC`,
      [department]
    );

    res.status(200).json({
      message: "CDC internship data retrieved",
      managedBy: facultyId,
      department,
      openings: openingRows.map((row) => ({
        openingId: row.opening_id,
        company: row.company,
        role: row.role,
        stipend: row.stipend,
        durationMonths: row.duration_months,
        fileName: row.file_name,
        isActive: Boolean(row.is_active)
      })),
      applications: applicationRows.map((row) => ({
        internshipId: row.internship_id,
        openingId: row.opening_id,
        studentId: row.student_id,
        studentName: row.student_name,
        branch: row.branch,
        status: row.status,
        appliedAt: row.applied_at,
        decisionAt: row.decision_at,
        company: row.company,
        role: row.role,
        package: row.package,
        duration: row.duration
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function createCdcInternshipOpening(req, res, next) {
  try {
    ensurePicCdcRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const { company, role, stipend, durationMonths, fileName, fileData } = req.body;

    if (!company || !role || stipend == null || durationMonths == null) {
      const error = new Error("company, role, stipend and durationMonths are required");
      error.status = 400;
      throw error;
    }

    const openingFile = parseOpeningFilePayload(fileName, fileData);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO INTERNSHIP_OPENING (company, role, stipend, duration_months, file_name, file_data, file_size, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          String(company).trim(),
          String(role).trim(),
          Number(stipend),
          Number(durationMonths),
          openingFile?.fileName || null,
          openingFile?.fileData || null,
          openingFile?.fileSize || null
        ]
      );

      await connection.execute(
        `INSERT INTO INTERNSHIP_BRANCH (opening_id, branch)
         VALUES (?, ?)`,
        [result.insertId, department]
      );

      await connection.commit();

      res.status(201).json({
        message: "Internship opening created",
        openingId: result.insertId,
        department
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
}

async function updateCdcInternshipOpening(req, res, next) {
  try {
    ensurePicCdcRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const openingId = Number(req.params.openingId);

    if (Number.isNaN(openingId)) {
      const error = new Error("openingId must be numeric");
      error.status = 400;
      throw error;
    }

    const [existingRows] = await pool.execute(
      `SELECT io.opening_id
       FROM INTERNSHIP_OPENING io
       JOIN INTERNSHIP_BRANCH ib ON ib.opening_id = io.opening_id
       WHERE io.opening_id = ?
         AND UPPER(ib.branch) = ?
       LIMIT 1`,
      [openingId, department]
    );

    if (!existingRows[0]) {
      const error = new Error("Internship opening not found in your department");
      error.status = 404;
      throw error;
    }

    const updates = [];
    const values = [];

    if (req.body.company != null && String(req.body.company).trim() !== "") {
      updates.push("company = ?");
      values.push(String(req.body.company).trim());
    }

    if (req.body.role != null && String(req.body.role).trim() !== "") {
      updates.push("role = ?");
      values.push(String(req.body.role).trim());
    }

    if (req.body.stipend != null && String(req.body.stipend).trim() !== "") {
      const stipend = Number(req.body.stipend);
      if (Number.isNaN(stipend) || stipend < 0) {
        const error = new Error("stipend must be a valid non-negative number");
        error.status = 400;
        throw error;
      }
      updates.push("stipend = ?");
      values.push(stipend);
    }

    if (req.body.durationMonths != null && String(req.body.durationMonths).trim() !== "") {
      const durationMonths = Number(req.body.durationMonths);
      if (Number.isNaN(durationMonths) || durationMonths <= 0) {
        const error = new Error("durationMonths must be a positive number");
        error.status = 400;
        throw error;
      }
      updates.push("duration_months = ?");
      values.push(durationMonths);
    }

    if (req.body.isActive != null) {
      const normalizedIsActive = String(req.body.isActive).trim().toLowerCase();
      if (!["0", "1", "true", "false"].includes(normalizedIsActive)) {
        const error = new Error("isActive must be a boolean-like value");
        error.status = 400;
        throw error;
      }
      updates.push("is_active = ?");
      values.push(["1", "true"].includes(normalizedIsActive) ? 1 : 0);
    }

    const openingFile = parseOpeningFilePayload(req.body.fileName, req.body.fileData);
    if (openingFile) {
      updates.push("file_name = ?", "file_data = ?", "file_size = ?");
      values.push(openingFile.fileName, openingFile.fileData, openingFile.fileSize);
    }

    if (updates.length === 0) {
      const error = new Error("At least one field is required to update");
      error.status = 400;
      throw error;
    }

    values.push(openingId);

    await pool.execute(
      `UPDATE INTERNSHIP_OPENING
       SET ${updates.join(", ")}
       WHERE opening_id = ?`,
      values
    );

    res.status(200).json({
      message: "Internship opening updated",
      openingId
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCdcInternshipOpening(req, res, next) {
  try {
    ensurePicCdcRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const openingId = Number(req.params.openingId);

    if (Number.isNaN(openingId)) {
      const error = new Error("openingId must be numeric");
      error.status = 400;
      throw error;
    }

    const [existingRows] = await pool.execute(
      `SELECT io.opening_id
       FROM INTERNSHIP_OPENING io
       JOIN INTERNSHIP_BRANCH ib ON ib.opening_id = io.opening_id
       WHERE io.opening_id = ?
         AND UPPER(ib.branch) = ?
       LIMIT 1`,
      [openingId, department]
    );

    if (!existingRows[0]) {
      const error = new Error("Internship opening not found in your department");
      error.status = 404;
      throw error;
    }

    await pool.execute(
      `DELETE FROM INTERNSHIP_OPENING
       WHERE opening_id = ?`,
      [openingId]
    );

    res.status(200).json({
      message: "Internship opening deleted",
      openingId
    });
  } catch (error) {
    next(error);
  }
}

async function decideCdcInternshipApplication(req, res, next) {
  try {
    ensurePicCdcRole(req);

    const facultyId = String(req.user.id || "").trim();
    const department = String(req.user.department || "").trim().toUpperCase();
    const internshipId = Number(req.params.internshipId);
    const normalizedAction = String(req.body.action || "").trim().toUpperCase();

    if (Number.isNaN(internshipId)) {
      const error = new Error("internshipId must be numeric");
      error.status = 400;
      throw error;
    }

    if (!["ACCEPT", "REJECT"].includes(normalizedAction)) {
      const error = new Error("action must be ACCEPT or REJECT");
      error.status = 400;
      throw error;
    }

    const [rows] = await pool.execute(
      `SELECT i.internship_id, i.student_id, i.status
       FROM INTERNSHIP i
       JOIN INTERNSHIP_BRANCH ib ON ib.opening_id = i.opening_id
       WHERE i.internship_id = ?
         AND UPPER(ib.branch) = ?
       LIMIT 1`,
      [internshipId, department]
    );

    if (!rows[0]) {
      const error = new Error("Internship application not found for your department");
      error.status = 404;
      throw error;
    }

    if (rows[0].status !== "Applied") {
      const error = new Error("Only applied applications can be reviewed");
      error.status = 409;
      throw error;
    }

    const nextStatus = normalizedAction === "ACCEPT" ? "Accepted" : "Rejected";

    await pool.execute(
      `UPDATE INTERNSHIP
       SET status = ?, decision_at = NOW()
       WHERE internship_id = ?`,
      [nextStatus, internshipId]
    );

    await pool.execute(
      `INSERT INTO NOTIFICATION (id, sent_by, message)
       VALUES (?, ?, ?)`,
      [rows[0].student_id, facultyId, `Your internship application (ID: ${internshipId}) has been ${nextStatus.toLowerCase()}.`]
    );

    res.status(200).json({
      message: `Internship application ${nextStatus.toLowerCase()} successfully`,
      internshipId,
      status: nextStatus
    });
  } catch (error) {
    next(error);
  }
}

async function getCdcPlacementManagement(req, res, next) {
  try {
    ensurePicCdcRole(req);

    const facultyId = String(req.user.id || "").trim();
    const department = String(req.user.department || "").trim().toUpperCase();

    const [openingRows] = await pool.execute(
      `SELECT
        po.opening_id,
        po.company,
        po.role,
        po.ctc,
        po.file_name,
        po.is_active
       FROM PLACEMENT_OPENING po
       JOIN PLACEMENT_BRANCH pb ON pb.opening_id = po.opening_id
       WHERE UPPER(pb.branch) = ?
       ORDER BY po.opening_id DESC`,
      [department]
    );

    const [applicationRows] = await pool.execute(
      `SELECT
        p.placement_id,
        p.opening_id,
        p.student_id,
        s.name AS student_name,
        s.branch,
        p.status,
        p.applied_at,
        p.decision_at,
        p.company,
        p.role,
        p.package
       FROM PLACEMENT p
       JOIN STUDENT s ON s.student_id = p.student_id
       JOIN PLACEMENT_BRANCH pb ON pb.opening_id = p.opening_id
       WHERE UPPER(pb.branch) = ?
       ORDER BY p.applied_at DESC, p.placement_id DESC`,
      [department]
    );

    res.status(200).json({
      message: "CDC placement data retrieved",
      managedBy: facultyId,
      department,
      openings: openingRows.map((row) => ({
        openingId: row.opening_id,
        company: row.company,
        role: row.role,
        ctc: row.ctc,
        fileName: row.file_name,
        isActive: Boolean(row.is_active)
      })),
      applications: applicationRows.map((row) => ({
        placementId: row.placement_id,
        openingId: row.opening_id,
        studentId: row.student_id,
        studentName: row.student_name,
        branch: row.branch,
        status: row.status,
        appliedAt: row.applied_at,
        decisionAt: row.decision_at,
        company: row.company,
        role: row.role,
        package: row.package
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function createCdcPlacementOpening(req, res, next) {
  try {
    ensurePicCdcRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const { company, role, ctc, fileName, fileData } = req.body;

    if (!company || !role || ctc == null) {
      const error = new Error("company, role and ctc are required");
      error.status = 400;
      throw error;
    }

    const openingFile = parseOpeningFilePayload(fileName, fileData);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO PLACEMENT_OPENING (company, role, ctc, file_name, file_data, file_size, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [
          String(company).trim(),
          String(role).trim(),
          Number(ctc),
          openingFile?.fileName || null,
          openingFile?.fileData || null,
          openingFile?.fileSize || null
        ]
      );

      await connection.execute(
        `INSERT INTO PLACEMENT_BRANCH (opening_id, branch)
         VALUES (?, ?)`,
        [result.insertId, department]
      );

      await connection.commit();

      res.status(201).json({
        message: "Placement opening created",
        openingId: result.insertId,
        department
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
}

async function updateCdcPlacementOpening(req, res, next) {
  try {
    ensurePicCdcRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const openingId = Number(req.params.openingId);

    if (Number.isNaN(openingId)) {
      const error = new Error("openingId must be numeric");
      error.status = 400;
      throw error;
    }

    const [existingRows] = await pool.execute(
      `SELECT po.opening_id
       FROM PLACEMENT_OPENING po
       JOIN PLACEMENT_BRANCH pb ON pb.opening_id = po.opening_id
       WHERE po.opening_id = ?
         AND UPPER(pb.branch) = ?
       LIMIT 1`,
      [openingId, department]
    );

    if (!existingRows[0]) {
      const error = new Error("Placement opening not found in your department");
      error.status = 404;
      throw error;
    }

    const updates = [];
    const values = [];

    if (req.body.company != null && String(req.body.company).trim() !== "") {
      updates.push("company = ?");
      values.push(String(req.body.company).trim());
    }

    if (req.body.role != null && String(req.body.role).trim() !== "") {
      updates.push("role = ?");
      values.push(String(req.body.role).trim());
    }

    if (req.body.ctc != null && String(req.body.ctc).trim() !== "") {
      const ctc = Number(req.body.ctc);
      if (Number.isNaN(ctc) || ctc < 0) {
        const error = new Error("ctc must be a valid non-negative number");
        error.status = 400;
        throw error;
      }
      updates.push("ctc = ?");
      values.push(ctc);
    }

    if (req.body.isActive != null) {
      const normalizedIsActive = String(req.body.isActive).trim().toLowerCase();
      if (!["0", "1", "true", "false"].includes(normalizedIsActive)) {
        const error = new Error("isActive must be a boolean-like value");
        error.status = 400;
        throw error;
      }
      updates.push("is_active = ?");
      values.push(["1", "true"].includes(normalizedIsActive) ? 1 : 0);
    }

    const openingFile = parseOpeningFilePayload(req.body.fileName, req.body.fileData);
    if (openingFile) {
      updates.push("file_name = ?", "file_data = ?", "file_size = ?");
      values.push(openingFile.fileName, openingFile.fileData, openingFile.fileSize);
    }

    if (updates.length === 0) {
      const error = new Error("At least one field is required to update");
      error.status = 400;
      throw error;
    }

    values.push(openingId);

    await pool.execute(
      `UPDATE PLACEMENT_OPENING
       SET ${updates.join(", ")}
       WHERE opening_id = ?`,
      values
    );

    res.status(200).json({
      message: "Placement opening updated",
      openingId
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCdcPlacementOpening(req, res, next) {
  try {
    ensurePicCdcRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const openingId = Number(req.params.openingId);

    if (Number.isNaN(openingId)) {
      const error = new Error("openingId must be numeric");
      error.status = 400;
      throw error;
    }

    const [existingRows] = await pool.execute(
      `SELECT po.opening_id
       FROM PLACEMENT_OPENING po
       JOIN PLACEMENT_BRANCH pb ON pb.opening_id = po.opening_id
       WHERE po.opening_id = ?
         AND UPPER(pb.branch) = ?
       LIMIT 1`,
      [openingId, department]
    );

    if (!existingRows[0]) {
      const error = new Error("Placement opening not found in your department");
      error.status = 404;
      throw error;
    }

    await pool.execute(
      `DELETE FROM PLACEMENT_OPENING
       WHERE opening_id = ?`,
      [openingId]
    );

    res.status(200).json({
      message: "Placement opening deleted",
      openingId
    });
  } catch (error) {
    next(error);
  }
}

async function decideCdcPlacementApplication(req, res, next) {
  try {
    ensurePicCdcRole(req);

    const facultyId = String(req.user.id || "").trim();
    const department = String(req.user.department || "").trim().toUpperCase();
    const placementId = Number(req.params.placementId);
    const normalizedAction = String(req.body.action || "").trim().toUpperCase();

    if (Number.isNaN(placementId)) {
      const error = new Error("placementId must be numeric");
      error.status = 400;
      throw error;
    }

    if (!["ACCEPT", "REJECT"].includes(normalizedAction)) {
      const error = new Error("action must be ACCEPT or REJECT");
      error.status = 400;
      throw error;
    }

    const [rows] = await pool.execute(
      `SELECT p.placement_id, p.student_id, p.status
       FROM PLACEMENT p
       JOIN PLACEMENT_BRANCH pb ON pb.opening_id = p.opening_id
       WHERE p.placement_id = ?
         AND UPPER(pb.branch) = ?
       LIMIT 1`,
      [placementId, department]
    );

    if (!rows[0]) {
      const error = new Error("Placement application not found for your department");
      error.status = 404;
      throw error;
    }

    if (rows[0].status !== "Applied") {
      const error = new Error("Only applied applications can be reviewed");
      error.status = 409;
      throw error;
    }

    const nextStatus = normalizedAction === "ACCEPT" ? "Accepted" : "Rejected";

    await pool.execute(
      `UPDATE PLACEMENT
       SET status = ?, decision_at = NOW()
       WHERE placement_id = ?`,
      [nextStatus, placementId]
    );

    await pool.execute(
      `INSERT INTO NOTIFICATION (id, sent_by, message)
       VALUES (?, ?, ?)`,
      [rows[0].student_id, facultyId, `Your placement application (ID: ${placementId}) has been ${nextStatus.toLowerCase()}.`]
    );

    res.status(200).json({
      message: `Placement application ${nextStatus.toLowerCase()} successfully`,
      placementId,
      status: nextStatus
    });
  } catch (error) {
    next(error);
  }
}

async function getPicTtCourseTimetable(req, res, next) {
  try {
    ensurePicTtRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();

    const [rows] = await pool.execute(
      `SELECT
        t.timetable_id,
        t.offering_id,
        co.term_number,
        c.course_id,
        c.course_name,
        t.day,
        t.start_time,
        t.end_time,
        t.room_id,
        r.building
       FROM TIMETABLE t
       JOIN COURSE_OFFERING co ON co.offering_id = t.offering_id
       JOIN COURSE c ON c.course_id = co.course_id
       LEFT JOIN ROOM r ON r.room_id = t.room_id
       WHERE UPPER(c.branch) = ?
       ORDER BY co.term_number DESC,
                FIELD(t.day, 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'),
                t.start_time,
                c.course_id`,
      [department]
    );

    res.status(200).json({
      message: "Course timetable data retrieved",
      department,
      schedules: rows.map((row) => ({
        timetableId: row.timetable_id,
        offeringId: row.offering_id,
        termNumber: row.term_number,
        courseId: row.course_id,
        courseName: row.course_name,
        day: row.day,
        startTime: row.start_time,
        endTime: row.end_time,
        roomId: row.room_id,
        building: row.building
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function getPicTtRooms(req, res, next) {
  try {
    ensurePicTtRole(req);

    const [rows] = await pool.execute(
      `SELECT room_id, capacity, building
       FROM ROOM
       ORDER BY room_id`
    );

    res.status(200).json({
      message: "Room list retrieved",
      rooms: rows.map((row) => ({
        roomId: row.room_id,
        capacity: row.capacity,
        building: row.building
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function getPicTtOfferings(req, res, next) {
  try {
    ensurePicTtRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();

    const [rows] = await pool.execute(
      `SELECT
        co.offering_id,
        co.term_number,
        c.course_id,
        c.course_name
       FROM COURSE_OFFERING co
       JOIN COURSE c ON c.course_id = co.course_id
       WHERE UPPER(c.branch) = ?
       ORDER BY co.term_number DESC, c.course_id ASC`,
      [department]
    );

    res.status(200).json({
      message: "Offering list retrieved",
      offerings: rows.map((row) => ({
        offeringId: row.offering_id,
        termNumber: row.term_number,
        courseId: row.course_id,
        courseName: row.course_name
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function createPicTtCourseTimetable(req, res, next) {
  try {
    ensurePicTtRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const { offeringId, day, startTime, endTime, roomId } = req.body;
    const numericOfferingId = Number(offeringId);

    if (Number.isNaN(numericOfferingId) || !day || !startTime || !endTime || !roomId) {
      const error = new Error("offeringId, day, startTime, endTime and roomId are required");
      error.status = 400;
      throw error;
    }

    const [offeringRows] = await pool.execute(
      `SELECT co.offering_id
       FROM COURSE_OFFERING co
       JOIN COURSE c ON c.course_id = co.course_id
       WHERE co.offering_id = ?
         AND UPPER(c.branch) = ?
       LIMIT 1`,
      [numericOfferingId, department]
    );

    if (!offeringRows[0]) {
      const error = new Error("Offering not found for your department");
      error.status = 404;
      throw error;
    }

    const [result] = await pool.execute(
      `INSERT INTO TIMETABLE (offering_id, day, start_time, end_time, room_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        numericOfferingId,
        String(day).trim(),
        String(startTime).trim(),
        String(endTime).trim(),
        String(roomId).trim()
      ]
    );

    res.status(201).json({
      message: "Course timetable entry created",
      timetableId: result.insertId
    });
  } catch (error) {
    next(error);
  }
}

async function updatePicTtCourseTimetable(req, res, next) {
  try {
    ensurePicTtRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const timetableId = Number(req.params.timetableId);

    if (Number.isNaN(timetableId)) {
      const error = new Error("timetableId must be numeric");
      error.status = 400;
      throw error;
    }

    const [existingRows] = await pool.execute(
      `SELECT t.timetable_id
       FROM TIMETABLE t
       JOIN COURSE_OFFERING co ON co.offering_id = t.offering_id
       JOIN COURSE c ON c.course_id = co.course_id
       WHERE t.timetable_id = ?
         AND UPPER(c.branch) = ?
       LIMIT 1`,
      [timetableId, department]
    );

    if (!existingRows[0]) {
      const error = new Error("Timetable entry not found for your department");
      error.status = 404;
      throw error;
    }

    const updates = [];
    const values = [];
    const allowedFields = {
      day: "day",
      startTime: "start_time",
      endTime: "end_time",
      roomId: "room_id"
    };

    for (const [payloadKey, columnName] of Object.entries(allowedFields)) {
      if (req.body[payloadKey] != null && String(req.body[payloadKey]).trim() !== "") {
        updates.push(`${columnName} = ?`);
        values.push(String(req.body[payloadKey]).trim());
      }
    }

    if (updates.length === 0) {
      const error = new Error("At least one field is required to update");
      error.status = 400;
      throw error;
    }

    values.push(timetableId);

    await pool.execute(
      `UPDATE TIMETABLE
       SET ${updates.join(", ")}
       WHERE timetable_id = ?`,
      values
    );

    res.status(200).json({
      message: "Course timetable entry updated",
      timetableId
    });
  } catch (error) {
    next(error);
  }
}

async function deletePicTtCourseTimetable(req, res, next) {
  try {
    ensurePicTtRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const timetableId = Number(req.params.timetableId);

    if (Number.isNaN(timetableId)) {
      const error = new Error("timetableId must be numeric");
      error.status = 400;
      throw error;
    }

    const [existingRows] = await pool.execute(
      `SELECT t.timetable_id
       FROM TIMETABLE t
       JOIN COURSE_OFFERING co ON co.offering_id = t.offering_id
       JOIN COURSE c ON c.course_id = co.course_id
       WHERE t.timetable_id = ?
         AND UPPER(c.branch) = ?
       LIMIT 1`,
      [timetableId, department]
    );

    if (!existingRows[0]) {
      const error = new Error("Timetable entry not found for your department");
      error.status = 404;
      throw error;
    }

    await pool.execute(
      `DELETE FROM TIMETABLE
       WHERE timetable_id = ?`,
      [timetableId]
    );

    res.status(200).json({
      message: "Course timetable entry deleted",
      timetableId
    });
  } catch (error) {
    next(error);
  }
}

async function getPicTtExamTimetable(req, res, next) {
  try {
    ensurePicTtRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();

    const [rows] = await pool.execute(
      `SELECT
        e.exam_id,
        e.offering_id,
        co.term_number,
        c.course_id,
        c.course_name,
        e.exam_type,
        e.exam_date,
        e.exam_time,
        e.venue
       FROM EXAM e
       JOIN COURSE_OFFERING co ON co.offering_id = e.offering_id
       JOIN COURSE c ON c.course_id = co.course_id
       WHERE UPPER(c.branch) = ?
       ORDER BY e.exam_date DESC, e.exam_time DESC, c.course_id`,
      [department]
    );

    res.status(200).json({
      message: "Exam timetable data retrieved",
      department,
      schedules: rows.map((row) => ({
        examId: row.exam_id,
        offeringId: row.offering_id,
        termNumber: row.term_number,
        courseId: row.course_id,
        courseName: row.course_name,
        examType: row.exam_type,
        examDate: row.exam_date,
        examTime: row.exam_time,
        venue: row.venue
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function createPicTtExamTimetable(req, res, next) {
  try {
    ensurePicTtRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const { offeringId, examType, examDate, examTime, venue } = req.body;
    const numericOfferingId = Number(offeringId);

    if (Number.isNaN(numericOfferingId) || !examType || !examDate || !examTime || !venue) {
      const error = new Error("offeringId, examType, examDate, examTime and venue are required");
      error.status = 400;
      throw error;
    }

    const [offeringRows] = await pool.execute(
      `SELECT co.offering_id
       FROM COURSE_OFFERING co
       JOIN COURSE c ON c.course_id = co.course_id
       WHERE co.offering_id = ?
         AND UPPER(c.branch) = ?
       LIMIT 1`,
      [numericOfferingId, department]
    );

    if (!offeringRows[0]) {
      const error = new Error("Offering not found for your department");
      error.status = 404;
      throw error;
    }

    const [result] = await pool.execute(
      `INSERT INTO EXAM (offering_id, exam_type, exam_date, exam_time, venue)
       VALUES (?, ?, ?, ?, ?)`,
      [
        numericOfferingId,
        String(examType).trim(),
        String(examDate).trim(),
        String(examTime).trim(),
        String(venue).trim()
      ]
    );

    res.status(201).json({
      message: "Exam timetable entry created",
      examId: result.insertId
    });
  } catch (error) {
    next(error);
  }
}

async function updatePicTtExamTimetable(req, res, next) {
  try {
    ensurePicTtRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const examId = Number(req.params.examId);

    if (Number.isNaN(examId)) {
      const error = new Error("examId must be numeric");
      error.status = 400;
      throw error;
    }

    const [existingRows] = await pool.execute(
      `SELECT e.exam_id
       FROM EXAM e
       JOIN COURSE_OFFERING co ON co.offering_id = e.offering_id
       JOIN COURSE c ON c.course_id = co.course_id
       WHERE e.exam_id = ?
         AND UPPER(c.branch) = ?
       LIMIT 1`,
      [examId, department]
    );

    if (!existingRows[0]) {
      const error = new Error("Exam entry not found for your department");
      error.status = 404;
      throw error;
    }

    const updates = [];
    const values = [];
    const allowedFields = {
      examType: "exam_type",
      examDate: "exam_date",
      examTime: "exam_time",
      venue: "venue"
    };

    for (const [payloadKey, columnName] of Object.entries(allowedFields)) {
      if (req.body[payloadKey] != null && String(req.body[payloadKey]).trim() !== "") {
        updates.push(`${columnName} = ?`);
        values.push(String(req.body[payloadKey]).trim());
      }
    }

    if (updates.length === 0) {
      const error = new Error("At least one field is required to update");
      error.status = 400;
      throw error;
    }

    values.push(examId);

    await pool.execute(
      `UPDATE EXAM
       SET ${updates.join(", ")}
       WHERE exam_id = ?`,
      values
    );

    res.status(200).json({
      message: "Exam timetable entry updated",
      examId
    });
  } catch (error) {
    next(error);
  }
}

async function deletePicTtExamTimetable(req, res, next) {
  try {
    ensurePicTtRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const examId = Number(req.params.examId);

    if (Number.isNaN(examId)) {
      const error = new Error("examId must be numeric");
      error.status = 400;
      throw error;
    }

    const [existingRows] = await pool.execute(
      `SELECT e.exam_id
       FROM EXAM e
       JOIN COURSE_OFFERING co ON co.offering_id = e.offering_id
       JOIN COURSE c ON c.course_id = co.course_id
       WHERE e.exam_id = ?
         AND UPPER(c.branch) = ?
       LIMIT 1`,
      [examId, department]
    );

    if (!existingRows[0]) {
      const error = new Error("Exam entry not found for your department");
      error.status = 404;
      throw error;
    }

    await pool.execute(
      `DELETE FROM EXAM
       WHERE exam_id = ?`,
      [examId]
    );

    res.status(200).json({
      message: "Exam timetable entry deleted",
      examId
    });
  } catch (error) {
    next(error);
  }
}

async function getHodCourseManagement(req, res, next) {
  try {
    ensureHodRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();

    const [courseRows] = await pool.execute(
      `SELECT course_id, course_name, credits, branch
       FROM COURSE
       WHERE UPPER(branch) = ?
       ORDER BY course_id`,
      [department]
    );

    const [prerequisiteRows] = await pool.execute(
      `SELECT
        p.course_id,
        c1.course_name,
        p.prereq_course_id,
        c2.course_name AS prereq_course_name
       FROM PREREQUISITE p
       JOIN COURSE c1 ON c1.course_id = p.course_id
       LEFT JOIN COURSE c2 ON c2.course_id = p.prereq_course_id
       WHERE UPPER(c1.branch) = ?
       ORDER BY p.course_id, p.prereq_course_id`,
      [department]
    );

    const [offeringRows] = await pool.execute(
      `SELECT
        co.offering_id,
        co.course_id,
        c.course_name,
        co.term_number,
        co.type,
        co.faculty_id,
        f.name AS faculty_name
       FROM COURSE_OFFERING co
       JOIN COURSE c ON c.course_id = co.course_id
       LEFT JOIN FACULTY f ON f.faculty_id = co.faculty_id
       WHERE UPPER(c.branch) = ?
       ORDER BY co.term_number, co.course_id`,
      [department]
    );

    const [facultyRows] = await pool.execute(
      `SELECT faculty_id, name
       FROM FACULTY
       WHERE UPPER(department) = ?
       ORDER BY name, faculty_id`,
      [department]
    );

    res.status(200).json({
      message: "HOD course management data retrieved",
      department,
      courses: courseRows.map((row) => ({
        courseId: row.course_id,
        courseName: row.course_name,
        credits: row.credits,
        branch: row.branch
      })),
      prerequisites: prerequisiteRows.map((row) => ({
        courseId: row.course_id,
        courseName: row.course_name,
        prereqCourseId: row.prereq_course_id,
        prereqCourseName: row.prereq_course_name
      })),
      offerings: offeringRows.map((row) => ({
        offeringId: row.offering_id,
        courseId: row.course_id,
        courseName: row.course_name,
        termNumber: row.term_number,
        type: row.type,
        facultyId: row.faculty_id,
        facultyName: row.faculty_name
      })),
      facultyMembers: facultyRows.map((row) => ({
        facultyId: row.faculty_id,
        name: row.name
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function createHodCourseOffering(req, res, next) {
  try {
    ensureHodRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const { courseId, termNumber, type, facultyId } = req.body;

    const normalizedCourseId = String(courseId || "").trim().toUpperCase();
    let numericTermNumber = Number(termNumber);
    const normalizedType = String(type || "").trim();
    const normalizedFacultyId = String(facultyId || "").trim();

    if (!normalizedCourseId || !normalizedType) {
      const error = new Error("courseId and type are required");
      error.status = 400;
      throw error;
    }

    if (Number.isNaN(numericTermNumber) || numericTermNumber <= 0) {
      const [termRows] = await pool.execute(
        `SELECT COALESCE(MAX(current_term_number), 1) AS current_term
         FROM STUDENT
         WHERE UPPER(branch) = ?`,
        [department]
      );
      numericTermNumber = Number(termRows[0]?.current_term || 1);
    }

    await assertCourseInDepartment(normalizedCourseId, department);
    if (normalizedFacultyId) {
      await assertFacultyInDepartment(normalizedFacultyId, department);
    }

    const [result] = await pool.execute(
      `INSERT INTO COURSE_OFFERING (course_id, type, faculty_id, term_number)
       VALUES (?, ?, ?, ?)`,
      [
        normalizedCourseId,
        normalizedType,
        normalizedFacultyId || null,
        numericTermNumber
      ]
    );

    res.status(201).json({
      message: "Course offering created successfully",
      offeringId: result.insertId
    });
  } catch (error) {
    next(error);
  }
}

async function updateHodCourseOffering(req, res, next) {
  try {
    ensureHodRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const offeringId = Number(req.params.offeringId);

    if (Number.isNaN(offeringId)) {
      const error = new Error("offeringId must be numeric");
      error.status = 400;
      throw error;
    }

    const [existingRows] = await pool.execute(
      `SELECT co.offering_id, co.course_id
       FROM COURSE_OFFERING co
       JOIN COURSE c ON c.course_id = co.course_id
       WHERE co.offering_id = ?
         AND UPPER(c.branch) = ?
       LIMIT 1`,
      [offeringId, department]
    );

    if (!existingRows[0]) {
      const error = new Error("Course offering not found in your department");
      error.status = 404;
      throw error;
    }

    const updates = [];
    const values = [];

    if (req.body.termNumber != null && String(req.body.termNumber).trim() !== "") {
      const numericTermNumber = Number(req.body.termNumber);
      if (Number.isNaN(numericTermNumber) || numericTermNumber <= 0) {
        const error = new Error("termNumber must be a positive number");
        error.status = 400;
        throw error;
      }
      updates.push("term_number = ?");
      values.push(numericTermNumber);
    }

    if (req.body.type != null && String(req.body.type).trim() !== "") {
      updates.push("type = ?");
      values.push(String(req.body.type).trim());
    }

    if (req.body.facultyId != null) {
      const normalizedFacultyId = String(req.body.facultyId).trim();
      if (normalizedFacultyId) {
        await assertFacultyInDepartment(normalizedFacultyId, department);
        updates.push("faculty_id = ?");
        values.push(normalizedFacultyId);
      } else {
        updates.push("faculty_id = ?");
        values.push(null);
      }
    }

    if (updates.length === 0) {
      const error = new Error("At least one field is required to update");
      error.status = 400;
      throw error;
    }

    values.push(offeringId);

    await pool.execute(
      `UPDATE COURSE_OFFERING
       SET ${updates.join(", ")}
       WHERE offering_id = ?`,
      values
    );

    res.status(200).json({
      message: "Course offering updated successfully",
      offeringId
    });
  } catch (error) {
    next(error);
  }
}

async function deleteHodCourseOffering(req, res, next) {
  try {
    ensureHodRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const offeringId = Number(req.params.offeringId);

    if (Number.isNaN(offeringId)) {
      const error = new Error("offeringId must be numeric");
      error.status = 400;
      throw error;
    }

    const [existingRows] = await pool.execute(
      `SELECT co.offering_id
       FROM COURSE_OFFERING co
       JOIN COURSE c ON c.course_id = co.course_id
       WHERE co.offering_id = ?
         AND UPPER(c.branch) = ?
       LIMIT 1`,
      [offeringId, department]
    );

    if (!existingRows[0]) {
      const error = new Error("Course offering not found in your department");
      error.status = 404;
      throw error;
    }

    await pool.execute(
      `DELETE FROM COURSE_OFFERING
       WHERE offering_id = ?`,
      [offeringId]
    );

    res.status(200).json({
      message: "Course offering deleted successfully",
      offeringId
    });
  } catch (error) {
    next(error);
  }
}

async function createHodCourse(req, res, next) {
  try {
    ensureHodRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const { courseId, courseName, credits } = req.body;

    const normalizedCourseId = String(courseId || "").trim().toUpperCase();
    const normalizedCourseName = String(courseName || "").trim();
    const numericCredits = Number(credits);

    if (!normalizedCourseId || !normalizedCourseName || Number.isNaN(numericCredits) || numericCredits <= 0) {
      const error = new Error("courseId, courseName and valid credits are required");
      error.status = 400;
      throw error;
    }

    await pool.execute(
      `INSERT INTO COURSE (course_id, course_name, credits, branch)
       VALUES (?, ?, ?, ?)`,
      [normalizedCourseId, normalizedCourseName, numericCredits, department]
    );

    res.status(201).json({
      message: "Course created successfully",
      courseId: normalizedCourseId
    });
  } catch (error) {
    next(error);
  }
}

async function updateHodCourse(req, res, next) {
  try {
    ensureHodRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const courseId = String(req.params.courseId || "").trim().toUpperCase();

    if (!courseId) {
      const error = new Error("courseId is required");
      error.status = 400;
      throw error;
    }

    await assertCourseInDepartment(courseId, department);

    const updates = [];
    const values = [];

    if (req.body.courseName != null && String(req.body.courseName).trim() !== "") {
      updates.push("course_name = ?");
      values.push(String(req.body.courseName).trim());
    }

    if (req.body.credits != null && String(req.body.credits).trim() !== "") {
      const numericCredits = Number(req.body.credits);
      if (Number.isNaN(numericCredits) || numericCredits <= 0) {
        const error = new Error("credits must be a positive number");
        error.status = 400;
        throw error;
      }
      updates.push("credits = ?");
      values.push(numericCredits);
    }

    if (updates.length === 0) {
      const error = new Error("At least one field is required to update");
      error.status = 400;
      throw error;
    }

    values.push(courseId);

    await pool.execute(
      `UPDATE COURSE
       SET ${updates.join(", ")}
       WHERE course_id = ?`,
      values
    );

    res.status(200).json({
      message: "Course updated successfully",
      courseId
    });
  } catch (error) {
    next(error);
  }
}

async function deleteHodCourse(req, res, next) {
  try {
    ensureHodRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const courseId = String(req.params.courseId || "").trim().toUpperCase();

    if (!courseId) {
      const error = new Error("courseId is required");
      error.status = 400;
      throw error;
    }

    await assertCourseInDepartment(courseId, department);

    await pool.execute(
      `DELETE FROM COURSE
       WHERE course_id = ?`,
      [courseId]
    );

    res.status(200).json({
      message: "Course deleted successfully",
      courseId
    });
  } catch (error) {
    next(error);
  }
}

async function addHodCoursePrerequisite(req, res, next) {
  try {
    ensureHodRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const courseId = String(req.params.courseId || "").trim().toUpperCase();
    const prereqCourseId = String(req.body.prereqCourseId || "").trim().toUpperCase();

    if (!courseId || !prereqCourseId) {
      const error = new Error("courseId and prereqCourseId are required");
      error.status = 400;
      throw error;
    }

    if (courseId === prereqCourseId) {
      const error = new Error("A course cannot be prerequisite of itself");
      error.status = 400;
      throw error;
    }

    await assertCourseInDepartment(courseId, department);

    const [prereqRows] = await pool.execute(
      `SELECT course_id
       FROM COURSE
       WHERE course_id = ?
       LIMIT 1`,
      [prereqCourseId]
    );

    if (!prereqRows[0]) {
      const error = new Error("Prerequisite course not found");
      error.status = 404;
      throw error;
    }

    await pool.execute(
      `INSERT INTO PREREQUISITE (course_id, prereq_course_id)
       VALUES (?, ?)`,
      [courseId, prereqCourseId]
    );

    res.status(201).json({
      message: "Prerequisite added successfully",
      courseId,
      prereqCourseId
    });
  } catch (error) {
    next(error);
  }
}

async function updateHodCoursePrerequisite(req, res, next) {
  try {
    ensureHodRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const courseId = String(req.params.courseId || "").trim().toUpperCase();
    const oldPrereqCourseId = String(req.params.prereqCourseId || "").trim().toUpperCase();
    const newPrereqCourseId = String(req.body.prereqCourseId || "").trim().toUpperCase();

    if (!courseId || !oldPrereqCourseId || !newPrereqCourseId) {
      const error = new Error("courseId, existing prereqCourseId and new prereqCourseId are required");
      error.status = 400;
      throw error;
    }

    if (courseId === newPrereqCourseId) {
      const error = new Error("A course cannot be prerequisite of itself");
      error.status = 400;
      throw error;
    }

    await assertCourseInDepartment(courseId, department);

    const [existingRows] = await pool.execute(
      `SELECT course_id
       FROM PREREQUISITE
       WHERE course_id = ?
         AND prereq_course_id = ?
       LIMIT 1`,
      [courseId, oldPrereqCourseId]
    );

    if (!existingRows[0]) {
      const error = new Error("Existing prerequisite relation not found");
      error.status = 404;
      throw error;
    }

    const [prereqRows] = await pool.execute(
      `SELECT course_id
       FROM COURSE
       WHERE course_id = ?
       LIMIT 1`,
      [newPrereqCourseId]
    );

    if (!prereqRows[0]) {
      const error = new Error("New prerequisite course not found");
      error.status = 404;
      throw error;
    }

    await pool.execute(
      `UPDATE PREREQUISITE
       SET prereq_course_id = ?
       WHERE course_id = ?
         AND prereq_course_id = ?`,
      [newPrereqCourseId, courseId, oldPrereqCourseId]
    );

    res.status(200).json({
      message: "Prerequisite updated successfully",
      courseId,
      prereqCourseId: newPrereqCourseId
    });
  } catch (error) {
    next(error);
  }
}

async function deleteHodCoursePrerequisite(req, res, next) {
  try {
    ensureHodRole(req);

    const department = String(req.user.department || "").trim().toUpperCase();
    const courseId = String(req.params.courseId || "").trim().toUpperCase();
    const prereqCourseId = String(req.params.prereqCourseId || "").trim().toUpperCase();

    if (!courseId || !prereqCourseId) {
      const error = new Error("courseId and prereqCourseId are required");
      error.status = 400;
      throw error;
    }

    await assertCourseInDepartment(courseId, department);

    const [result] = await pool.execute(
      `DELETE FROM PREREQUISITE
       WHERE course_id = ?
         AND prereq_course_id = ?`,
      [courseId, prereqCourseId]
    );

    if (!result.affectedRows) {
      const error = new Error("Prerequisite relation not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      message: "Prerequisite removed successfully",
      courseId,
      prereqCourseId
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
  downloadFacultyTAResume,
  getFacultyLeaveApplications,
  decideFacultyLeaveApplication,
  getCdcInternshipManagement,
  createCdcInternshipOpening,
  updateCdcInternshipOpening,
  deleteCdcInternshipOpening,
  decideCdcInternshipApplication,
  getCdcPlacementManagement,
  createCdcPlacementOpening,
  updateCdcPlacementOpening,
  deleteCdcPlacementOpening,
  decideCdcPlacementApplication,
  getPicTtCourseTimetable,
  getPicTtRooms,
  getPicTtOfferings,
  createPicTtCourseTimetable,
  updatePicTtCourseTimetable,
  deletePicTtCourseTimetable,
  getPicTtExamTimetable,
  createPicTtExamTimetable,
  updatePicTtExamTimetable,
  deletePicTtExamTimetable,
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
};
