-- Adds Institution-login support and the approval-queue workflow:
-- an Institution account can propose changes to courses/subjects/students/
-- marks/attendance, but nothing touches the live tables until a Department
-- Admin approves the pending change. Not wired into the active UI yet -
-- this is the backend foundation for when that login is turned on.

USE ems_dev;

-- `users.inst_id` ties an "Institution" role account to one tbl_inst_master
-- row. NULL for every other role (Super Admin / department-admin).
ALTER TABLE users ADD COLUMN inst_id INT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_inst FOREIGN KEY (inst_id) REFERENCES tbl_inst_master(inst_id);

DROP TABLE IF EXISTS tbl_attendance;
DROP TABLE IF EXISTS tbl_student_marks;
DROP TABLE IF EXISTS tbl_student_master;
DROP TABLE IF EXISTS tbl_pending_changes;

CREATE TABLE tbl_student_master (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    student_name VARCHAR(150) NOT NULL,
    register_no VARCHAR(50),
    inst_id INT NOT NULL,
    course_id INT NOT NULL,
    term VARCHAR(20),
    created_by VARCHAR(50),
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ VARCHAR(20) DEFAULT 'Active',

    CONSTRAINT fk_student_inst FOREIGN KEY (inst_id) REFERENCES tbl_inst_master(inst_id),
    CONSTRAINT fk_student_course FOREIGN KEY (course_id) REFERENCES tbl_course_master(course_id)
);

CREATE TABLE tbl_student_marks (
    mark_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    internal_marks INT,
    exam_marks INT,
    result VARCHAR(10),
    created_by VARCHAR(50),
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ VARCHAR(20) DEFAULT 'Active',

    CONSTRAINT fk_marks_student FOREIGN KEY (student_id) REFERENCES tbl_student_master(student_id),
    CONSTRAINT fk_marks_subject FOREIGN KEY (subject_id) REFERENCES tbl_subject_master(subject_id),
    CONSTRAINT uq_marks_student_subject UNIQUE (student_id, subject_id)
);

CREATE TABLE tbl_attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    exam_type VARCHAR(20),
    attendance_status VARCHAR(10),
    created_by VARCHAR(50),
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ VARCHAR(20) DEFAULT 'Active',

    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES tbl_student_master(student_id),
    CONSTRAINT fk_attendance_subject FOREIGN KEY (subject_id) REFERENCES tbl_subject_master(subject_id),
    CONSTRAINT uq_attendance_student_subject_exam UNIQUE (student_id, subject_id, exam_type)
);

-- Generic queue: one row per proposed create/update/delete on any entity
-- type. `payload_json` holds the proposed field values. Nothing in the
-- live tables changes until a Department Admin calls the approve endpoint,
-- which applies payload_json and marks the row Approved (or Rejected, which
-- never applies it).
CREATE TABLE tbl_pending_changes (
    change_id INT PRIMARY KEY AUTO_INCREMENT,
    entity_type VARCHAR(40) NOT NULL,
    action VARCHAR(10) NOT NULL,
    entity_id INT NULL,
    institution_id INT NOT NULL,
    payload_json TEXT NOT NULL,
    status_ VARCHAR(20) NOT NULL DEFAULT 'Pending',
    requested_by VARCHAR(50),
    requested_date DATETIME,
    reviewed_by VARCHAR(50),
    reviewed_date DATETIME,
    review_note VARCHAR(255),

    CONSTRAINT fk_pending_changes_inst FOREIGN KEY (institution_id) REFERENCES tbl_inst_master(inst_id),
    CONSTRAINT chk_pending_action CHECK (action IN ('create', 'update', 'delete')),
    CONSTRAINT chk_pending_status CHECK (status_ IN ('Pending', 'Approved', 'Rejected'))
);



-- ============================================================================
--  EXAM SCHEDULE 
-- ============================================================================



DROP TABLE IF EXISTS tbl_exam_category_master;
CREATE TABLE tbl_exam_category_master (
    exam_cat_id INT PRIMARY KEY CHECK (exam_cat_id BETWEEN 0 AND 99),
    exam_cat_desc VARCHAR(100),
    created_by VARCHAR(50),
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN
);

INSERT INTO tbl_exam_category_master (exam_cat_id, exam_cat_desc, created_by, created_date, status_) VALUES
  (1, 'Main Exam (M)', 'system', NOW(), 1),
  (2, 'Arrear Exam (A)', 'system', NOW(), 1);


DROP TABLE IF EXISTS tbl_exam_session_master;
CREATE TABLE tbl_exam_session_master (
    exam_session_id INT PRIMARY KEY CHECK (exam_session_id BETWEEN 0 AND 99),
    exam_session_desc VARCHAR(100),
    exam_session_abr VARCHAR(10),
    created_by VARCHAR(50),
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN
);

