-- =========================================
-- CREATE DATABASE
-- =========================================
CREATE DATABASE IF NOT EXISTS student_db;
USE student_db;

-- =========================================
-- ADMIN
-- =========================================
CREATE TABLE ADMIN (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL
);

-- =========================================
-- FACULTY
-- =========================================
CREATE TABLE FACULTY (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    department VARCHAR(100)
);

-- =========================================
-- STUDENT
-- =========================================
CREATE TABLE STUDENT (
    student_id VARCHAR(10) PRIMARY KEY,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    batch INT NOT NULL,
    college_email VARCHAR(100) UNIQUE,
    personal_email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    dob DATE,
    advisor_id INT,

    FOREIGN KEY (advisor_id) REFERENCES FACULTY(faculty_id)
        ON DELETE SET NULL
);

-- =========================================
-- DOCUMENT
-- =========================================
CREATE TABLE DOCUMENT (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),
    doc_type VARCHAR(50),
    file_name VARCHAR(100),
    file_data LONGBLOB,

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE
);

-- =========================================
-- COURSE
-- =========================================
CREATE TABLE COURSE (
    course_id INT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    credits INT CHECK (credits > 0)
);

-- =========================================
-- TERM
-- =========================================
CREATE TABLE TERM (
    term_id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL,
    semester ENUM('Autumn','Spring') NOT NULL,
    UNIQUE(year, semester)
);

-- =========================================
-- COURSE OFFERING
-- =========================================
CREATE TABLE COURSE_OFFERING (
    offering_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    faculty_id INT,
    term_id INT,

    FOREIGN KEY (course_id) REFERENCES COURSE(course_id)
        ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES FACULTY(faculty_id)
        ON DELETE SET NULL,
    FOREIGN KEY (term_id) REFERENCES TERM(term_id)
        ON DELETE CASCADE,

    UNIQUE(course_id, term_id)
);

-- =========================================
-- ENROLLMENT
-- =========================================
CREATE TABLE ENROLLMENT (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),
    offering_id INT,
    enrollment_date DATE,

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (offering_id) REFERENCES COURSE_OFFERING(offering_id)
        ON DELETE CASCADE,

    UNIQUE(student_id, offering_id)
);

-- =========================================
-- MARKS
-- =========================================
CREATE TABLE MARKS (
    mark_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),
    offering_id INT,

    mid_sem INT CHECK (mid_sem BETWEEN 0 AND 30),
    end_sem INT CHECK (end_sem BETWEEN 0 AND 50),
    internal INT CHECK (internal BETWEEN 0 AND 20),

    total INT GENERATED ALWAYS AS (mid_sem + end_sem + internal) STORED,

    grade ENUM('EX','A','B','C','D','F'),

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (offering_id) REFERENCES COURSE_OFFERING(offering_id)
        ON DELETE CASCADE,

    UNIQUE(student_id, offering_id)
);

-- =========================================
-- ATTENDANCE
-- =========================================
CREATE TABLE ATTENDANCE (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),
    offering_id INT,
    date DATE,
    status ENUM('Present','Absent'),

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (offering_id) REFERENCES COURSE_OFFERING(offering_id)
        ON DELETE CASCADE
);

-- =========================================
-- EXAM
-- =========================================
CREATE TABLE EXAM (
    exam_id INT AUTO_INCREMENT PRIMARY KEY,
    offering_id INT,

    exam_type ENUM('MidSem','EndSem','Supplementary'),
    exam_date DATE,
    exam_time TIME,
    venue VARCHAR(100),

    FOREIGN KEY (offering_id) REFERENCES COURSE_OFFERING(offering_id)
        ON DELETE CASCADE
);

-- =========================================
-- LEAVE APPLICATION
-- =========================================
CREATE TABLE LEAVE_APPLICATION (
    leave_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255),

    status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    applied_on DATE DEFAULT (CURRENT_DATE),

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,

    CHECK (end_date >= start_date)
);

