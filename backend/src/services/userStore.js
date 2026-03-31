const pool = require("../config/db");

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

async function createStudentUser({ studentId, name, batch, email, passwordHash }) {
  const normalizedEmail = normalizeEmail(email);

  await pool.execute(
    `INSERT INTO STUDENT (student_id, password, name, batch, college_email)
     VALUES (?, ?, ?, ?, ?)`,
    [String(studentId).trim(), passwordHash, String(name).trim(), Number(batch), normalizedEmail]
  );

  return {
    id: String(studentId).trim(),
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

  const numericId = Number(value);
  if (Number.isNaN(numericId)) {
    return null;
  }

  const [facultyRows] = await pool.execute(
    `SELECT CAST(faculty_id AS CHAR) AS id,
            name,
            email,
            password AS passwordHash
     FROM FACULTY
     WHERE faculty_id = ?
     LIMIT 1`,
    [numericId]
  );

  if (facultyRows[0]) {
    return {
      ...facultyRows[0],
      role: "FACULTY"
    };
  }

  const [adminRows] = await pool.execute(
    `SELECT CAST(admin_id AS CHAR) AS id,
            username AS name,
            username AS email,
            password AS passwordHash
     FROM ADMIN
     WHERE admin_id = ?
     LIMIT 1`,
    [numericId]
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
    const [rows] = await pool.execute(
      `SELECT CAST(faculty_id AS CHAR) AS id,
              name,
              email,
              password AS passwordHash
       FROM FACULTY
       WHERE faculty_id = ?
       LIMIT 1`,
      [Number(id)]
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
  findUserByIdAndRole
};
