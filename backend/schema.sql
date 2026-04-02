-- =========================================
-- CREATE DATABASE
-- =========================================
CREATE DATABASE IF NOT EXISTS student_db;
USE student_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ACADEMIC_TRANSCRIPT;
DROP TABLE IF EXISTS RESULT_HISTORY;
DROP TABLE IF EXISTS PLACEMENT;
DROP TABLE IF EXISTS INTERNSHIP;
DROP TABLE IF EXISTS NOTIFICATION;
DROP TABLE IF EXISTS PAYMENT;
DROP TABLE IF EXISTS PREREQUISITE;
DROP TABLE IF EXISTS TIMETABLE;
DROP TABLE IF EXISTS ROOM;
DROP TABLE IF EXISTS CGPA;
DROP TABLE IF EXISTS TA_ASSIGNMENT;
DROP TABLE IF EXISTS FEEDBACK;
DROP TABLE IF EXISTS LEAVE_APPLICATION;
DROP TABLE IF EXISTS EXAM;
DROP TABLE IF EXISTS ATTENDANCE;
DROP TABLE IF EXISTS MARKS;
DROP TABLE IF EXISTS ENROLLMENT;
DROP TABLE IF EXISTS COURSE_OFFERING;
DROP TABLE IF EXISTS TERM;
DROP TABLE IF EXISTS COURSE;
DROP TABLE IF EXISTS DOCUMENT;
DROP TABLE IF EXISTS STUDENT;
DROP TABLE IF EXISTS FACULTY;
DROP TABLE IF EXISTS ADMIN;
SET FOREIGN_KEY_CHECKS = 1;

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
    student_id VARCHAR(10),
    offering_id INT,
    PRIMARY KEY (student_id, offering_id),
    mid_sem INT CHECK (mid_sem BETWEEN 0 AND 30),
    end_sem INT CHECK (end_sem BETWEEN 0 AND 50),
    internal INT CHECK (internal BETWEEN 0 AND 20),

    total INT GENERATED ALWAYS AS (mid_sem + end_sem + internal) STORED,

    grade ENUM('EX','A','B','C','D','F'),

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (offering_id) REFERENCES COURSE_OFFERING(offering_id)
        ON DELETE CASCADE
);

-- =========================================
-- ATTENDANCE
-- =========================================
CREATE TABLE ATTENDANCE (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),
    offering_id INT,
    count INT DEFAULT 0,

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (offering_id) REFERENCES COURSE_OFFERING(offering_id)
        ON DELETE CASCADE,

    UNIQUE(student_id, offering_id)
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
    term_id INT,

    amount DECIMAL(10,2),
    payment_date DATE,
    status ENUM('Paid','Pending'),

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES TERM(term_id)
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
    student_id VARCHAR(10),
    term_id INT,
    PRIMARY KEY (student_id, term_id),
    sgpa DECIMAL(4,2),
    cgpa DECIMAL(4,2),

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES TERM(term_id)
        ON DELETE CASCADE
);

-- =========================================
-- ACADEMIC TRANSCRIPT
-- =========================================
CREATE TABLE ACADEMIC_TRANSCRIPT (
    transcript_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL,
    course_id INT NOT NULL,
    term_id INT NOT NULL,
    
    mid_sem INT CHECK (mid_sem BETWEEN 0 AND 30),
    end_sem INT CHECK (end_sem BETWEEN 0 AND 50),
    internal INT CHECK (internal BETWEEN 0 AND 20),
    total INT GENERATED ALWAYS AS (mid_sem + end_sem + internal) STORED,
    grade ENUM('EX','A','B','C','D','F'),
    
    recorded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES COURSE(course_id)
        ON DELETE RESTRICT,
    FOREIGN KEY (term_id) REFERENCES TERM(term_id)
        ON DELETE RESTRICT,
    
    UNIQUE(student_id, course_id, term_id)
);

-- =========================================
-- SAMPLE DATA
-- =========================================
INSERT INTO ADMIN (admin_id, username, password) VALUES
    (1, 'admin', 'admin123');

INSERT INTO FACULTY (faculty_id, password, name, email, phone, department) VALUES
    (1, 'faculty123', 'Dr. Meera Nair', 'meera.nair@university.edu', '9876543210', 'Computer Science'),
    (2, 'faculty123', 'Dr. Rohan Iyer', 'rohan.iyer@university.edu', '9876543211', 'Information Technology');

INSERT INTO STUDENT (
    student_id,
    password,
    name,
    batch,
    college_email,
    personal_email,
    phone,
    dob,
    advisor_id
) VALUES
    ('S1001', 'student123', 'Aarav Sharma', 2025, 'aarav.sharma@university.edu', 'aarav.sharma@gmail.com', '9000000001', '2004-06-14', 1),
    ('S1002', 'student123', 'Diya Patel', 2025, 'diya.patel@university.edu', 'diya.patel@gmail.com', '9000000002', '2004-11-02', 2);

INSERT INTO DOCUMENT (document_id, student_id, doc_type, file_name, file_data) VALUES
    (1, 'S1001', 'ID Card', 'S1001-id-card.pdf', NULL),
    (2, 'S1002', 'Transfer Certificate', 'S1002-tc.pdf', NULL);