INSERT INTO tbl_exam_session_master (exam_session_id, exam_session_desc, exam_session_abr, created_by, created_date, status_) VALUES
  (1, 'Forenoon', 'FN', 'system', NOW(), 1),
  (2, 'Afternoon', 'AN', 'system', NOW(), 1);

DROP TABLE IF EXISTS tbl_exam_type_master;
CREATE TABLE tbl_exam_type_master (
    exam_type_id INT PRIMARY KEY CHECK (exam_type_id BETWEEN 0 AND 99),
    exam_type_desc VARCHAR(100),
    created_by VARCHAR(50),
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN
);

INSERT INTO tbl_exam_type_master (exam_type_id, exam_type_desc, created_by, created_date, status_) VALUES
  (1, 'Internal Assessment (IA)', 'system', NOW(), 1),
  (2, 'External Assessment (EA)', 'system', NOW(), 1),
  (3, 'Theory / Practical (TH)', 'system', NOW(), 1);

DROP TABLE IF EXISTS tbl_marks_category_master;
CREATE TABLE tbl_marks_category_master (
    marks_cat_id INT PRIMARY KEY CHECK (marks_cat_id BETWEEN 0 AND 99),
    marks_cat_desc VARCHAR(100),
    created_by VARCHAR(50),
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN
);

INSERT INTO tbl_marks_category_master (marks_cat_id, marks_cat_desc, created_by, created_date, status_) VALUES
  (1, 'Distinction', 'system', NOW(), 1),
  (2, 'First Division', 'system', NOW(), 1),
  (3, 'Second Division', 'system', NOW(), 1),
  (4, 'Third Division', 'system', NOW(), 1),
  (5, 'Pass', 'system', NOW(), 1),
  (6, 'Fail', 'system', NOW(), 1);

DROP TABLE IF EXISTS tbl_year_ref;
CREATE TABLE tbl_year_ref (
    year_ref INT PRIMARY KEY CHECK (year_ref BETWEEN 0 AND 99),
    year_ref_desc VARCHAR(100),
    created_by VARCHAR(50),
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN
);

INSERT INTO tbl_year_ref (year_ref, year_ref_desc, created_by, created_date, status_) VALUES
  (1, '2010', 'system', NOW(), 1),
  (2, '2011', 'system', NOW(), 1),
  (3, '2012', 'system', NOW(), 1),
  (4, '2013', 'system', NOW(), 1),
  (5, '2014', 'system', NOW(), 1),
  (6, '2015', 'system', NOW(), 1),
  (7, '2016', 'system', NOW(), 1),
  (8, '2017', 'system', NOW(), 1),
  (9, '2018', 'system', NOW(), 1),
  (10, '2019', 'system', NOW(), 1),
  (11, '2020', 'system', NOW(), 1),
  (12, '2021', 'system', NOW(), 1),
  (13, '2022', 'system', NOW(), 1),
  (14, '2023', 'system', NOW(), 1),
  (15, '2024', 'system', NOW(), 1),
  (16, '2025', 'system', NOW(), 1),
  (17, '2026', 'system', NOW(), 1),
  (18, '2027', 'system', NOW(), 1),
  (19, '2028', 'system', NOW(), 1),
  (20, '2029', 'system', NOW(), 1),
  (21, '2030', 'system', NOW(), 1),
  (22, '2031', 'system', NOW(), 1),
  (23, '2032', 'system', NOW(), 1),
  (24, '2033', 'system', NOW(), 1),
  (25, '2034', 'system', NOW(), 1),
  (26, '2035', 'system', NOW(), 1);
  
----------------------------------------------------------------------------


DROP TABLE IF EXISTS tbl_exam_schedule;
CREATE TABLE tbl_exam_schedule (
    exam_sch_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    subject_id INT NOT NULL,
    year_id INT NOT NULL,
    sem_id INT NOT NULL,
    exam_date DATE NULL,
    exam_session_id INT NULL,
    exam_cat_id INT NULL,
    created_by VARCHAR(50),
    created_date DATETIME,
    status_ VARCHAR(20) NOT NULL DEFAULT 'Active',
    FOREIGN KEY (course_id) REFERENCES tbl_course_master(course_id),
    FOREIGN KEY (subject_id) REFERENCES tbl_subject_master(subject_id),
    FOREIGN KEY (year_id) REFERENCES tbl_year_master(year_id),
    FOREIGN KEY (sem_id) REFERENCES tbl_exam_sem_master(sem_id)
);


