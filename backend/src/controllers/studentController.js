const pool = require("../config/db");

async function getStudentCareerContext(studentId) {
  const [studentRows] = await pool.execute(
    `SELECT student_id, current_term_number, branch
     FROM STUDENT
     WHERE student_id = ?
     LIMIT 1`,
    [studentId]
  );

  if (!studentRows[0]) {
    const error = new Error("Student profile not found");
    error.status = 404;
    throw error;
  }

  const currentTermNumber = Number(studentRows[0].current_term_number);
  const branch = String(studentRows[0].branch || "").trim().toUpperCase();

  const [internshipRows] = await pool.execute(
    `SELECT
        internship_id,
        status
     FROM INTERNSHIP
     WHERE student_id = ?
     ORDER BY internship_id DESC`,
    [studentId]
  );

  const [placementRows] = await pool.execute(
    `SELECT
        placement_id,
        status
     FROM PLACEMENT
     WHERE student_id = ?
     ORDER BY placement_id DESC`,
    [studentId]
  );

  const hasAcceptedInternship = internshipRows.some((row) => row.status === "Accepted");
  const hasAcceptedPlacement = placementRows.some((row) => row.status === "Accepted");

  return {
    currentTermNumber,
    branch,
    hasInternship: Boolean(internshipRows[0]),
    hasPlacement: Boolean(placementRows[0]),
    hasAcceptedInternship,
    hasAcceptedPlacement
  };
}

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
        s.student_id,
        s.name,
        s.batch,
        s.branch,
        s.college_email,
        s.personal_email,
        s.phone,
        s.dob,
        s.advisor_id,
        f.name AS advisor_name
       FROM STUDENT s
       LEFT JOIN FACULTY f ON f.faculty_id = s.advisor_id
       WHERE s.student_id = ?
       LIMIT 1`,
      [studentId]
    );

    if (!rows[0]) {
      const error = new Error("Student profile not found");
      error.status = 404;
      throw error;
    }

    const student = rows[0];

    // Check if student is a TA
    const [taRows] = await pool.execute(
      `SELECT ta_id, role, term_number
       FROM TA_ASSIGNMENT
       WHERE student_id = ?
       LIMIT 1`,
      [studentId]
    );

    const isTA = taRows && taRows.length > 0;
    const taRole = isTA ? taRows[0].role : null;
    const taTermNumber = isTA ? taRows[0].term_number : null;

    res.status(200).json({
      message: "Student details retrieved",
      student: {
        id: student.student_id,
        name: student.name,
        batch: student.batch,
        branch: student.branch,
        collegeEmail: student.college_email,
        personalEmail: student.personal_email,
        phone: student.phone,
        dob: student.dob,
        advisorId: student.advisor_id,
        advisorName: student.advisor_name || "N/A",
        isTA: isTA,
        taRole: taRole,
        taTermNumber: taTermNumber
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
        co.term_number,
        f.name AS faculty_name,
        e.enrollment_date
       FROM ENROLLMENT e
       JOIN COURSE_OFFERING co ON e.offering_id = co.offering_id
       JOIN COURSE c ON co.course_id = c.course_id
       LEFT JOIN FACULTY f ON co.faculty_id = f.faculty_id
       WHERE e.student_id = ?
       ORDER BY co.term_number DESC,
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
      termNumber: row.term_number,
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
        at.term_number,
        at.mid_sem,
        at.end_sem,
        at.internal,
        at.total,
        at.grade,
        at.recorded_date
       FROM ACADEMIC_TRANSCRIPT at
       JOIN COURSE c ON at.course_id = c.course_id
       WHERE at.student_id = ?
       ORDER BY at.term_number DESC,
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
      termNumber: row.term_number,
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

async function getStudentResults(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT
        sem.term_number,
        rh.sgpa,
        rh.cgpa
       FROM (
        SELECT 1 AS term_number
        UNION ALL SELECT 2
        UNION ALL SELECT 3
        UNION ALL SELECT 4
        UNION ALL SELECT 5
        UNION ALL SELECT 6
        UNION ALL SELECT 7
        UNION ALL SELECT 8
       ) sem
       LEFT JOIN RESULT_HISTORY rh
         ON rh.student_id = ?
        AND rh.term_number = sem.term_number
       ORDER BY sem.term_number ASC`,
      [studentId]
    );

    const results = rows.map((row) => ({
      semNumber: row.term_number,
      sgpa: row.sgpa,
      cgpa: row.cgpa
    }));

    res.status(200).json({
      message: "Semester results retrieved",
      results
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
        a.classes_attended_count,
        co.total_classes_conducted,
        c.course_id,
        c.course_name,
        c.credits,
        co.term_number,
        f.name AS faculty_name
       FROM ATTENDANCE a
       JOIN COURSE_OFFERING co ON a.offering_id = co.offering_id
       JOIN COURSE c ON co.course_id = c.course_id
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
      classesAttendedCount: row.classes_attended_count,
      totalClassesConducted: row.total_classes_conducted,
      courseId: row.course_id,
      courseName: row.course_name,
      credits: row.credits,
      termNumber: row.term_number,
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

async function getStudentExams(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT
        ex.exam_id,
        ex.exam_type,
        ex.exam_date,
        ex.exam_time,
        ex.venue,
        c.course_id,
        c.course_name,
        c.credits,
        co.term_number,
        f.name AS faculty_name
       FROM ENROLLMENT e
       JOIN COURSE_OFFERING co ON e.offering_id = co.offering_id
       JOIN COURSE c ON co.course_id = c.course_id
       JOIN EXAM ex ON ex.offering_id = co.offering_id
       LEFT JOIN FACULTY f ON co.faculty_id = f.faculty_id
       WHERE e.student_id = ?
       ORDER BY ex.exam_date ASC, ex.exam_time ASC, c.course_id ASC`,
      [studentId]
    );

    const exams = rows.map((row) => ({
      examId: row.exam_id,
      examType: row.exam_type,
      examDate: row.exam_date,
      examTime: row.exam_time,
      venue: row.venue,
      courseId: row.course_id,
      courseName: row.course_name,
      credits: row.credits,
      termNumber: row.term_number,
      facultyName: row.faculty_name || "Unassigned"
    }));

    const midSemExams = exams.filter((exam) => exam.examType === "MidSem");
    const endSemExams = exams.filter((exam) => exam.examType === "EndSem");

    res.status(200).json({
      message: "Exam schedule retrieved",
      midSemExams,
      endSemExams
    });
  } catch (error) {
    next(error);
  }
}

async function getStudentInternships(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;
    const careerContext = await getStudentCareerContext(studentId);
    const canApplyInternship = [5, 6].includes(careerContext.currentTermNumber) && !careerContext.hasAcceptedInternship;

    if (careerContext.hasAcceptedInternship) {
      await pool.execute(
        `UPDATE INTERNSHIP
         SET status = 'Rejected'
         WHERE student_id = ?
           AND status = 'Applied'`,
        [studentId]
      );
    }

    const [rows] = await pool.execute(
      `SELECT
        internship_id,
        opening_id,
        company,
        role,
        package,
        duration,
        status,
        applied_at,
        decision_at
       FROM INTERNSHIP
       WHERE student_id = ?
       ORDER BY internship_id DESC`,
      [studentId]
    );

    const [openingRows] = await pool.execute(
      `SELECT DISTINCT
        io.opening_id,
        io.company,
        io.role,
        io.stipend,
        io.duration_months
       FROM INTERNSHIP_OPENING io
       JOIN INTERNSHIP_BRANCH ib ON io.opening_id = ib.opening_id
       WHERE io.is_active = 1
         AND ib.branch = ?
       ORDER BY io.company, io.role`,
      [careerContext.branch]
    );

    const internships = rows.map((row) => ({
      internshipId: row.internship_id,
      openingId: row.opening_id,
      company: row.company,
      role: row.role,
      package: row.package,
      duration: row.duration,
      status: row.status,
      appliedAt: row.applied_at,
      decisionAt: row.decision_at
    }));

    const openings = openingRows.map((row) => ({
      openingId: row.opening_id,
      company: row.company,
      role: row.role,
      stipend: row.stipend,
      durationMonths: row.duration_months
    }));

    const appliedToOpenings = rows
      .filter((row) => row.status !== "Rejected")
      .map((row) => row.opening_id);

    res.status(200).json({
      message: "Internship records retrieved",
      currentTermNumber: careerContext.currentTermNumber,
      hasInternship: careerContext.hasInternship,
      hasAcceptedInternship: careerContext.hasAcceptedInternship,
      canApply: canApplyInternship,
      internships,
      openings,
      appliedToOpenings
    });
  } catch (error) {
    next(error);
  }
}

async function applyInternship(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;
    const { openingId } = req.body;

    if (!openingId) {
      const error = new Error("openingId is required");
      error.status = 400;
      throw error;
    }

    const careerContext = await getStudentCareerContext(studentId);

    if (![5, 6].includes(careerContext.currentTermNumber)) {
      const error = new Error("Internship applications are allowed only for semester 5 or 6");
      error.status = 403;
      throw error;
    }

    if (careerContext.hasAcceptedInternship) {
      const error = new Error("You have already secured an internship");
      error.status = 409;
      throw error;
    }

    const [existingApplicationRows] = await pool.execute(
      `SELECT internship_id, status
       FROM INTERNSHIP
       WHERE student_id = ?
         AND opening_id = ?
       LIMIT 1`,
      [studentId, openingId]
    );

    if (existingApplicationRows[0] && existingApplicationRows[0].status !== "Rejected") {
      const error = new Error("You have already applied for this internship");
      error.status = 409;
      throw error;
    }

    const [openingRows] = await pool.execute(
      `SELECT opening_id, company, role, stipend, duration_months
       FROM INTERNSHIP_OPENING
       WHERE opening_id = ?
         AND is_active = 1
       LIMIT 1`,
      [openingId]
    );

    if (!openingRows[0]) {
      const error = new Error("Internship opening not found or inactive");
      error.status = 404;
      throw error;
    }

    const opening = openingRows[0];

    await pool.execute(
      `INSERT INTO INTERNSHIP (student_id, opening_id, company, role, package, duration, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Applied')`,
      [studentId, opening.opening_id, opening.company, opening.role, opening.stipend, opening.duration_months]
    );

    res.status(201).json({
      message: "Internship application successful",
      internship: {
        company: opening.company,
        role: opening.role,
        package: opening.stipend,
        duration: opening.duration_months
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getStudentPlacements(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;
    const careerContext = await getStudentCareerContext(studentId);
    const canApplyPlacement = [7, 8].includes(careerContext.currentTermNumber) && !careerContext.hasAcceptedInternship && !careerContext.hasAcceptedPlacement;

    if (careerContext.hasAcceptedPlacement) {
      await pool.execute(
        `UPDATE PLACEMENT
         SET status = 'Rejected'
         WHERE student_id = ?
           AND status = 'Applied'`,
        [studentId]
      );
    }

    const [rows] = await pool.execute(
      `SELECT
        placement_id,
        opening_id,
        company,
        role,
        package,
        status,
        applied_at,
        decision_at
       FROM PLACEMENT
       WHERE student_id = ?
       ORDER BY placement_id DESC`,
      [studentId]
    );

    const [openingRows] = await pool.execute(
      `SELECT DISTINCT
        po.opening_id,
        po.company,
        po.role,
        po.ctc
       FROM PLACEMENT_OPENING po
       JOIN PLACEMENT_BRANCH pb ON po.opening_id = pb.opening_id
       WHERE po.is_active = 1
         AND pb.branch = ?
       ORDER BY po.company, po.role`,
      [careerContext.branch]
    );

    const placements = rows.map((row) => ({
      placementId: row.placement_id,
      openingId: row.opening_id,
      company: row.company,
      role: row.role,
      package: row.package,
      status: row.status,
      appliedAt: row.applied_at,
      decisionAt: row.decision_at
    }));

    const openings = openingRows.map((row) => ({
      openingId: row.opening_id,
      company: row.company,
      role: row.role,
      ctc: row.ctc
    }));

    const appliedToOpenings = rows
      .filter((row) => row.status !== "Rejected")
      .map((row) => row.opening_id);

    res.status(200).json({
      message: "Placement records retrieved",
      currentTermNumber: careerContext.currentTermNumber,
      hasInternship: careerContext.hasInternship,
      hasPlacement: careerContext.hasPlacement,
      hasAcceptedInternship: careerContext.hasAcceptedInternship,
      hasAcceptedPlacement: careerContext.hasAcceptedPlacement,
      canApply: canApplyPlacement,
      placements,
      openings,
      appliedToOpenings
    });
  } catch (error) {
    next(error);
  }
}

async function applyPlacement(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;
    const { openingId } = req.body;

    if (!openingId) {
      const error = new Error("openingId is required");
      error.status = 400;
      throw error;
    }

    const careerContext = await getStudentCareerContext(studentId);

    if (![7, 8].includes(careerContext.currentTermNumber)) {
      const error = new Error("Placement applications are allowed only for semester 7 or 8");
      error.status = 403;
      throw error;
    }

    if (careerContext.hasAcceptedInternship) {
      const error = new Error("Students with secured internships cannot apply for placements");
      error.status = 403;
      throw error;
    }

    if (careerContext.hasAcceptedPlacement) {
      const error = new Error("You have already secured a placement");
      error.status = 409;
      throw error;
    }

    const [existingApplicationRows] = await pool.execute(
      `SELECT placement_id, status
       FROM PLACEMENT
       WHERE student_id = ?
         AND opening_id = ?
       LIMIT 1`,
      [studentId, openingId]
    );

    if (existingApplicationRows[0] && existingApplicationRows[0].status !== "Rejected") {
      const error = new Error("You have already applied for this placement");
      error.status = 409;
      throw error;
    }

    const [openingRows] = await pool.execute(
      `SELECT opening_id, company, role, ctc
       FROM PLACEMENT_OPENING
       WHERE opening_id = ?
         AND is_active = 1
       LIMIT 1`,
      [openingId]
    );

    if (!openingRows[0]) {
      const error = new Error("Placement opening not found or inactive");
      error.status = 404;
      throw error;
    }

    const opening = openingRows[0];

    await pool.execute(
      `INSERT INTO PLACEMENT (student_id, opening_id, company, role, package, status)
       VALUES (?, ?, ?, ?, ?, 'Applied')`,
      [studentId, opening.opening_id, opening.company, opening.role, opening.ctc]
    );

    res.status(201).json({
      message: "Placement application successful",
      placement: {
        company: opening.company,
        role: opening.role,
        package: opening.ctc
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getStudentTimetable(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;

    const [studentRows] = await pool.execute(
      `SELECT student_id, current_term_number, branch
       FROM STUDENT
       WHERE student_id = ?
       LIMIT 1`,
      [studentId]
    );

    if (!studentRows[0]) {
      const error = new Error("Student profile not found");
      error.status = 404;
      throw error;
    }

    const student = studentRows[0];
    const studentBranch = String(student.branch || "").trim().toUpperCase();

    if (!studentBranch) {
      return res.status(200).json({
        message: "Student branch is not set",
        currentTermNumber: student.current_term_number,
        timetable: []
      });
    }

    const [rows] = await pool.execute(
      `SELECT
        co.offering_id,
        c.course_id,
        c.course_name,
        c.credits,
        co.term_number,
        t.day,
        t.start_time,
        t.end_time,
        t.room_id,
        f.name AS faculty_name
       FROM COURSE_OFFERING co
       JOIN ENROLLMENT e ON e.offering_id = co.offering_id
       JOIN COURSE c ON co.course_id = c.course_id
       JOIN TIMETABLE t ON t.offering_id = co.offering_id
       LEFT JOIN FACULTY f ON co.faculty_id = f.faculty_id
       WHERE co.term_number = ?
         AND e.student_id = ?
         AND (
           (
             co.type IN ('Core', 'Elective')
             AND UPPER(c.branch) = ?
           )
           OR
           (
             co.type IN ('Lateral', 'Breadth')
             AND UPPER(c.branch) <> ?
           )
           OR
           co.type = 'Lab'
         )
       ORDER BY FIELD(t.day, 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'), t.start_time, c.course_id`,
      [student.current_term_number, studentId, studentBranch, studentBranch]
    );

    const timetable = rows.map((row) => ({
      offeringId: row.offering_id,
      courseId: row.course_id,
      courseName: row.course_name,
      credits: row.credits,
      termNumber: row.term_number,
      day: row.day,
      startTime: row.start_time,
      endTime: row.end_time,
      roomId: row.room_id || "TBA",
      facultyName: row.faculty_name || "Unassigned"
    }));

    res.status(200).json({
      message: "Student timetable retrieved",
      currentTermNumber: student.current_term_number,
      timetable
    });
  } catch (error) {
    next(error);
  }
}

async function getEnrollmentOptions(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;

    const [studentRows] = await pool.execute(
      `SELECT student_id, current_term_number, branch
       FROM STUDENT
       WHERE student_id = ?
       LIMIT 1`,
      [studentId]
    );

    if (!studentRows[0]) {
      const error = new Error("Student profile not found");
      error.status = 404;
      throw error;
    }

    const student = studentRows[0];
    const studentBranch = String(student.branch || "").trim().toUpperCase();

    if (!studentBranch) {
      return res.status(200).json({
        message: "Student branch is not set",
        enrollmentOptions: []
      });
    }

    const [rows] = await pool.execute(
      `SELECT
        co.offering_id,
        c.course_id,
        c.course_name,
        c.branch,
        c.credits,
        co.type,
        co.term_number,
        f.name AS faculty_name
       FROM COURSE_OFFERING co
       JOIN COURSE c ON co.course_id = c.course_id
       LEFT JOIN FACULTY f ON co.faculty_id = f.faculty_id
       WHERE co.term_number = ?
         AND NOT EXISTS (
           SELECT 1
           FROM ENROLLMENT e
           WHERE e.student_id = ?
             AND e.offering_id = co.offering_id
         )
         AND (
           (
             co.type IN ('Core', 'Elective')
             AND UPPER(c.branch) = ?
           )
           OR
           (
             co.type IN ('Lateral', 'Breadth')
             AND UPPER(c.branch) <> ?
           )
         )
       ORDER BY co.type, c.course_id
       LIMIT 200`,
      [student.current_term_number, studentId, studentBranch, studentBranch]
    );

    // Filter courses based on prerequisites
    const enrollmentOptions = [];
    const unavailableCourses = [];

    for (const row of rows) {
      // Check if this course has prerequisites
      const [prereqRows] = await pool.execute(
        `SELECT prereq_course_id FROM PREREQUISITE WHERE course_id = ?`,
        [row.course_id]
      );

      let allPrereqsCompleted = true;
      let missingPrereqs = [];

      // If there are prerequisites, verify all have been completed
      if (prereqRows.length > 0) {
        for (const prereq of prereqRows) {
          const [transcriptRows] = await pool.execute(
            `SELECT transcript_id FROM ACADEMIC_TRANSCRIPT 
             WHERE student_id = ? AND course_id = ?`,
            [studentId, prereq.prereq_course_id]
          );

          // If prerequisite not in transcript, it hasn't been completed
          if (!transcriptRows || transcriptRows.length === 0) {
            allPrereqsCompleted = false;
            missingPrereqs.push(prereq.prereq_course_id);
          }
        }
      }

      const courseData = {
        offeringId: row.offering_id,
        courseId: row.course_id,
        courseName: row.course_name,
        branch: row.branch,
        credits: row.credits,
        type: row.type,
        termNumber: row.term_number,
        facultyName: row.faculty_name || "Unassigned",
        canEnroll: allPrereqsCompleted,
        missingPrereqs: missingPrereqs
      };

      // Separate available and unavailable courses
      if (allPrereqsCompleted) {
        enrollmentOptions.push(courseData);
      } else {
        unavailableCourses.push(courseData);
      }
    }

    res.status(200).json({
      message: "Enrollment options retrieved",
      currentTermNumber: student.current_term_number,
      studentBranch,
      enrollmentOptions,
      unavailableCourses
    });
  } catch (error) {
    next(error);
  }
}

async function enrollCourse(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can enroll in courses");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;
    const { offeringId } = req.body;

    if (!offeringId) {
      const error = new Error("offering_id is required");
      error.status = 400;
      throw error;
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check if course offering exists and fetch course/term details
      const [offeringRows] = await connection.execute(
        `SELECT offering_id, course_id, term_number
         FROM COURSE_OFFERING
         WHERE offering_id = ?
         LIMIT 1`,
        [offeringId]
      );

      if (!offeringRows[0]) {
        const error = new Error("Course offering not found");
        error.status = 404;
        throw error;
      }

      const offering = offeringRows[0];

      // Check if already enrolled
      const [existingRows] = await connection.execute(
        `SELECT enrollment_id FROM ENROLLMENT WHERE student_id = ? AND offering_id = ?`,
        [studentId, offeringId]
      );

      if (existingRows[0]) {
        const error = new Error("Already enrolled in this course");
        error.status = 409;
        throw error;
      }

      // Insert enrollment with today's date
      const todayDate = new Date().toISOString().split('T')[0];

      const [result] = await connection.execute(
        `INSERT INTO ENROLLMENT (student_id, offering_id, enrollment_date)
         VALUES (?, ?, ?)`,
        [studentId, offeringId, todayDate]
      );

      // Insert placeholder transcript row for the enrolled course
      await connection.execute(
        `INSERT INTO ACADEMIC_TRANSCRIPT (student_id, course_id, term_number)
         VALUES (?, ?, ?)`,
        [studentId, offering.course_id, offering.term_number]
      );

      // Insert initial attendance row for the enrolled course
      await connection.execute(
        `INSERT INTO ATTENDANCE (student_id, offering_id, classes_attended_count)
         VALUES (?, ?, 0)`,
        [studentId, offeringId]
      );

      await connection.commit();

      res.status(201).json({
        message: "Enrolled successfully",
        enrollmentId: result.insertId,
        studentId,
        offeringId,
        enrollmentDate: todayDate,
        courseId: offering.course_id,
        termNumber: offering.term_number
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

async function getTAEnrollmentOptions(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;

    const [studentRows] = await pool.execute(
      `SELECT student_id, current_term_number, branch
       FROM STUDENT
       WHERE student_id = ?
       LIMIT 1`,
      [studentId]
    );

    if (!studentRows[0]) {
      const error = new Error("Student profile not found");
      error.status = 404;
      throw error;
    }

    const student = studentRows[0];
    const currentTermNumber = Number(student.current_term_number || 0);
    const canApply = currentTermNumber === 7 || currentTermNumber === 8;
    const studentBranch = String(student.branch || "").trim().toUpperCase();

    if (!canApply) {
      return res.status(200).json({
        message: "TA enrollment is available only for semester 7 or 8",
        currentTermNumber,
        canApply: false,
        faculties: [],
        applications: [],
        appliedFacultyIds: []
      });
    }

    const [facultyRows] = await pool.execute(
      `SELECT faculty_id, name, department
       FROM FACULTY
       WHERE UPPER(TRIM(department)) = ?
       ORDER BY faculty_id`,
      [studentBranch]
    );

    const [applicationRows] = await pool.execute(
      `SELECT ta.ta_id, ta.faculty_id, ta.role, ta.term_number, f.name AS faculty_name
       FROM TA_ASSIGNMENT ta
       JOIN FACULTY f ON f.faculty_id = ta.faculty_id
       WHERE ta.student_id = ?
         AND ta.term_number = ?
         AND ta.offering_id IS NULL
       ORDER BY ta.ta_id DESC`,
      [studentId, currentTermNumber]
    );

    const faculties = facultyRows.map((row) => ({
      facultyId: row.faculty_id,
      facultyName: row.name,
      department: row.department
    }));

    const applications = applicationRows.map((row) => ({
      taId: row.ta_id,
      facultyId: row.faculty_id,
      facultyName: row.faculty_name,
      role: row.role,
      termNumber: row.term_number
    }));

    res.status(200).json({
      message: "TA enrollment options retrieved",
      currentTermNumber,
      canApply: true,
      faculties,
      applications,
      appliedFacultyIds: applications.map((application) => application.facultyId)
    });
  } catch (error) {
    next(error);
  }
}

async function applyTAEnrollment(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;
    const { facultyId } = req.body;

    if (!facultyId) {
      const error = new Error("facultyId is required");
      error.status = 400;
      throw error;
    }

    const [studentRows] = await pool.execute(
      `SELECT student_id, current_term_number, branch
       FROM STUDENT
       WHERE student_id = ?
       LIMIT 1`,
      [studentId]
    );

    if (!studentRows[0]) {
      const error = new Error("Student profile not found");
      error.status = 404;
      throw error;
    }

    const student = studentRows[0];
    const currentTermNumber = Number(student.current_term_number || 0);
    const studentBranch = String(student.branch || "").trim().toUpperCase();

    if (currentTermNumber !== 7 && currentTermNumber !== 8) {
      const error = new Error("TA enrollment is available only for semester 7 or 8");
      error.status = 403;
      throw error;
    }

    const [facultyRows] = await pool.execute(
      `SELECT faculty_id, name, department
       FROM FACULTY
       WHERE faculty_id = ?
       LIMIT 1`,
      [facultyId]
    );

    if (!facultyRows[0]) {
      const error = new Error("Faculty not found");
      error.status = 404;
      throw error;
    }

    const faculty = facultyRows[0];
    const facultyDepartment = String(faculty.department || "").trim().toUpperCase();

    if (facultyDepartment !== studentBranch) {
      const error = new Error("You can only apply to faculty in your department");
      error.status = 403;
      throw error;
    }

    const [existingRows] = await pool.execute(
      `SELECT ta_id
       FROM TA_ASSIGNMENT
       WHERE student_id = ?
         AND faculty_id = ?
         AND term_number = ?
         AND offering_id IS NULL
       LIMIT 1`,
      [studentId, facultyId, currentTermNumber]
    );

    if (existingRows[0]) {
      const error = new Error("Already applied for TA with this faculty");
      error.status = 409;
      throw error;
    }

    const [insertResult] = await pool.execute(
      `INSERT INTO TA_ASSIGNMENT (student_id, faculty_id, term_number, offering_id, role)
       VALUES (?, ?, ?, NULL, 'Department TA')`,
      [studentId, facultyId, currentTermNumber]
    );

    res.status(201).json({
      message: "TA application submitted successfully",
      taId: insertResult.insertId,
      facultyId,
      facultyName: faculty.name,
      termNumber: currentTermNumber,
      role: "Department TA"
    });
  } catch (error) {
    next(error);
  }
}

async function getCoursesForFeedback(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access this endpoint");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT
        co.offering_id,
        c.course_id,
        c.course_name,
        c.credits,
        co.term_number,
        f.name AS faculty_name,
        COALESCE(fb.feedback_id, 0) AS has_feedback,
        COALESCE(fb.rating, 0) AS rating,
        COALESCE(fb.comment, '') AS comment,
        COALESCE(fb.submitted_on, NULL) AS submitted_on
       FROM ENROLLMENT e
       JOIN COURSE_OFFERING co ON e.offering_id = co.offering_id
       JOIN COURSE c ON co.course_id = c.course_id
       LEFT JOIN FACULTY f ON co.faculty_id = f.faculty_id
       LEFT JOIN FEEDBACK fb ON e.student_id = fb.student_id AND co.offering_id = fb.offering_id
       WHERE e.student_id = ?
       ORDER BY co.term_number DESC, c.course_id
       LIMIT 100`,
      [studentId]
    );

    const courses = rows.map(row => ({
      offeringId: row.offering_id,
      courseId: row.course_id,
      courseName: row.course_name,
      credits: row.credits,
      termNumber: row.term_number,
      facultyName: row.faculty_name || "Unassigned",
      hasFeedback: Boolean(row.has_feedback),
      rating: row.rating,
      comment: row.comment,
      submittedOn: row.submitted_on
    }));

    res.status(200).json({
      message: "Courses for feedback retrieved",
      courses
    });
  } catch (error) {
    next(error);
  }
}

async function submitFeedback(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can submit feedback");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;
    const { offeringId, rating, comment } = req.body;

    if (!offeringId || !rating) {
      const error = new Error("offeringId and rating are required");
      error.status = 400;
      throw error;
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      const error = new Error("Rating must be an integer between 1 and 5");
      error.status = 400;
      throw error;
    }

    // Check if student is enrolled in this course
    const [enrollmentCheck] = await pool.execute(
      `SELECT enrollment_id FROM ENROLLMENT
       WHERE student_id = ? AND offering_id = ?
       LIMIT 1`,
      [studentId, offeringId]
    );

    if (!enrollmentCheck[0]) {
      const error = new Error("Student is not enrolled in this course");
      error.status = 403;
      throw error;
    }

    // Insert or update feedback
    await pool.execute(
      `INSERT INTO FEEDBACK (student_id, offering_id, rating, comment, submitted_on)
       VALUES (?, ?, ?, ?, CURDATE())
       ON DUPLICATE KEY UPDATE
         rating = VALUES(rating),
         comment = VALUES(comment),
         submitted_on = CURDATE()`,
      [studentId, offeringId, rating, comment || null]
    );

    res.status(200).json({
      message: "Feedback submitted successfully"
    });
  } catch (error) {
    next(error);
  }
}

async function getStudentNotifications(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can access notifications");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT n.notification_id, n.message, n.created_at
       FROM NOTIFICATION n
       WHERE n.id = ?
          OR EXISTS (
            SELECT 1
            FROM ENROLLMENT e
            JOIN COURSE_OFFERING co ON e.offering_id = co.offering_id
            WHERE e.student_id = ?
              AND co.course_id = n.id
          )
          OR n.id = (
            SELECT s.advisor_id
            FROM STUDENT s
            WHERE s.student_id = ?
            LIMIT 1
          )
       ORDER BY n.created_at DESC
       LIMIT 20`,
      [studentId, studentId, studentId]
    );

    const [recentRows] = await pool.execute(
      `SELECT COUNT(*) AS recent_count
       FROM NOTIFICATION n
       WHERE (
         n.id = ?
         OR EXISTS (
           SELECT 1
           FROM ENROLLMENT e
           JOIN COURSE_OFFERING co ON e.offering_id = co.offering_id
           WHERE e.student_id = ?
             AND co.course_id = n.id
         )
         OR n.id = (
           SELECT s.advisor_id
           FROM STUDENT s
           WHERE s.student_id = ?
           LIMIT 1
         )
       )
         AND n.created_at >= (NOW() - INTERVAL 3 DAY)`,
      [studentId, studentId, studentId]
    );

    const notifications = rows.map((row) => ({
      notificationId: row.notification_id,
      message: row.message,
      createdAt: row.created_at
    }));

    res.status(200).json({
      message: "Notifications retrieved",
      unreadCount: Number(recentRows[0]?.recent_count || 0),
      notifications
    });
  } catch (error) {
    next(error);
  }
}

async function submitLeaveApplication(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can apply for leave");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      const error = new Error("Missing required fields: leaveType, startDate, endDate, reason");
      error.status = 400;
      throw error;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      const error = new Error("End date must be after or equal to start date");
      error.status = 400;
      throw error;
    }

    // Insert leave application
    const [result] = await pool.execute(
      `INSERT INTO LEAVE_APPLICATION (student_id, start_date, end_date, reason, status, applied_on)
       VALUES (?, ?, ?, ?, 'Pending', CURDATE())`,
      [studentId, startDate, endDate, reason]
    );

    res.status(201).json({
      message: "Leave application submitted successfully",
      leaveId: result.insertId
    });
  } catch (error) {
    next(error);
  }
}

async function getPastLeaveApplications(req, res, next) {
  try {
    if (req.user.role !== "STUDENT") {
      const error = new Error("Only students can view their leave applications");
      error.status = 403;
      throw error;
    }

    const studentId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT 
        leave_id AS leaveId,
        student_id AS studentId,
        start_date AS startDate,
        end_date AS endDate,
        reason,
        status,
        applied_on AS createdAt
       FROM LEAVE_APPLICATION
       WHERE student_id = ?
       ORDER BY applied_on DESC, leave_id DESC`,
      [studentId]
    );

    const applications = rows.map((row) => ({
      leaveId: row.leaveId,
      leaveType: "Leave",
      startDate: row.startDate,
      endDate: row.endDate,
      reason: row.reason,
      status: row.status,
      createdAt: row.createdAt
    }));

    res.status(200).json({
      message: "Leave applications retrieved",
      applications
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
  getPastLeaveApplications
};