-- =========================================
-- FEEDBACK
-- =========================================
CREATE TABLE FEEDBACK (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),
    offering_id INT,

    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    submitted_on DATE DEFAULT (CURRENT_DATE),

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (offering_id) REFERENCES COURSE_OFFERING(offering_id)
        ON DELETE CASCADE,

    UNIQUE(student_id, offering_id)
);

-- =========================================
-- TA ASSIGNMENT
-- =========================================
CREATE TABLE TA_ASSIGNMENT (
    ta_id INT AUTO_INCREMENT PRIMARY KEY,

    student_id VARCHAR(10),
    faculty_id INT,
    term_id INT,
    offering_id INT NULL,

    role VARCHAR(50),

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES FACULTY(faculty_id)
        ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES TERM(term_id)
        ON DELETE CASCADE,
    FOREIGN KEY (offering_id) REFERENCES COURSE_OFFERING(offering_id)
        ON DELETE SET NULL,

    UNIQUE(student_id, faculty_id, term_id, offering_id)
);

-- =========================================
-- SGPA
-- =========================================
CREATE TABLE SGPA (
    sgpa_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),
    term_id INT,

    sgpa DECIMAL(4,2) NOT NULL CHECK (sgpa BETWEEN 0 AND 10),

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES TERM(term_id)
        ON DELETE CASCADE,

    UNIQUE(student_id, term_id)
);

-- =========================================
-- CGPA
-- =========================================
CREATE TABLE CGPA (
    student_id VARCHAR(10) PRIMARY KEY,

    cgpa DECIMAL(4,2) NOT NULL CHECK (cgpa BETWEEN 0 AND 10),

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE
);

-- =========================================
-- ROOM
-- =========================================
CREATE TABLE ROOM (
    room_id VARCHAR(20) PRIMARY KEY,
    capacity INT,
    building VARCHAR(50)
);

-- =========================================
-- TIMETABLE
-- =========================================
CREATE TABLE TIMETABLE (
    timetable_id INT AUTO_INCREMENT PRIMARY KEY,
    offering_id INT,

    day ENUM('Mon','Tue','Wed','Thu','Fri'),
    start_time TIME,
    end_time TIME,

    room_id VARCHAR(20),

    FOREIGN KEY (offering_id) REFERENCES COURSE_OFFERING(offering_id)
        ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES ROOM(room_id)
        ON DELETE SET NULL
);

-- =========================================
-- PREREQUISITE
-- =========================================
CREATE TABLE PREREQUISITE (
    course_id INT,
    prereq_course_id INT,

    PRIMARY KEY(course_id, prereq_course_id),

    FOREIGN KEY (course_id) REFERENCES COURSE(course_id)
        ON DELETE CASCADE,
    FOREIGN KEY (prereq_course_id) REFERENCES COURSE(course_id)
        ON DELETE CASCADE
);

-- =========================================
-- PAYMENT
-- =========================================
CREATE TABLE PAYMENT (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),
    payment_type VARCHAR(10),
    
    amount DECIMAL(10,2),
    payment_date DATE,
    status ENUM('Paid','Pending'),

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE
);

-- =========================================
-- NOTIFICATION
-- =========================================
CREATE TABLE NOTIFICATION (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),

    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE
);

-- =========================================
-- INTERNSHIP
-- =========================================

CREATE TABLE INTERNSHIP (
    internship_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),

    company VARCHAR(100),
    role VARCHAR(100),
    package DECIMAL(10,2),
    duration DECIMAL(10,2),
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE
);

-- =========================================
-- PLACEMENT
-- =========================================
CREATE TABLE PLACEMENT (
    placement_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),

    company VARCHAR(100),
    role VARCHAR(100),
    package DECIMAL(10,2),

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE
);

-- =========================================
-- RESULT HISTORY
-- =========================================
CREATE TABLE RESULT_HISTORY (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),
    term_id INT,

    sgpa DECIMAL(4,2),
    cgpa DECIMAL(4,2),

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES TERM(term_id)
        ON DELETE CASCADE
);