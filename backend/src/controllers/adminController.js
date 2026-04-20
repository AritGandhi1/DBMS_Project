const pool = require("../config/db");
const XLSX = require("xlsx");

function ensureAdminRole(req) {
  if (req.user.role !== "ADMIN") {
    const error = new Error("Only admin can access this endpoint");
    error.status = 403;
    throw error;
  }
}

async function ensureAppSettingsTable() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS APP_SETTINGS (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value VARCHAR(255) NOT NULL
    )`
  );
}

async function getFeedbackActiveSetting() {
  await ensureAppSettingsTable();

  const [rows] = await pool.execute(
    `SELECT setting_value
     FROM APP_SETTINGS
     WHERE setting_key = 'feedback_active'
     LIMIT 1`
  );

  if (!rows[0]) {
    return true;
  }

  return String(rows[0].setting_value || "1") === "1";
}

async function setFeedbackActiveSetting(isActive) {
  await ensureAppSettingsTable();

  await pool.execute(
    `INSERT INTO APP_SETTINGS (setting_key, setting_value)
     VALUES ('feedback_active', ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [isActive ? "1" : "0"]
  );
}

async function getEnrollmentActiveSetting() {
  await ensureAppSettingsTable();

  const [rows] = await pool.execute(
    `SELECT setting_value
     FROM APP_SETTINGS
     WHERE setting_key = 'enrollment_active'
     LIMIT 1`
  );

  if (!rows[0]) {
    return true;
  }

  return String(rows[0].setting_value || "1") === "1";
}

async function setEnrollmentActiveSetting(isActive) {
  await ensureAppSettingsTable();

  await pool.execute(
    `INSERT INTO APP_SETTINGS (setting_key, setting_value)
     VALUES ('enrollment_active', ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [isActive ? "1" : "0"]
  );
}

async function assertAdvisorExists(advisorId) {
  if (!advisorId) {
    return;
  }

  const [rows] = await pool.execute(
    `SELECT faculty_id FROM FACULTY WHERE faculty_id = ? LIMIT 1`,
    [advisorId]
  );

  if (!rows[0]) {
    const error = new Error("advisorId not found");
    error.status = 404;
    throw error;
  }
}

function normalizeColumnName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function pickRowValue(row, aliases) {
  const map = new Map();
  Object.keys(row || {}).forEach((key) => {
    map.set(normalizeColumnName(key), row[key]);
  });

  for (const alias of aliases) {
    const normalizedAlias = normalizeColumnName(alias);
    if (map.has(normalizedAlias)) {
      return map.get(normalizedAlias);
    }
  }

  return null;
}

function normalizeText(value) {
  return String(value == null ? "" : value).trim();
}

function getNumericValue(value) {
  const parsed = Number(String(value == null ? "" : value).trim());
  return Number.isNaN(parsed) ? null : parsed;
}

function ensureAllowedUploadFile(file) {
  if (!file || !file.buffer) {
    const error = new Error("Upload file is required");
    error.status = 400;
    throw error;
  }

  const fileName = String(file.originalname || "").toLowerCase();
  const hasAllowedExtension = [".csv", ".xlsx", ".xls"].some((extension) => fileName.endsWith(extension));

  if (!hasAllowedExtension) {
    const error = new Error("Only CSV, XLSX, and XLS files are allowed");
    error.status = 400;
    throw error;
  }
}

function parseRowsFromUpload(file) {
  ensureAllowedUploadFile(file);

  let rows = [];
  try {
    const workbook = XLSX.read(file.buffer, { type: "buffer", raw: false, cellDates: true, dateNF: "yyyy-mm-dd" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
  } catch (parseError) {
    const error = new Error("Failed to parse file. Please upload a valid CSV or Excel file with headers.");
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    const error = new Error("No data rows found in uploaded file");
    error.status = 400;
    throw error;
  }

  return rows;
}

function isRowEmpty(row) {
  return Object.values(row || {}).every((value) => normalizeText(value) === "");
}

function toGradePoint(grade) {
  const map = {
    EX: 10,
    A: 9,
    B: 8,
    C: 7,
    D: 6,
    F: 0
  };

  return map[String(grade || "").trim().toUpperCase()] ?? null;
}

function computeGpaFromRows(rows) {
  let totalCredits = 0;
  let totalWeightedPoints = 0;

  for (const row of rows || []) {
    const credits = Number(row.credits || 0);
    const points = toGradePoint(row.grade);

    if (Number.isNaN(credits) || credits <= 0 || points == null) {
      continue;
    }

    totalCredits += credits;
    totalWeightedPoints += credits * points;
  }

  if (totalCredits === 0) {
    return null;
  }

  return Number((totalWeightedPoints / totalCredits).toFixed(2));
}

async function insertAdminStudent(payload) {
  const {
    studentId,
    password,
    name,
    batch,
    collegeEmail,
    personalEmail,
    phone,
    dob,
    advisorId,
    currentTermNumber,
    branch
  } = payload;

  if (!studentId || !password || !name || batch == null || !collegeEmail || currentTermNumber == null || !branch) {
    const error = new Error("studentId, password, name, batch, collegeEmail, currentTermNumber and branch are required");
    error.status = 400;
    throw error;
  }

  const numericBatch = Number(batch);
  const numericCurrentTerm = Number(currentTermNumber);
  if (Number.isNaN(numericBatch) || Number.isNaN(numericCurrentTerm)) {
    const error = new Error("batch and currentTermNumber must be numeric");
    error.status = 400;
    throw error;
  }

  const normalizedAdvisorId = advisorId ? String(advisorId).trim() : null;
  await assertAdvisorExists(normalizedAdvisorId);

  await pool.execute(
    `INSERT INTO STUDENT (
      student_id,
      password,
      name,
      batch,
      college_email,
      personal_email,
      phone,
      dob,
      advisor_id,
      current_term_number,
      branch
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      String(studentId).trim(),
      String(password),
      String(name).trim(),
      numericBatch,
      String(collegeEmail).trim().toLowerCase(),
      personalEmail ? String(personalEmail).trim().toLowerCase() : null,
      phone ? String(phone).trim() : null,
      dob ? String(dob).trim() : null,
      normalizedAdvisorId,
      numericCurrentTerm,
      String(branch).trim().toUpperCase()
    ]
  );
}

