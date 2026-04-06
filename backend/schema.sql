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
DROP TABLE IF EXISTS PLACEMENT_OPENING;
DROP TABLE IF EXISTS INTERNSHIP_OPENING;
DROP TABLE IF EXISTS PLACEMENT_BRANCH;
DROP TABLE IF EXISTS INTERNSHIP_BRANCH;
DROP TABLE IF EXISTS STUDENT_RESUME;
DROP TABLE IF EXISTS PREREQUISITE;
DROP TABLE IF EXISTS TIMETABLE;
DROP TABLE IF EXISTS ROOM;
DROP TABLE IF EXISTS CGPA;
DROP TABLE IF EXISTS FEEDBACK;
DROP TABLE IF EXISTS ATTENDANCE;
DROP TABLE IF EXISTS ENROLLMENT;
DROP TABLE IF EXISTS MARKS;
DROP TABLE IF EXISTS COURSE_OFFERING;
DROP TABLE IF EXISTS COURSE;
DROP TABLE IF EXISTS NOTIFICATION;
DROP TABLE IF EXISTS LEAVE_APPLICATION;
DROP TABLE IF EXISTS TA_ASSIGNMENT;
DROP TABLE IF EXISTS EXAM;
DROP TABLE IF EXISTS DOCUMENT;
DROP TABLE IF EXISTS PAYMENT;
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
    faculty_id VARCHAR(10) PRIMARY KEY,
    password VARCHAR(100) NOT NULL,
    role ENUM('Faculty', 'HOD', 'PIC_TT', 'PIC_CDC', 'PIC_EXAM') DEFAULT 'Faculty',
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
    advisor_id VARCHAR(10),
    current_term_number INT NOT NULL,
    branch VARCHAR(50) NOT NULL,
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
-- STUDENT RESUME
-- =========================================
CREATE TABLE STUDENT_RESUME (
    resume_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL,
    file_name VARCHAR(100) NOT NULL,
    file_data LONGBLOB NOT NULL,
    file_size INT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    
    INDEX idx_student_resumse (student_id, is_deleted)
);

-- =========================================
-- COURSE
-- =========================================
CREATE TABLE COURSE (
    course_id VARCHAR(10) PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    credits INT CHECK (credits > 0),
    branch VARCHAR(50) NOT NULL
);