INSERT INTO COURSE (course_id, course_name, credits) VALUES
    (101, 'Database Systems', 4),
    (102, 'Operating Systems', 4),
    (103, 'Web Development', 3);

INSERT INTO TERM (term_id, year, semester) VALUES
    (1, 2025, 'Autumn'),
    (2, 2026, 'Spring');

INSERT INTO COURSE_OFFERING (offering_id, course_id, faculty_id, term_id) VALUES
    (1, 101, 1, 1),
    (2, 102, 2, 1),
    (3, 103, 1, 2);

INSERT INTO ENROLLMENT (enrollment_id, student_id, offering_id, enrollment_date) VALUES
    (1, 'S1001', 1, '2025-08-01'),
    (2, 'S1001', 2, '2025-08-02'),
    (3, 'S1002', 1, '2025-08-01'),
    (4, 'S1002', 3, '2026-01-10');

INSERT INTO MARKS (student_id, offering_id, mid_sem, end_sem, internal, grade) VALUES
    ('S1001', 1, 26, 42, 17, 'A'),
    ('S1001', 2, 24, 39, 16, 'B'),
    ('S1002', 1, 28, 44, 18, 'A'),
    ('S1002', 3, 27, 41, 19, 'A');

INSERT INTO ATTENDANCE (attendance_id, student_id, offering_id,count) VALUES
    (1, 'S1001', 1, 5),
    (2, 'S1002', 1, 3);

INSERT INTO EXAM (exam_id, offering_id, exam_type, exam_date, exam_time, venue) VALUES
    (1, 1, 'MidSem', '2025-09-20', '10:00:00', 'Hall A'),
    (2, 1, 'EndSem', '2025-11-30', '14:00:00', 'Hall B'),
    (3, 3, 'MidSem', '2026-03-15', '10:00:00', 'Hall C');

INSERT INTO LEAVE_APPLICATION (leave_id, student_id, start_date, end_date, reason, status, applied_on) VALUES
    (1, 'S1001', '2025-09-10', '2025-09-12', 'Medical leave', 'Approved', '2025-09-08');

INSERT INTO FEEDBACK (feedback_id, student_id, offering_id, rating, comment, submitted_on) VALUES
    (1, 'S1001', 1, 5, 'Clear explanations and practical examples.', '2025-11-20'),
    (2, 'S1002', 3, 4, 'Useful hands-on project work.', '2026-03-25');

INSERT INTO TA_ASSIGNMENT (ta_id, student_id, faculty_id, term_id, offering_id, role) VALUES
    (1, 'S1002', 1, 2, 3, 'Lab TA');

INSERT INTO CGPA (student_id, cgpa) VALUES
    ('S1001', 8.75),
    ('S1002', 8.40);

INSERT INTO ROOM (room_id, capacity, building) VALUES
    ('R101', 60, 'Main Block'),
    ('LAB-1', 30, 'Innovation Center');

INSERT INTO TIMETABLE (timetable_id, offering_id, day, start_time, end_time, room_id) VALUES
    (1, 1, 'Mon', '09:00:00', '10:30:00', 'R101'),
    (2, 2, 'Wed', '11:00:00', '12:30:00', 'LAB-1'),
    (3, 3, 'Fri', '14:00:00', '15:30:00', 'R101');

INSERT INTO PREREQUISITE (course_id, prereq_course_id) VALUES
    (102, 101),
    (103, 101);

INSERT INTO PAYMENT (payment_id, student_id, payment_type, term_id, amount, payment_date, status) VALUES
    (1, 'S1001', 'Tuition', 1, 45000.00, '2025-08-15', 'Paid'),
    (2, 'S1002', 'Tuition', 2, 47000.00, '2026-01-15', 'Pending');

INSERT INTO NOTIFICATION (notification_id, student_id, message, created_at) VALUES
    (1, 'S1001', 'Mid-semester exam schedule published.', '2025-09-18 09:00:00'),
    (2, 'S1002', 'Fee payment reminder for Spring term.', '2026-01-20 12:00:00');

INSERT INTO INTERNSHIP (internship_id, student_id, company, role, package, duration) VALUES
    (1, 'S1001', 'InnovaTech', 'Software Intern', 18000.00, 3.00);

INSERT INTO PLACEMENT (placement_id, student_id, company, role, package) VALUES
    (1, 'S1002', 'CloudNova', 'Junior Developer', 640000.00);

INSERT INTO RESULT_HISTORY (student_id, term_id, sgpa, cgpa) VALUES
    ('S1001', 1, 8.60, 8.60),
    ('S1002', 2, 8.90, 8.90);

INSERT INTO ACADEMIC_TRANSCRIPT (
    transcript_id,
    student_id,
    course_id,
    term_id,
    mid_sem,
    end_sem,
    internal,
    grade,
    recorded_date
) VALUES
    (1, 'S1001', 101, 1, 26, 42, 17, 'A', '2025-12-01 10:00:00'),
    (2, 'S1001', 102, 1, 24, 39, 16, 'B', '2025-12-01 10:05:00'),
    (3, 'S1002', 101, 1, 28, 44, 18, 'A', '2025-12-01 10:10:00'),
    (4, 'S1002', 103, 2, 27, 41, 19, 'A', '2026-04-01 10:00:00');