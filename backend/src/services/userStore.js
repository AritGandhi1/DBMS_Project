const pool = require("../config/db");

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

async function createStudentUser({
  studentId,
  name,
  batch,
  email,
  passwordHash,
  branch,
  personalEmail = null,
  phone = null,
  dob = null,
  advisorId = null,
  currentTermNumber = 1
}) {
  const normalizedStudentId = String(studentId).trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPersonalEmail = personalEmail ? normalizeEmail(personalEmail) : null;
  const normalizedPhone = phone ? String(phone).trim() : null;
  const normalizedDob = dob ? String(dob).trim() : null;

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
      normalizedStudentId,
      passwordHash,
      String(name).trim(),
      Number(batch),
      normalizedEmail,
      normalizedPersonalEmail,
      normalizedPhone,
      normalizedDob,
      advisorId,
      Number(currentTermNumber),
      String(branch || "").trim()
    ]
  );

  return {
    id: normalizedStudentId,
    role: "STUDENT",
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash
  };
}

async function findUserForLogin(userId) {
  const value = String(userId || "").trim();

  const [studentRows] = await pool.execute(
    `SELECT student_id AS id,
            name,
            college_email AS email,
            password AS passwordHash
     FROM STUDENT
     WHERE student_id = ?
     LIMIT 1`,
    [value]
  );

  if (studentRows[0]) {
    return {
      ...studentRows[0],
      role: "STUDENT"
    };
  }

  const [facultyRows] = await pool.execute(
    `SELECT faculty_id AS id,
            name,
            email,
            password AS passwordHash,
            role AS facultyDesignation,
            department,
            EXISTS (
              SELECT 1
              FROM STUDENT s
              WHERE s.advisor_id = FACULTY.faculty_id
              LIMIT 1
            ) AS isFacultyAdvisor
     FROM FACULTY
     WHERE faculty_id = ?
     LIMIT 1`,
    [value]
  );

  if (facultyRows[0]) {
    return {
      ...facultyRows[0],
      role: "FACULTY"
    };
  }

  const numericId = Number(value);
  const [adminRows] = await pool.execute(
    `SELECT CAST(admin_id AS CHAR) AS id,
            username AS name,
            username AS email,
            password AS passwordHash
     FROM ADMIN
     WHERE admin_id = ?
        OR username = ?
     LIMIT 1`,
    [Number.isNaN(numericId) ? -1 : numericId, value]
  );

  if (adminRows[0]) {
    return {
      ...adminRows[0],
      role: "ADMIN"
    };
  }

  return null;
}

async function findStudentByCollegeEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  const [rows] = await pool.execute(
    `SELECT student_id AS id,
            name,
            college_email AS email,
            password AS passwordHash,
            batch
     FROM STUDENT
     WHERE college_email = ?
     LIMIT 1`,
    [normalizedEmail]
  );

  if (!rows[0]) {
    return null;
  }

  return {
    ...rows[0],
    role: "STUDENT"
  };
}

async function findStudentById(studentId) {
  const value = String(studentId || "").trim();

  const [rows] = await pool.execute(
    `SELECT student_id AS id,
            name,
            college_email AS email,
            password AS passwordHash,
            batch
     FROM STUDENT
     WHERE student_id = ?
     LIMIT 1`,
    [value]
  );

  if (!rows[0]) {
    return null;
  }

  return {
    ...rows[0],
    role: "STUDENT"
  };
}

async function findUserByIdAndRole(id, role) {
  if (role === "STUDENT") {
    const [rows] = await pool.execute(
      `SELECT student_id AS id,
              name,
              college_email AS email,
              password AS passwordHash
       FROM STUDENT
       WHERE student_id = ?
       LIMIT 1`,
      [String(id)]
    );

    return rows[0] ? { ...rows[0], role: "STUDENT" } : null;
  }

  if (role === "FACULTY") {
    const facultyId = String(id || "").trim();

    const [rows] = await pool.execute(
      `SELECT faculty_id AS id,
              name,
              email,
              password AS passwordHash,
              role AS facultyDesignation,
              department,
              EXISTS (
                SELECT 1
                FROM STUDENT s
                WHERE s.advisor_id = FACULTY.faculty_id
                LIMIT 1
              ) AS isFacultyAdvisor
       FROM FACULTY
       WHERE faculty_id = ?
       LIMIT 1`,
      [facultyId]
    );

    return rows[0] ? { ...rows[0], role: "FACULTY" } : null;
  }

  if (role === "ADMIN") {
    const [rows] = await pool.execute(
      `SELECT CAST(admin_id AS CHAR) AS id,
              username AS name,
              username AS email,
              password AS passwordHash
       FROM ADMIN
       WHERE admin_id = ?
       LIMIT 1`,
      [Number(id)]
    );

    return rows[0] ? { ...rows[0], role: "ADMIN" } : null;
  }

  return null;
}

module.exports = {
  createStudentUser,
  findUserForLogin,
  findStudentByCollegeEmail,
  findStudentById,
  findUserByIdAndRole
};