async function insertAdminFaculty(payload) {
  const { facultyId, password, role, name, email, phone, department } = payload;

  if (!facultyId || !password || !name) {
    const error = new Error("facultyId, password and name are required");
    error.status = 400;
    throw error;
  }

  await pool.execute(
    `INSERT INTO FACULTY (
      faculty_id,
      password,
      role,
      name,
      email,
      phone,
      department
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      String(facultyId).trim(),
      String(password),
      role ? String(role).trim() : "Faculty",
      String(name).trim(),
      email ? String(email).trim().toLowerCase() : null,
      phone ? String(phone).trim() : null,
      department ? String(department).trim().toUpperCase() : null
    ]
  );
}

function mapStudentRow(row) {
  return {
    studentId: normalizeText(pickRowValue(row, ["studentId", "student_id", "id"])),
    password: normalizeText(pickRowValue(row, ["password", "pass"])),
    name: normalizeText(pickRowValue(row, ["name", "studentName"])),
    batch: getNumericValue(pickRowValue(row, ["batch"])),
    collegeEmail: normalizeText(pickRowValue(row, ["collegeEmail", "college_email", "email", "collegeMail"])),
    personalEmail: normalizeText(pickRowValue(row, ["personalEmail", "personal_email", "personalMail"])) || null,
    phone: normalizeText(pickRowValue(row, ["phone", "phoneNumber", "mobile"])) || null,
    dob: normalizeText(pickRowValue(row, ["dob", "dateOfBirth", "birthDate"])) || null,
    advisorId: normalizeText(pickRowValue(row, ["advisorId", "advisor_id", "facultyAdvisorId"])) || null,
    currentTermNumber: getNumericValue(pickRowValue(row, ["currentTermNumber", "current_term_number", "term", "currentTerm"])),
    branch: normalizeText(pickRowValue(row, ["branch", "department"]))
  };
}

function mapFacultyRow(row) {
  return {
    facultyId: normalizeText(pickRowValue(row, ["facultyId", "faculty_id", "id"])),
    password: normalizeText(pickRowValue(row, ["password", "pass"])),
    role: normalizeText(pickRowValue(row, ["role", "designation"])) || "Faculty",
    name: normalizeText(pickRowValue(row, ["name", "facultyName"])),
    email: normalizeText(pickRowValue(row, ["email", "facultyEmail"])) || null,
    phone: normalizeText(pickRowValue(row, ["phone", "phoneNumber", "mobile"])) || null,
    department: normalizeText(pickRowValue(row, ["department", "dept", "branch"])) || null
  };
}

async function getAdminUserManagement(req, res, next) {
  try {
    ensureAdminRole(req);

    const [studentRows, facultyRows] = await Promise.all([
      pool.execute(
        `SELECT
          student_id,
          password,
          name,
          batch,
          college_email,
          personal_email,
          phone,
          dob,
          advisor_id,
          current_term_number,
          branch
         FROM STUDENT
         ORDER BY student_id`
      ),
      pool.execute(
        `SELECT
          faculty_id,
          password,
          role,
          name,
          email,
          phone,
          department
         FROM FACULTY
         ORDER BY faculty_id`
      )
    ]);

    res.status(200).json({
      message: "Admin user management data retrieved",
      students: studentRows[0].map((row) => ({
        studentId: row.student_id,
        password: row.password,
        name: row.name,
        batch: row.batch,
        collegeEmail: row.college_email,
        personalEmail: row.personal_email,
        phone: row.phone,
        dob: row.dob,
        advisorId: row.advisor_id,
        currentTermNumber: row.current_term_number,
        branch: row.branch
      })),
      faculties: facultyRows[0].map((row) => ({
        facultyId: row.faculty_id,
        password: row.password,
        role: row.role,
        name: row.name,
        email: row.email,
        phone: row.phone,
        department: row.department
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminFeedbackStatus(req, res, next) {
  try {
    ensureAdminRole(req);

    const feedbackActive = await getFeedbackActiveSetting();

    res.status(200).json({
      message: "Feedback status retrieved",
      feedbackActive
    });
  } catch (error) {
    next(error);
  }
}

async function updateAdminFeedbackStatus(req, res, next) {
  try {
    ensureAdminRole(req);

    const rawValue = req.body?.feedbackActive;
    if (typeof rawValue !== "boolean") {
      const error = new Error("feedbackActive must be boolean");
      error.status = 400;
      throw error;
    }

    await setFeedbackActiveSetting(rawValue);

    res.status(200).json({
      message: `Feedback is now ${rawValue ? "active" : "inactive"}`,
      feedbackActive: rawValue
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminFeedbackList(req, res, next) {
  try {
    ensureAdminRole(req);

    const [rows] = await pool.execute(
      `SELECT
        fb.feedback_id,
        fb.student_id,
        s.name AS student_name,
        fb.offering_id,
        c.course_id,
        c.course_name,
        co.term_number,
        co.faculty_id,
        f.name AS faculty_name,
        fb.rating,
        COALESCE(fb.comment, '') AS comment,
        fb.submitted_on
       FROM FEEDBACK fb
       JOIN STUDENT s ON s.student_id = fb.student_id
       JOIN COURSE_OFFERING co ON co.offering_id = fb.offering_id
       JOIN COURSE c ON c.course_id = co.course_id
       LEFT JOIN FACULTY f ON f.faculty_id = co.faculty_id
       ORDER BY fb.submitted_on DESC, co.term_number DESC, c.course_id ASC, fb.student_id ASC`
    );

    const feedbacks = rows.map((row) => ({
      feedbackId: row.feedback_id,
      studentId: row.student_id,
      studentName: row.student_name,
      offeringId: row.offering_id,
      courseId: row.course_id,
      courseName: row.course_name,
      termNumber: row.term_number,
      facultyId: row.faculty_id,
      facultyName: row.faculty_name || "Unassigned",
      rating: Number(row.rating || 0),
      comment: row.comment || "",
      submittedOn: row.submitted_on
    }));

    res.status(200).json({
      message: "Admin feedback list retrieved",
      total: feedbacks.length,
      feedbacks
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminEnrollmentStatus(req, res, next) {
  try {
    ensureAdminRole(req);

    const enrollmentActive = await getEnrollmentActiveSetting();

    res.status(200).json({
      message: "Enrollment status retrieved",
      enrollmentActive
    });
  } catch (error) {
    next(error);
  }
}

async function updateAdminEnrollmentStatus(req, res, next) {
  try {
    ensureAdminRole(req);

    const rawValue = req.body?.enrollmentActive;
    if (typeof rawValue !== "boolean") {
      const error = new Error("enrollmentActive must be boolean");
      error.status = 400;
      throw error;
    }

    await setEnrollmentActiveSetting(rawValue);

    res.status(200).json({
      message: `Enrollment is now ${rawValue ? "active" : "inactive"}`,
      enrollmentActive: rawValue
    });
  } catch (error) {
    next(error);
  }
}

async function createAdminStudent(req, res, next) {
  try {
    ensureAdminRole(req);

    await insertAdminStudent(req.body);

    res.status(201).json({
      message: "Student created successfully",
      studentId: String(req.body.studentId).trim()
    });
  } catch (error) {
    next(error);
  }
}

async function bulkUploadAdminStudents(req, res, next) {
  try {
    ensureAdminRole(req);

    const rows = parseRowsFromUpload(req.file);
    const failedRows = [];
    let insertedCount = 0;
    let skippedCount = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (isRowEmpty(row)) {
        skippedCount += 1;
        continue;
      }

      try {
        const payload = mapStudentRow(row);
        await insertAdminStudent(payload);
        insertedCount += 1;
      } catch (rowError) {
        failedRows.push({
          rowNumber: index + 2,
          message: rowError.message
        });
      }
    }

    res.status(200).json({
      message: "Student bulk upload processed",
      totalRows: rows.length,
      insertedCount,
      failedCount: failedRows.length,
      skippedCount,
      failedRows: failedRows.slice(0, 100)
    });
  } catch (error) {
    next(error);
  }
}

async function updateAdminStudent(req, res, next) {
  try {
    ensureAdminRole(req);

    const currentStudentId = String(req.params.studentId || "").trim();
    if (!currentStudentId) {
      const error = new Error("studentId is required in path");
      error.status = 400;
      throw error;
    }

    const [existingRows] = await pool.execute(
      `SELECT student_id FROM STUDENT WHERE student_id = ? LIMIT 1`,
      [currentStudentId]
    );

    if (!existingRows[0]) {
      const error = new Error("Student not found");
      error.status = 404;
      throw error;
    }

    const updates = [];
    const values = [];

    if (req.body.studentId != null && String(req.body.studentId).trim() !== "") {
      updates.push("student_id = ?");
      values.push(String(req.body.studentId).trim());
    }
    if (req.body.password != null && String(req.body.password).trim() !== "") {
      updates.push("password = ?");
      values.push(String(req.body.password));
    }
    if (req.body.name != null && String(req.body.name).trim() !== "") {
      updates.push("name = ?");
      values.push(String(req.body.name).trim());
    }
    if (req.body.batch != null && String(req.body.batch).trim() !== "") {
      updates.push("batch = ?");
      values.push(Number(req.body.batch));
    }
    if (req.body.collegeEmail != null && String(req.body.collegeEmail).trim() !== "") {
      updates.push("college_email = ?");
      values.push(String(req.body.collegeEmail).trim().toLowerCase());
    }
    if (req.body.personalEmail != null) {
      const normalized = String(req.body.personalEmail || "").trim();
      updates.push("personal_email = ?");
      values.push(normalized ? normalized.toLowerCase() : null);
    }
    if (req.body.phone != null) {
      const normalized = String(req.body.phone || "").trim();
      updates.push("phone = ?");
      values.push(normalized || null);
    }
    if (req.body.dob != null) {
      const normalized = String(req.body.dob || "").trim();
      updates.push("dob = ?");
      values.push(normalized || null);
    }
    if (req.body.advisorId != null) {
      const normalizedAdvisorId = String(req.body.advisorId || "").trim();
      await assertAdvisorExists(normalizedAdvisorId || null);
      updates.push("advisor_id = ?");
      values.push(normalizedAdvisorId || null);
    }
    if (req.body.currentTermNumber != null && String(req.body.currentTermNumber).trim() !== "") {
      updates.push("current_term_number = ?");
      values.push(Number(req.body.currentTermNumber));
    }
    if (req.body.branch != null && String(req.body.branch).trim() !== "") {
      updates.push("branch = ?");
      values.push(String(req.body.branch).trim().toUpperCase());
    }

    if (updates.length === 0) {
      const error = new Error("At least one field is required to update");
      error.status = 400;
      throw error;
    }

    values.push(currentStudentId);

    await pool.execute(
      `UPDATE STUDENT
       SET ${updates.join(", ")}
       WHERE student_id = ?`,
      values
    );

    res.status(200).json({
      message: "Student updated successfully",
      studentId: currentStudentId
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAdminStudent(req, res, next) {
  try {
    ensureAdminRole(req);

    const studentId = String(req.params.studentId || "").trim();
    if (!studentId) {
      const error = new Error("studentId is required in path");
      error.status = 400;
      throw error;
    }

    const [result] = await pool.execute(
      `DELETE FROM STUDENT WHERE student_id = ?`,
      [studentId]
    );

    if (result.affectedRows === 0) {
      const error = new Error("Student not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      message: "Student deleted successfully",
      studentId
    });
  } catch (error) {
    next(error);
  }
}

async function createAdminFaculty(req, res, next) {
  try {
    ensureAdminRole(req);

    await insertAdminFaculty(req.body);

    res.status(201).json({
      message: "Faculty created successfully",
      facultyId: String(req.body.facultyId).trim()
    });
  } catch (error) {
    next(error);
  }
}

async function bulkUploadAdminFaculty(req, res, next) {
  try {
    ensureAdminRole(req);

    const rows = parseRowsFromUpload(req.file);
    const failedRows = [];
    let insertedCount = 0;
    let skippedCount = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (isRowEmpty(row)) {
        skippedCount += 1;
        continue;
      }

      try {
        const payload = mapFacultyRow(row);
        await insertAdminFaculty(payload);
        insertedCount += 1;
      } catch (rowError) {
        failedRows.push({
          rowNumber: index + 2,
          message: rowError.message
        });
      }
    }

    res.status(200).json({
      message: "Faculty bulk upload processed",
      totalRows: rows.length,
      insertedCount,
      failedCount: failedRows.length,
      skippedCount,
      failedRows: failedRows.slice(0, 100)
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminRooms(req, res, next) {
  try {
    ensureAdminRole(req);

    const [roomRows] = await pool.execute(
      `SELECT room_id, capacity, building
       FROM ROOM
       ORDER BY room_id`
    );

    res.status(200).json({
      message: "Admin room data retrieved",
      rooms: roomRows.map((row) => ({
        roomId: row.room_id,
        capacity: row.capacity,
        building: row.building
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function createAdminRoom(req, res, next) {
  try {
    ensureAdminRole(req);

    const { roomId, capacity, building } = req.body;
    if (!roomId || capacity == null || !building) {
      const error = new Error("roomId, capacity and building are required");
      error.status = 400;
      throw error;
    }

    const numericCapacity = Number(capacity);
    if (Number.isNaN(numericCapacity) || numericCapacity <= 0) {
      const error = new Error("capacity must be a positive number");
      error.status = 400;
      throw error;
    }

    await pool.execute(
      `INSERT INTO ROOM (room_id, capacity, building)
       VALUES (?, ?, ?)`,
      [
        String(roomId).trim(),
        numericCapacity,
        String(building).trim()
      ]
    );

    res.status(201).json({
      message: "Room created successfully",
      roomId: String(roomId).trim()
    });
  } catch (error) {
    next(error);
  }
}

async function updateAdminRoom(req, res, next) {
  try {
    ensureAdminRole(req);

    const currentRoomId = String(req.params.roomId || "").trim();
    if (!currentRoomId) {
      const error = new Error("roomId is required in path");
      error.status = 400;
      throw error;
    }

    const [existingRows] = await pool.execute(
      `SELECT room_id FROM ROOM WHERE room_id = ? LIMIT 1`,
      [currentRoomId]
    );

    if (!existingRows[0]) {
      const error = new Error("Room not found");
      error.status = 404;
      throw error;
    }

    const updates = [];
    const values = [];

    if (req.body.roomId != null && String(req.body.roomId).trim() !== "") {
      updates.push("room_id = ?");
      values.push(String(req.body.roomId).trim());
    }

    if (req.body.capacity != null && String(req.body.capacity).trim() !== "") {
      const numericCapacity = Number(req.body.capacity);
      if (Number.isNaN(numericCapacity) || numericCapacity <= 0) {
        const error = new Error("capacity must be a positive number");
        error.status = 400;
        throw error;
      }

      updates.push("capacity = ?");
      values.push(numericCapacity);
    }

    if (req.body.building != null && String(req.body.building).trim() !== "") {
      updates.push("building = ?");
      values.push(String(req.body.building).trim());
    }

    if (updates.length === 0) {
      const error = new Error("At least one field is required to update");
      error.status = 400;
      throw error;
    }

    values.push(currentRoomId);

    await pool.execute(
      `UPDATE ROOM
       SET ${updates.join(", ")}
       WHERE room_id = ?`,
      values
    );

    res.status(200).json({
      message: "Room updated successfully",
      roomId: currentRoomId
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAdminRoom(req, res, next) {
  try {
    ensureAdminRole(req);

    const roomId = String(req.params.roomId || "").trim();
    if (!roomId) {
      const error = new Error("roomId is required in path");
      error.status = 400;
      throw error;
    }

    const [result] = await pool.execute(
      `DELETE FROM ROOM WHERE room_id = ?`,
      [roomId]
    );

    if (result.affectedRows === 0) {
      const error = new Error("Room not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      message: "Room deleted successfully",
      roomId
    });
  } catch (error) {
    next(error);
  }
}

async function updateAdminFaculty(req, res, next) {
  try {
    ensureAdminRole(req);

    const currentFacultyId = String(req.params.facultyId || "").trim();
    if (!currentFacultyId) {
      const error = new Error("facultyId is required in path");
      error.status = 400;
      throw error;
    }

    const [existingRows] = await pool.execute(
      `SELECT faculty_id FROM FACULTY WHERE faculty_id = ? LIMIT 1`,
      [currentFacultyId]
    );

    if (!existingRows[0]) {
      const error = new Error("Faculty not found");
      error.status = 404;
      throw error;
    }

    const updates = [];
    const values = [];

    if (req.body.facultyId != null && String(req.body.facultyId).trim() !== "") {
      updates.push("faculty_id = ?");
      values.push(String(req.body.facultyId).trim());
    }
    if (req.body.password != null && String(req.body.password).trim() !== "") {
      updates.push("password = ?");
      values.push(String(req.body.password));
    }
    if (req.body.role != null && String(req.body.role).trim() !== "") {
      updates.push("role = ?");
      values.push(String(req.body.role).trim());
    }
    if (req.body.name != null && String(req.body.name).trim() !== "") {
      updates.push("name = ?");
      values.push(String(req.body.name).trim());
    }
    if (req.body.email != null) {
      const normalized = String(req.body.email || "").trim();
      updates.push("email = ?");
      values.push(normalized ? normalized.toLowerCase() : null);
    }
    if (req.body.phone != null) {
      const normalized = String(req.body.phone || "").trim();
      updates.push("phone = ?");
      values.push(normalized || null);
    }
    if (req.body.department != null) {
      const normalized = String(req.body.department || "").trim();
      updates.push("department = ?");
      values.push(normalized ? normalized.toUpperCase() : null);
    }

    if (updates.length === 0) {
      const error = new Error("At least one field is required to update");
      error.status = 400;
      throw error;
    }

    values.push(currentFacultyId);

    await pool.execute(
      `UPDATE FACULTY
       SET ${updates.join(", ")}
       WHERE faculty_id = ?`,
      values
    );

    res.status(200).json({
      message: "Faculty updated successfully",
      facultyId: currentFacultyId
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAdminFaculty(req, res, next) {
  try {
    ensureAdminRole(req);

    const facultyId = String(req.params.facultyId || "").trim();
    if (!facultyId) {
      const error = new Error("facultyId is required in path");
      error.status = 400;
      throw error;
    }

    const [result] = await pool.execute(
      `DELETE FROM FACULTY WHERE faculty_id = ?`,
      [facultyId]
    );

    if (result.affectedRows === 0) {
      const error = new Error("Faculty not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      message: "Faculty deleted successfully",
      facultyId
    });
  } catch (error) {
    next(error);
  }
}

async function endAdminTerm(req, res, next) {
  try {
    ensureAdminRole(req);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [studentRows] = await connection.execute(
        `SELECT student_id, current_term_number
         FROM STUDENT`
      );

      let gpaUpdatedCount = 0;
      let termIncrementedCount = 0;
      let graduatedCount = 0;

      for (const student of studentRows) {
        const studentId = student.student_id;
        const currentTermNumber = Number(student.current_term_number || 0);

        const [currentTermGradeRows] = await connection.execute(
          `SELECT at.grade, c.credits
           FROM ACADEMIC_TRANSCRIPT at
           JOIN COURSE c ON c.course_id = at.course_id
           WHERE at.student_id = ?
             AND at.term_number = ?
             AND at.grade IS NOT NULL`,
          [studentId, currentTermNumber]
        );

        if (currentTermGradeRows.length > 0) {
          const sgpa = computeGpaFromRows(currentTermGradeRows);

          const [allGradeRows] = await connection.execute(
            `SELECT at.grade, c.credits
             FROM ACADEMIC_TRANSCRIPT at
             JOIN COURSE c ON c.course_id = at.course_id
             WHERE at.student_id = ?
               AND at.grade IS NOT NULL`,
            [studentId]
          );

          const cgpa = computeGpaFromRows(allGradeRows);

          await connection.execute(
            `INSERT INTO RESULT_HISTORY (student_id, term_number, sgpa, cgpa)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               sgpa = VALUES(sgpa),
               cgpa = VALUES(cgpa)`,
            [studentId, currentTermNumber, sgpa, cgpa]
          );

          await connection.execute(
            `INSERT INTO CGPA (student_id, cgpa)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE cgpa = VALUES(cgpa)`,
            [studentId, cgpa]
          );

          gpaUpdatedCount += 1;
        }

        if (currentTermNumber > 0 && currentTermNumber < 8) {
          await connection.execute(
            `UPDATE STUDENT
             SET current_term_number = current_term_number + 1
             WHERE student_id = ?`,
            [studentId]
          );

          termIncrementedCount += 1;
        } else if (currentTermNumber === 8) {
          await connection.execute(
            `UPDATE STUDENT
             SET current_term_number = 9
             WHERE student_id = ?`,
            [studentId]
          );

          graduatedCount += 1;
        }
      }

      await connection.execute(`DELETE FROM NOTIFICATION`);
      await connection.execute(`DELETE FROM TIMETABLE`);
      await connection.execute(`DELETE FROM FEEDBACK`);
      await connection.execute(`DELETE FROM ENROLLMENT`);
      await connection.execute(`DELETE FROM COURSE_OFFERING`);

      await connection.commit();

      res.status(200).json({
        message: "Term ended successfully",
        studentsProcessed: studentRows.length,
        gpaUpdatedCount,
        termIncrementedCount,
        graduatedCount,
        cleared: {
          courseOfferings: true,
          feedback: true,
          enrollments: true,
          timetables: true,
          notifications: true
        }
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

module.exports = {
  getAdminFeedbackStatus,
  updateAdminFeedbackStatus,
  getAdminFeedbackList,
  getAdminEnrollmentStatus,
  updateAdminEnrollmentStatus,
  endAdminTerm,
  getAdminUserManagement,
  createAdminStudent,
  updateAdminStudent,
  deleteAdminStudent,
  bulkUploadAdminStudents,
  createAdminFaculty,
  updateAdminFaculty,
  deleteAdminFaculty,
  bulkUploadAdminFaculty,
  getAdminRooms,
  createAdminRoom,
  updateAdminRoom,
  deleteAdminRoom
};
