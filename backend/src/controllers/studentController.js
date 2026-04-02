const pool = require("../config/db");

async function getStudentDetails(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT 
        student_id,
        name,
        batch,
        college_email,
        personal_email,
        phone,
        dob,
        advisor_id
       FROM STUDENT
       WHERE student_id = ?
       LIMIT 1`,
      [studentId]
    );

    if (!rows[0]) {
      const error = new Error("Student profile not found");
      error.status = 404;
      throw error;
    }

    const student = rows[0];

    res.status(200).json({
      message: "Student details retrieved",
      student: {
        id: student.student_id,
        name: student.name,
        batch: student.batch,
        collegeEmail: student.college_email,
        personalEmail: student.personal_email,
        phone: student.phone,
        dob: student.dob,
        advisorId: student.advisor_id
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getStudentCourses(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT 
        c.course_id,
        c.course_name,
        c.credits,
        t.year,
        t.semester,
        f.name AS faculty_name,
        e.enrollment_date
       FROM ENROLLMENT e
       JOIN COURSE_OFFERING co ON e.offering_id = co.offering_id
       JOIN COURSE c ON co.course_id = c.course_id
       JOIN TERM t ON co.term_id = t.term_id
       LEFT JOIN FACULTY f ON co.faculty_id = f.faculty_id
       WHERE e.student_id = ?
       ORDER BY t.year DESC, 
                CASE 
                  WHEN t.semester = 'Autumn' THEN 1
                  WHEN t.semester = 'Spring' THEN 2
                  ELSE 3
                END DESC,
                c.course_id
       LIMIT 50`,
      [studentId]
    );

    if (!rows || rows.length === 0) {
      return res.status(200).json({
        message: "No courses enrolled",
        courses: []
      });
    }

    const courses = rows.map(row => ({
      courseId: row.course_id,
      courseName: row.course_name,
      credits: row.credits,
      year: row.year,
      semester: row.semester,
      facultyName: row.faculty_name || "Unassigned",
      enrollmentDate: row.enrollment_date
    }));

    res.status(200).json({
      message: "Student courses retrieved",
      courses
    });
  } catch (error) {
    next(error);
  }
}

async function getStudentTranscript(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT 
        at.transcript_id,
        at.course_id,
        c.course_name,
        c.credits,
        t.year,
        t.semester,
        at.mid_sem,
        at.end_sem,
        at.internal,
        at.total,
        at.grade,
        at.recorded_date
       FROM ACADEMIC_TRANSCRIPT at
       JOIN COURSE c ON at.course_id = c.course_id
       JOIN TERM t ON at.term_id = t.term_id
       WHERE at.student_id = ?
       ORDER BY t.year DESC, 
                CASE 
                  WHEN t.semester = 'Autumn' THEN 1
                  WHEN t.semester = 'Spring' THEN 2
                  ELSE 3
                END DESC,
                at.course_id
       LIMIT 100`,
      [studentId]
    );

    if (!rows || rows.length === 0) {
      return res.status(200).json({
        message: "No transcript records found",
        transcript: []
      });
    }

    const transcript = rows.map(row => ({
      transcriptId: row.transcript_id,
      courseId: row.course_id,
      courseName: row.course_name,
      credits: row.credits,
      year: row.year,
      semester: row.semester,
      scores: {
        midSem: row.mid_sem,
        endSem: row.end_sem,
        internal: row.internal,
        total: row.total
      },
      grade: row.grade || "N/A",
      recordedDate: row.recorded_date
    }));

    res.status(200).json({
      message: "Academic transcript retrieved",
      transcript
    });
  } catch (error) {
    next(error);
  }
}

async function getStudentAttendance(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT
        a.attendance_id,
        a.count,
        c.course_id,
        c.course_name,
        c.credits,
        t.year,
        t.semester,
        f.name AS faculty_name
       FROM ATTENDANCE a
       JOIN COURSE_OFFERING co ON a.offering_id = co.offering_id
       JOIN COURSE c ON co.course_id = c.course_id
       JOIN TERM t ON co.term_id = t.term_id
       LEFT JOIN FACULTY f ON co.faculty_id = f.faculty_id
       WHERE a.student_id = ?
       ORDER BY a.attendance_id DESC, c.course_id
       LIMIT 200`,
      [studentId]
    );

    if (!rows || rows.length === 0) {
      return res.status(200).json({
        message: "No attendance records found",
        attendance: []
      });
    }

    const attendance = rows.map(row => ({
      attendanceId: row.attendance_id,
      count: row.count,
      courseId: row.course_id,
      courseName: row.course_name,
      credits: row.credits,
      year: row.year,
      semester: row.semester,
      facultyName: row.faculty_name || "Unassigned"
    }));

    res.status(200).json({
      message: "Attendance records retrieved",
      attendance
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStudentDetails,
  getStudentCourses,
  getStudentTranscript,
  getStudentAttendance
};