DROP TABLE IF EXISTS tbl_student_det;
CREATE TABLE tbl_student_det (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    student_reg_no VARCHAR(50) NULL,
    student_name VARCHAR(300) NOT NULL,
    student_dob DATE NULL,
    student_father_name VARCHAR(300) NULL,
    student_address VARCHAR(300) NULL,
    student_email VARCHAR(100) NULL,
    student_mobile VARCHAR(20) NULL,
    region_id INT NULL,
    created_by VARCHAR(50),
    created_date DATETIME,
    status_ VARCHAR(20) NOT NULL DEFAULT 'Active',
    FOREIGN KEY (region_id) REFERENCES tbl_region_master(region_id)
);


DROP TABLE IF EXISTS tbl_student_enrol;
CREATE TABLE tbl_student_enrol (
    student_enrol_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    inst_id INT NOT NULL,
    course_id INT NOT NULL,
    year_id INT NOT NULL,
    student_reg_no VARCHAR(50) NULL,
    created_by VARCHAR(50),
    created_date DATETIME,
    status_ VARCHAR(20) NOT NULL DEFAULT 'Active',
    FOREIGN KEY (student_id) REFERENCES tbl_student_det(student_id),
    FOREIGN KEY (inst_id) REFERENCES tbl_inst_master(inst_id),
    FOREIGN KEY (course_id) REFERENCES tbl_course_master(course_id),
    FOREIGN KEY (year_id) REFERENCES tbl_year_master(year_id)
);

DROP TABLE IF EXISTS tbl_student_marks;
CREATE TABLE tbl_student_marks (
    student_marks_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    exam_type_id INT NOT NULL,
    exam_cat_id INT NULL,
    marks_obtain DECIMAL(10,2) NULL,
    exam_date DATE NULL,
    total_marks DECIMAL(10,2) NULL,
    created_by VARCHAR(50),
    created_date DATETIME,
    status_ VARCHAR(20) NOT NULL DEFAULT 'Active',
    FOREIGN KEY (student_id) REFERENCES tbl_student_det(student_id),
    FOREIGN KEY (subject_id) REFERENCES tbl_subject_master(subject_id),
    FOREIGN KEY (exam_type_id) REFERENCES tbl_exam_type_master(exam_type_id)
);

-- ============================================================================
--  ADDITIONAL
-- ============================================================================

DROP TABLE IF EXISTS tbl_subject_marks_log;
CREATE TABLE tbl_subject_marks_log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    course_subject_id INT NOT NULL,
    exam_type_id INT NOT NULL,
    old_max_marks INT NULL,
    old_pass_marks INT NULL,
    old_total_marks INT NULL,
    new_max_marks INT NULL,
    new_pass_marks INT NULL,
    new_total_marks INT NULL,
    action_ VARCHAR(10) NOT NULL,
    signature_name VARCHAR(100) NULL,
    signed_by VARCHAR(50) NULL,
    signed_payload TEXT NULL,
    signature_ TEXT NULL,
    signed_date DATETIME NULL,
    changed_by VARCHAR(50),
    changed_date DATETIME,
    FOREIGN KEY (course_subject_id) REFERENCES tbl_course_subject_map(course_subject_id),
    FOREIGN KEY (exam_type_id) REFERENCES tbl_exam_type_master(exam_type_id)
);

DROP TABLE IF EXISTS tbl_pending_changes;
CREATE TABLE tbl_pending_changes (
    change_id INT PRIMARY KEY AUTO_INCREMENT,
    entity_type VARCHAR(30) NOT NULL,
    action VARCHAR(10) NOT NULL,
    entity_id INT NULL,
    institution_id INT NOT NULL,
    payload_json JSON NULL,
    status_ VARCHAR(20) NOT NULL DEFAULT 'Pending',
    requested_by VARCHAR(50),
    requested_date DATETIME,
    reviewed_by VARCHAR(50) NULL,
    reviewed_date DATETIME NULL,
    review_note VARCHAR(255) NULL
);

-- One RSA key pair per user.
DROP TABLE IF EXISTS tbl_user_keys;
CREATE TABLE tbl_user_keys (
    user_id VARCHAR(50) PRIMARY KEY,
    public_key TEXT NOT NULL,
    private_key TEXT NOT NULL,
    created_date DATETIME
);



------------------------------------------------------------------------------------

ALTER TABLE users
  ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT 0;

ALTER TABLE users
  ADD COLUMN institution_role VARCHAR(20) NULL;

ALTER TABLE tbl_student_det ADD COLUMN admission_year DATE NULL AFTER student_dob;


ALTER TABLE tbl_inst_master ADD COLUMN inst_email VARCHAR(255) NULL AFTER inst_name;
ALTER TABLE tbl_student_det ADD COLUMN student_gender VARCHAR(10) NULL AFTER student_mobile;
ALTER TABLE tbl_student_det ADD COLUMN student_photo VARCHAR(255) NULL AFTER student_gender;
ALTER TABLE tbl_student_det ADD COLUMN student_other_state VARCHAR(100) NULL AFTER region_id;