-- =========================================
-- COURSE OFFERING
-- =========================================
CREATE TABLE COURSE_OFFERING (
    offering_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id VARCHAR(10),
    type ENUM('Core','Elective', 'Lab', 'Breadth', 'Lateral') NOT NULL,
    faculty_id VARCHAR(10),
    term_number INT,
    total_classes_conducted INT DEFAULT 0,

    FOREIGN KEY (course_id) REFERENCES COURSE(course_id)
        ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES FACULTY(faculty_id)
        ON DELETE SET NULL,

    UNIQUE(course_id, term_number)
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
    classes_attended_count INT DEFAULT 0,

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
    faculty_id VARCHAR(10),
    term_number INT,
    offering_id INT NULL,
    resume_id INT NULL,
    role ENUM('Department TA','Course TA','Lab TA') DEFAULT 'Department TA',

    status ENUM('Pending','Accepted','Rejected') DEFAULT 'Pending',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES FACULTY(faculty_id)
        ON DELETE CASCADE,
    FOREIGN KEY (offering_id) REFERENCES COURSE_OFFERING(offering_id)
        ON DELETE SET NULL,
    FOREIGN KEY (resume_id) REFERENCES STUDENT_RESUME(resume_id)
        ON DELETE SET NULL,

    UNIQUE(student_id, faculty_id, term_number, offering_id)
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
    course_id VARCHAR(10),
    prereq_course_id VARCHAR(10),

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
    term_number INT,

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
    id VARCHAR(10) NOT NULL,
    sent_by VARCHAR(10) NOT NULL,

    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- INTERNSHIP OPENING
-- =========================================
CREATE TABLE INTERNSHIP_OPENING (
    opening_id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    stipend DECIMAL(10,2) NOT NULL,
    duration_months DECIMAL(4,1) NOT NULL,
    file_name VARCHAR(255),
    file_data LONGBLOB,
    file_size INT,
    is_active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE INTERNSHIP_BRANCH (
    opening_id INT,
    branch VARCHAR(50),
    PRIMARY KEY (opening_id, branch),
    FOREIGN KEY (opening_id) REFERENCES INTERNSHIP_OPENING(opening_id)
        ON DELETE CASCADE
);
-- =========================================
-- PLACEMENT OPENING
-- =========================================
CREATE TABLE PLACEMENT_OPENING (
    opening_id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    ctc DECIMAL(12,2) NOT NULL,
    file_name VARCHAR(255),
    file_data LONGBLOB,
    file_size INT,
    is_active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE PLACEMENT_BRANCH (
    opening_id INT,
    branch VARCHAR(50),
    PRIMARY KEY (opening_id, branch),
    FOREIGN KEY (opening_id) REFERENCES PLACEMENT_OPENING(opening_id)
        ON DELETE CASCADE
);
-- =========================================
-- INTERNSHIP
-- =========================================

CREATE TABLE INTERNSHIP (
    internship_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),
    opening_id INT NULL,
    resume_id INT NULL,

    company VARCHAR(100),
    role VARCHAR(100),
    package DECIMAL(10,2),
    duration DECIMAL(10,2),
    status ENUM('Applied','Accepted','Rejected') NOT NULL DEFAULT 'Applied',
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decision_at DATETIME NULL,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (opening_id) REFERENCES INTERNSHIP_OPENING(opening_id)
        ON DELETE SET NULL,
    FOREIGN KEY (resume_id) REFERENCES STUDENT_RESUME(resume_id)
        ON DELETE SET NULL
);

-- =========================================
-- PLACEMENT
-- =========================================
CREATE TABLE PLACEMENT (
    placement_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),
    opening_id INT NULL,
    resume_id INT NULL,

    company VARCHAR(100),
    role VARCHAR(100),
    package DECIMAL(10,2),
    status ENUM('Applied','Accepted','Rejected') NOT NULL DEFAULT 'Applied',
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decision_at DATETIME NULL,

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (opening_id) REFERENCES PLACEMENT_OPENING(opening_id)
        ON DELETE SET NULL,
    FOREIGN KEY (resume_id) REFERENCES STUDENT_RESUME(resume_id)
        ON DELETE SET NULL
);

-- =========================================
-- RESULT HISTORY
-- =========================================
CREATE TABLE RESULT_HISTORY (
    student_id VARCHAR(10),
    term_number INT,
    PRIMARY KEY (student_id, term_number),
    sgpa DECIMAL(4,2),
    cgpa DECIMAL(4,2),

    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE
);

-- =========================================
-- ACADEMIC TRANSCRIPT
-- =========================================
CREATE TABLE ACADEMIC_TRANSCRIPT (
    transcript_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL,
    course_id VARCHAR(10) NOT NULL,
    term_number INT NOT NULL,
    
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
    
    UNIQUE(student_id, course_id, term_number)
);

-- =========================================
-- SAMPLE DATA
-- =========================================
INSERT INTO ADMIN (admin_id, username, password) VALUES
    (1, 'admin', 'admin123');

INSERT INTO FACULTY (faculty_id, password, role, name, email, phone, department) VALUES
    ('CS01', 'faculty123', 'Faculty', 'Dr. Meera Nair', 'meera.nair@university.edu', '9876543210', 'CSE'),
    ('CSHOD', 'faculty123', 'HOD', 'Dr. Neel Khanna', 'neel.khanna@university.edu', '9876543220', 'CSE'),
    ('CSTT1', 'faculty123', 'PIC_TT', 'Dr. Sana Mirza', 'sana.mirza@university.edu', '9876543221', 'CSE'),
    ('CSCDC', 'faculty123', 'PIC_CDC', 'Dr. Arpit Sen', 'arpit.sen@university.edu', '9876543222', 'CSE'),
    ('CSF02', 'faculty123', 'Faculty', 'Dr. Priya Anand', 'priya.anand@university.edu', '9876543223', 'CSE'),

    ('IT01', 'faculty123', 'Faculty', 'Dr. Rohan Iyer', 'rohan.iyer@university.edu', '9876543211', 'IT'),
    ('ITHOD', 'faculty123', 'HOD', 'Dr. Ishita Rao', 'ishita.rao@university.edu', '9876543230', 'IT'),
    ('ITTT1', 'faculty123', 'PIC_TT', 'Dr. Vinay Kulkarni', 'vinay.kulkarni@university.edu', '9876543231', 'IT'),
    ('ITCDC', 'faculty123', 'PIC_CDC', 'Dr. Nidhi Arora', 'nidhi.arora@university.edu', '9876543232', 'IT'),
    ('ITF02', 'faculty123', 'Faculty', 'Dr. Aman Bedi', 'aman.bedi@university.edu', '9876543233', 'IT'),

    ('EC01', 'faculty123', 'Faculty', 'Dr. Kavya Menon', 'kavya.menon@university.edu', '9876543212', 'ECE'),
    ('ECHOD', 'faculty123', 'HOD', 'Dr. Pranav Pillai', 'pranav.pillai@university.edu', '9876543240', 'ECE'),
    ('ECTT1', 'faculty123', 'PIC_TT', 'Dr. Mitali Deshpande', 'mitali.deshpande@university.edu', '9876543241', 'ECE'),
    ('ECCDC', 'faculty123', 'PIC_CDC', 'Dr. Harsh Vora', 'harsh.vora@university.edu', '9876543242', 'ECE'),
    ('ECF02', 'faculty123', 'Faculty', 'Dr. Isha Mathew', 'isha.mathew@university.edu', '9876543243', 'ECE'),

    ('ME01', 'faculty123', 'Faculty', 'Dr. Arjun Das', 'arjun.das@university.edu', '9876543213', 'ME'),
    ('MEHOD', 'faculty123', 'HOD', 'Dr. Ketan Joshi', 'ketan.joshi@university.edu', '9876543250', 'ME'),
    ('METT1', 'faculty123', 'PIC_TT', 'Dr. Neha Kulshreshtha', 'neha.kulshreshtha@university.edu', '9876543251', 'ME'),
    ('MECDC', 'faculty123', 'PIC_CDC', 'Dr. Tushar Nene', 'tushar.nene@university.edu', '9876543252', 'ME'),
    ('MEF02', 'faculty123', 'Faculty', 'Dr. Ritu Mahajan', 'ritu.mahajan@university.edu', '9876543253', 'ME');

INSERT INTO STUDENT (
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
) VALUES
    ('23CS01', '1', 'Aarav Sharma', 2025, 'aarav.sharma@university.edu', 'aarav.sharma@gmail.com', '9000000001', '2004-06-14', 'CS01', 1, 'CSE'),
    ('23CS02', '1', 'Diya Patel', 2025, 'diya.patel@university.edu', 'diya.patel@gmail.com', '9000000002', '2004-11-02', 'IT01', 2, 'CSE'),
    ('23IT01', '1', 'Riya Verma', 2025, 'riya.verma@university.edu', 'riya.verma@gmail.com', '9000000003', '2004-03-22', 'IT01', 1, 'IT'),
    ('23EC01', '1', 'Kiran Rao', 2025, 'kiran.rao@university.edu', 'kiran.rao@gmail.com', '9000000004', '2004-08-30', 'EC01', 2, 'ECE'),
    ('23ME01', '1', 'Ananya Singh', 2025, 'ananya.singh@university.edu', 'ananya.singh@gmail.com', '9000000005', '2004-12-15', 'ME01', 6, 'ME'),
    ('23CS03', '1', 'Vivaan Kapoor', 2025, 'vivaan.kapoor@university.edu', 'vivaan.kapoor@gmail.com', '9000000006', '2004-09-20', 'CS01', 8, 'CSE');

INSERT INTO DOCUMENT (document_id, student_id, doc_type, file_name, file_data) VALUES
    (1, '23CS01', 'ID Card', '23CS01-id-card.pdf', NULL),
    (2, '23CS02', 'Transfer Certificate', '23CS02-tc.pdf', NULL),
    (3, '23IT01', 'ID Card', '23IT01-id-card.pdf', NULL),
    (4, '23EC01', 'Bonafide Certificate', '23EC01-bonafide.pdf', NULL);

INSERT INTO COURSE (course_id, course_name, branch, credits) VALUES
    ('CS101', 'Database Systems', 'CSE', 4),
    ('CS102', 'Operating Systems', 'CSE', 4),
    ('CS103', 'Web Development', 'CSE', 3),
    ('CS104', 'Data Structures', 'CSE', 4),
    ('IT101', 'Network Security', 'IT', 4),
    ('IT102', 'Cloud Computing', 'IT', 4),
    ('EC101', 'Microprocessors', 'ECE', 4),
    ('EC102', 'Digital Signal Processing', 'ECE', 4),
    ('ME101', 'Thermodynamics', 'ME', 4),
    ('ME102', 'Fluid Mechanics', 'ME', 4),
    ('CE101', 'Structural Analysis', 'CE', 4),
    ('CE102', 'Geotechnical Engineering', 'CE', 4),
    ('CS105', 'Artificial Intelligence', 'CSE', 4),
    ('CS106', 'Machine Learning', 'CSE', 4),
    ('CS107', 'Computer Networks', 'CSE', 4),
    ('CS108', 'Software Engineering', 'CSE', 4),
    ('CS109', 'Cybersecurity', 'CSE', 4),
    ('CS110', 'Mobile App Development', 'CSE', 4),
    ('IT103', 'Data Analytics', 'IT', 4),
    ('IT104', 'Internet of Things', 'IT', 4),
    ('EC103', 'VLSI Design', 'ECE', 4),
    ('EC104', 'Embedded Systems', 'ECE', 4),
    ('ME103', 'Manufacturing Processes', 'ME', 4),
    ('ME104', 'Robotics', 'ME', 4),
    ('CE103', 'Transportation Engineering', 'CE', 4),
    ('CE104', 'Environmental Engineering', 'CE', 4);

INSERT INTO COURSE_OFFERING (offering_id, course_id, type, faculty_id, term_number, total_classes_conducted) VALUES
    (1, 'CS101', 'Core', 'CS01', 1, 8),
    (2, 'CS102', 'Core', 'IT01', 1, 7),
    (3, 'CS103', 'Elective', 'CS01', 2, 9),
    (4, 'CS104', 'Lab', 'IT01', 2, 8),
    (5, 'IT101', 'Lateral', 'CS01', 1, 9),
    (6, 'IT102', 'Core', 'IT01', 1, 8),
    (7, 'EC101', 'Lateral', 'EC01', 1, 8),
    (8, 'EC102', 'Core', 'EC01', 2, 10),
    (9, 'ME101', 'Core', 'ME01', 1, 8),
    (10, 'ME102', 'Core', 'ME01', 2, 7),
    (11, 'CE101', 'Core', 'CS01', 1, 8),
    (12, 'CE102', 'Breadth', 'IT01', 2, 7),
    (13, 'CS105', 'Elective', 'CS01', 2, 9),
    (14, 'CS106', 'Elective', 'IT01', 2, 8),
    (15, 'CS107', 'Elective', 'CS01', 1, 8),
    (16, 'CS108', 'Elective', 'IT01', 1, 7),
    (17, 'CS109', 'Elective', 'CS01', 2, 9),
    (18, 'CS110', 'Elective', 'IT01', 2, 8),
    (19, 'IT103', 'Core', 'IT01', 1, 8),
    (20, 'IT104', 'Core', 'IT01', 2, 9),
    (21, 'EC103', 'Core', 'EC01', 1, 8),
    (22, 'EC104', 'Core', 'EC01', 2, 10),
    (23, 'ME103', 'Core', 'ME01', 1, 8),
    (24, 'ME104', 'Core', 'ME01', 2, 7),
    (25, 'CE103', 'Core', 'CS01', 1, 8),
    (26, 'CE104', 'Core', 'IT01', 2, 9);

INSERT INTO ENROLLMENT (enrollment_id, student_id, offering_id, enrollment_date) VALUES
    (1, '23CS01', 1, '2025-08-01'),
    (2, '23CS01', 2, '2025-08-02'),
    (3, '23CS02', 1, '2025-08-01'),
    (4, '23CS02', 3, '2026-01-10'),
    (5, '23IT01', 5, '2025-08-03'),
    (6, '23IT01', 6, '2025-08-05'),
    (7, '23EC01', 7, '2025-08-04'),
    (8, '23EC01', 8, '2026-01-12');

INSERT INTO MARKS (student_id, offering_id, mid_sem, end_sem, internal, grade) VALUES
    ('23CS01', 1, 26, 42, 17, 'A'),
    ('23CS01', 2, 24, 39, 16, 'B'),
    ('23CS02', 1, 28, 44, 18, 'A'),
    ('23CS02', 3, 27, 41, 19, 'A'),
    ('23IT01', 5, 25, 40, 18, 'A'),
    ('23IT01', 6, 23, 37, 17, 'B'),
    ('23EC01', 7, 22, 36, 15, 'B'),
    ('23EC01', 8, 26, 43, 18, 'A');

INSERT INTO ATTENDANCE (attendance_id, student_id, offering_id, classes_attended_count) VALUES
    (1, '23CS01', 1, 5),
    (2, '23CS02', 1, 3),
    (3, '23IT01', 5, 7),
    (4, '23EC01', 7, 6);

INSERT INTO EXAM (exam_id, offering_id, exam_type, exam_date, exam_time, venue) VALUES
    (1, 1, 'MidSem', '2025-09-20', '10:00:00', 'Hall A'),
    (2, 1, 'EndSem', '2025-11-30', '14:00:00', 'Hall B'),
    (3, 3, 'MidSem', '2026-03-15', '10:00:00', 'Hall C'),
    (4, 5, 'MidSem', '2025-09-22', '09:00:00', 'Hall D'),
    (5, 8, 'EndSem', '2026-04-05', '13:00:00', 'Hall E');

INSERT INTO LEAVE_APPLICATION (leave_id, student_id, start_date, end_date, reason, status, applied_on) VALUES
    (1, '23CS01', '2025-09-10', '2025-09-12', 'Medical leave', 'Approved', '2025-09-08'),
    (2, '23IT01', '2025-10-05', '2025-10-06', 'Family function', 'Pending', '2025-10-01');

INSERT INTO FEEDBACK (feedback_id, student_id, offering_id, rating, comment, submitted_on) VALUES
    (1, '23CS01', 1, 5, 'Clear explanations and practical examples.', '2025-11-20'),
    (2, '23CS02', 3, 4, 'Useful hands-on project work.', '2026-03-25'),
    (3, '23IT01', 5, 4, 'Interactive classes and good notes.', '2025-11-22'),
    (4, '23EC01', 8, 5, 'Well structured and exam-focused teaching.', '2026-04-08');

INSERT INTO TA_ASSIGNMENT (ta_id, student_id, faculty_id, term_number, offering_id, role, status) VALUES
    (1, '23CS02', 'CS01', 2, 3, 'Lab TA', 'Accepted'),
    (2, '23IT01', 'IT01', 1, 6, 'Course TA', 'Accepted');

INSERT INTO CGPA (student_id, cgpa) VALUES
    ('23CS01', 8.75),
    ('23CS02', 8.40),
    ('23IT01', 8.10),
    ('23EC01', 8.32);

INSERT INTO ROOM (room_id, capacity, building) VALUES
    ('R101', 60, 'Main Block'),
    ('LAB-1', 30, 'Innovation Center'),
    ('R202', 80, 'Academic Block');

INSERT INTO TIMETABLE (timetable_id, offering_id, day, start_time, end_time, room_id) VALUES
    (1, 1, 'Mon', '09:00:00', '10:30:00', 'R101'),
    (2, 2, 'Wed', '11:00:00', '12:30:00', 'LAB-1'),
    (3, 3, 'Fri', '14:00:00', '15:30:00', 'R101'),
    (4, 5, 'Tue', '10:00:00', '11:30:00', 'R202'),
    (5, 8, 'Thu', '13:00:00', '14:30:00', 'R202');

INSERT INTO PREREQUISITE (course_id, prereq_course_id) VALUES
    ('CS102', 'CS101'),
    ('CS103', 'CS101'),
    ('CS106', 'CS105'),
    ('IT104', 'IT103');

INSERT INTO PAYMENT (payment_id, student_id, payment_type, term_number, amount, payment_date, status) VALUES
    (1, '23CS01', 'Tuition', 1, 45000.00, '2025-08-15', 'Paid'),
    (2, '23CS02', 'Tuition', 2, 47000.00, '2026-01-15', 'Pending'),
    (3, '23IT01', 'Tuition', 1, 46000.00, '2025-08-16', 'Paid'),
    (4, '23EC01', 'Tuition', 2, 45500.00, '2026-01-16', 'Pending');

INSERT INTO NOTIFICATION (notification_id, id, sent_by, message, created_at) VALUES
    (1, '23CS01', 'CS01', 'Mid-semester exam schedule published.', '2026-04-02 09:00:00'),
    (2, '23CS02', 'IT01', 'Fee payment reminder for Spring term.', '2026-01-20 12:00:00'),
    (3, '23IT01', 'IT01', 'Project review scheduled for next week.', '2025-10-02 10:00:00'),
    (4, '23EC01', 'EC01', 'Lab timetable updated for term 2.', '2026-02-03 15:00:00'),
    (5, 'CS101', 'CS01', 'Dummy course notification: CS101 quiz this Friday.', '2026-04-03 08:30:00'),
    (6, '23CS01', 'CS01', 'Dummy personal notification for testing red dot.', '2026-04-03 09:15:00'),
    (7, 'CS01', 'CS01', 'Dummy FA notification: Meet your advisor this week.', '2026-04-03 10:00:00');

INSERT INTO INTERNSHIP_OPENING (opening_id, company, role, stipend, duration_months, is_active) VALUES
    (1, 'InnovaTech', 'Software Intern', 18000.00, 3.0, 1),
    (2, 'DataSphere', 'Data Analyst Intern', 20000.00, 2.5, 1),
    (3, 'ByteFlow', 'Backend Intern', 22000.00, 4.0, 1);

INSERT INTO PLACEMENT_OPENING (opening_id, company, role, ctc, is_active) VALUES
    (1, 'CloudNova', 'Junior Developer', 640000.00, 1),
    (2, 'ChipCore', 'Embedded Engineer', 710000.00, 1),
    (3, 'CodePulse', 'Software Engineer', 850000.00, 1);

INSERT INTO INTERNSHIP_BRANCH (opening_id, branch) VALUES
    (1, 'CSE'),
    (1, 'IT'),
    (2, 'ECE'),
    (2, 'ME'),
    (3, 'CSE');

INSERT INTO PLACEMENT_BRANCH (opening_id, branch) VALUES
    (1, 'CSE'),
    (1, 'IT'),
    (2, 'ECE'),
    (2, 'ME'),
    (3, 'CSE');

INSERT INTO INTERNSHIP (internship_id, student_id, opening_id, company, role, package, duration, status, applied_at, decision_at) VALUES
    (1, '23CS01', 1, 'InnovaTech', 'Software Intern', 18000.00, 3.00, 'Accepted', '2026-01-05 10:00:00', '2026-01-20 10:00:00'),
    (2, '23IT01', 2, 'DataSphere', 'Data Analyst Intern', 20000.00, 2.50, 'Accepted', '2026-01-08 10:00:00', '2026-01-25 10:00:00');

INSERT INTO PLACEMENT (placement_id, student_id, opening_id, company, role, package, status, applied_at, decision_at) VALUES
    (1, '23CS02', 1, 'CloudNova', 'Junior Developer', 640000.00, 'Accepted', '2026-02-01 10:00:00', '2026-03-10 10:00:00'),
    (2, '23EC01', 2, 'ChipCore', 'Embedded Engineer', 710000.00, 'Accepted', '2026-02-05 10:00:00', '2026-03-12 10:00:00');

INSERT INTO RESULT_HISTORY (student_id, term_number, sgpa, cgpa) VALUES
    ('23CS01', 1, 8.60, 8.60),
    ('23CS02', 2, 8.90, 8.90),
    ('23IT01', 1, 8.10, 8.10),
    ('23EC01', 2, 8.32, 8.32);

INSERT INTO ACADEMIC_TRANSCRIPT (
    transcript_id,
    student_id,
    course_id,
    term_number,
    mid_sem,
    end_sem,
    internal,
    grade,
    recorded_date
) VALUES
    (1, '23CS01', 'CS101', 1, 26, 42, 17, 'A', '2025-12-01 10:00:00'),
    (2, '23CS01', 'CS102', 1, 24, 39, 16, 'B', '2025-12-01 10:05:00'),
    (3, '23CS02', 'CS101', 1, 28, 44, 18, 'A', '2025-12-01 10:10:00'),
    (4, '23CS02', 'CS103', 2, 27, 41, 19, 'A', '2026-04-01 10:00:00'),
    (5, '23IT01', 'IT101', 1, 25, 40, 18, 'A', '2025-12-01 10:20:00'),
    (6, '23EC01', 'EC102', 2, 26, 43, 18, 'A', '2026-04-01 10:30:00');