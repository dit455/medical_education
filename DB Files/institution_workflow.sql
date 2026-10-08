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




------------------------------------------------------------------------------------------------


ALTER TABLE tbl_inst_master
    ADD COLUMN inst_abbr VARCHAR(30) NULL AFTER inst_name;

ALTER TABLE tbl_course_master
    ADD COLUMN course_abbr VARCHAR(30) NULL AFTER course_desc;

ALTER TABLE tbl_inst_course_map
    ADD COLUMN duration INT NULL AFTER course_id;   


INSERT INTO tbl_inst_master
(inst_id, inst_name, inst_abbr, bome_status, boen_status, region_id, cat_id, created_by, created_date, status_)
VALUES
(22, 'East Coast Institute of Paramedical Sciences, Puducherry', 'ECIPS', 1, 0, 1, 2, 'system', NOW(), 1);

INSERT INTO tbl_inst_master
(inst_id, inst_name, inst_abbr, bome_status, boen_status, region_id, cat_id, created_by, created_date, status_)
VALUES
(19, 'Annai Abirami Community College of Health Sciences', 'AA', 1, 0, 2, 2, 'system', NOW(), 1);


INSERT INTO tbl_course_master
(course_id, course_desc, course_abbr, bome_status, boen_status, created_by, created_date, status_) VALUES
(27, 'Diploma In Uro Technology', 'DUT',  1, 0, 'system', NOW(), 1),
(28, 'Diploma In ECG Technician', 'DECG', 1, 0, 'system', NOW(), 1);



UPDATE tbl_inst_master SET inst_abbr='MTP'   WHERE inst_id=1;   
UPDATE tbl_inst_master SET inst_abbr='MTK'   WHERE inst_id=2;   
UPDATE tbl_inst_master SET inst_abbr='MTM'   WHERE inst_id=3;   
UPDATE tbl_inst_master SET inst_abbr='MTY'   WHERE inst_id=4;   
UPDATE tbl_inst_master SET inst_abbr='VMP'   WHERE inst_id=5;  
UPDATE tbl_inst_master SET inst_abbr='PUCC'  WHERE inst_id=6;   
UPDATE tbl_inst_master SET inst_abbr='SVCPS' WHERE inst_id=7;   
UPDATE tbl_inst_master SET inst_abbr='ECIMS' WHERE inst_id=8;   
UPDATE tbl_inst_master SET inst_abbr='IIHS'  WHERE inst_id=9;   
UPDATE tbl_inst_master SET inst_abbr='VMK'   WHERE inst_id=10;  
UPDATE tbl_inst_master SET inst_abbr='AEH'   WHERE inst_id=11;  
UPDATE tbl_inst_master SET inst_abbr='AGP'   WHERE inst_id=12;  
UPDATE tbl_inst_master SET inst_abbr='RGAMC' WHERE inst_id=13;  
UPDATE tbl_inst_master SET inst_abbr='SVCP'  WHERE inst_id=14;  
UPDATE tbl_inst_master SET inst_abbr='ICON'  WHERE inst_id=15;  
UPDATE tbl_inst_master SET inst_abbr='RAAK'  WHERE inst_id=16;  
UPDATE tbl_inst_master SET inst_abbr='MGDC'  WHERE inst_id=17;  
UPDATE tbl_inst_master SET inst_abbr='SAHS'  WHERE inst_id=18;  
UPDATE tbl_inst_master SET inst_abbr='AA'    WHERE inst_id=19;  
UPDATE tbl_inst_master SET inst_abbr='CIAHS' WHERE inst_id=20;  
UPDATE tbl_inst_master SET inst_abbr='CCN'   WHERE inst_id=21;  


UPDATE tbl_course_master SET course_abbr='DGNM'    WHERE course_id=1;
UPDATE tbl_course_master SET course_abbr='ANM'     WHERE course_id=2;
UPDATE tbl_course_master SET course_abbr='DMLT'    WHERE course_id=3;
UPDATE tbl_course_master SET course_abbr='DCRA'    WHERE course_id=4;
UPDATE tbl_course_master SET course_abbr='DCEC'    WHERE course_id=5;
UPDATE tbl_course_master SET course_abbr='DDT-OLD' WHERE course_id=6;
UPDATE tbl_course_master SET course_abbr='DHP'     WHERE course_id=7;
UPDATE tbl_course_master SET course_abbr='DSP'     WHERE course_id=8;
UPDATE tbl_course_master SET course_abbr='DOT'     WHERE course_id=9;
UPDATE tbl_course_master SET course_abbr='DO'      WHERE course_id=10;
UPDATE tbl_course_master SET course_abbr='DHI'     WHERE course_id=11;
UPDATE tbl_course_master SET course_abbr='DAPT'    WHERE course_id=12;
UPDATE tbl_course_master SET course_abbr='DAP'     WHERE course_id=13;
UPDATE tbl_course_master SET course_abbr='DPHARM-OLD' WHERE course_id=14;
UPDATE tbl_course_master SET course_abbr='DCEC-REV' WHERE course_id=15;
UPDATE tbl_course_master SET course_abbr='DDT'     WHERE course_id=16;
UPDATE tbl_course_master SET course_abbr='DMHW-F'  WHERE course_id=17;
UPDATE tbl_course_master SET course_abbr='DDH'     WHERE course_id=18;
UPDATE tbl_course_master SET course_abbr='DDM'     WHERE course_id=19;
UPDATE tbl_course_master SET course_abbr='DMIT'    WHERE course_id=20;
UPDATE tbl_course_master SET course_abbr='DCCT'    WHERE course_id=21;
UPDATE tbl_course_master SET course_abbr='DOTT'    WHERE course_id=22;
UPDATE tbl_course_master SET course_abbr='D.PHARM' WHERE course_id=23;
UPDATE tbl_course_master SET course_abbr='DAT'     WHERE course_id=24;
UPDATE tbl_course_master SET course_abbr='DECT'    WHERE course_id=25;
UPDATE tbl_course_master SET course_abbr='DSI'     WHERE course_id=26;




INSERT INTO tbl_subject_master
(subject_id, subject_desc, bome_status, boen_status, created_by, created_date, status_) VALUES

(100,'BIO-SCIENCES',0,1,'system',NOW(),1),
(101,'BEHAVIOURAL SCIENCES',0,1,'system',NOW(),1),
(102,'NURSING FOUNDATION',0,1,'system',NOW(),1),
(103,'COMMUNITY HEALTH NURSING - I',0,1,'system',NOW(),1),
(104,'MEDICAL SURGICAL NURSING - I',0,1,'system',NOW(),1),
(105,'MEDICAL SURGICAL NURSING - II',0,1,'system',NOW(),1),
(106,'MENTAL HEALTH NURSING',0,1,'system',NOW(),1),
(107,'PEDIATRIC NURSING',0,1,'system',NOW(),1),
(108,'MIDWIFERY & GYNECOLOGICAL NURSING',0,1,'system',NOW(),1),
(109,'COMMUNITY HEALTH NURSING - II',0,1,'system',NOW(),1),

(110,'COMMUNITY HEALTH NURSING',0,1,'system',NOW(),1),
(111,'HEALTH PROMOTION',0,1,'system',NOW(),1),
(112,'PRIMARY HEALTH CARE NURSING',0,1,'system',NOW(),1),
(113,'CHILD HEALTH NURSING',0,1,'system',NOW(),1),
(114,'MIDWIFERY',0,1,'system',NOW(),1),
(115,'HEALTH CENTRE MANAGEMENT',0,1,'system',NOW(),1),

(116,'PAPER-IV',1,0,'system',NOW(),1),
(117,'PAPER-V',1,0,'system',NOW(),1),
(118,'PAPER-VI',1,0,'system',NOW(),1),

(119,'BASIC ECG TECHNOLOGY',1,0,'system',NOW(),1);


UPDATE tbl_inst_course_map SET duration=3 WHERE inst_course_id=1;
UPDATE tbl_inst_course_map SET duration=2 WHERE inst_course_id=2;
UPDATE tbl_inst_course_map SET duration=2 WHERE inst_course_id=3;
UPDATE tbl_inst_course_map SET duration=2 WHERE inst_course_id=4;





INSERT INTO tbl_inst_course_map (inst_course_id, inst_id, duration, course_id, created_by, created_date, status_) VALUES
(1,1,3,1,'system',NOW(),1),(2,1,2,2,'system',NOW(),1),(3,2,2,3,'system',NOW(),1),(4,3,2,4,'system',NOW(),1),
(5,18,2,21,'system',NOW(),1),(6,18,2,20,'system',NOW(),1),(7,18,2,16,'system',NOW(),1),(8,18,2,22,'system',NOW(),1),
(9,19,2,24,'system',NOW(),1),(10,19,2,16,'system',NOW(),1),(11,19,2,25,'system',NOW(),1),(12,19,2,20,'system',NOW(),1),
(13,19,2,3,'system',NOW(),1),(14,19,2,10,'system',NOW(),1),(15,19,2,22,'system',NOW(),1),(16,19,2,11,'system',NOW(),1),
(17,1,2,20,'system',NOW(),1),(18,1,2,16,'system',NOW(),1),
(19,11,2,10,'system',NOW(),1),(20,11,2,9,'system',NOW(),1),
(21,14,2,23,'system',NOW(),1),
(22,7,2,16,'system',NOW(),1),(23,7,2,21,'system',NOW(),1),(24,7,2,20,'system',NOW(),1),
(25,22,2,21,'system',NOW(),1),(26,22,2,16,'system',NOW(),1),(27,22,2,3,'system',NOW(),1),
(28,13,2,12,'system',NOW(),1),
(29,17,2,19,'system',NOW(),1),(30,17,2,18,'system',NOW(),1),
(31,5,3,1,'system',NOW(),1),(32,10,3,1,'system',NOW(),1),(33,2,3,1,'system',NOW(),1),
(34,4,3,1,'system',NOW(),1),(35,15,3,1,'system',NOW(),1),(36,8,3,1,'system',NOW(),1),(37,9,3,1,'system',NOW(),1),
(38,12,3,1,'system',NOW(),1),
(39,4,2,2,'system',NOW(),1),(40,12,2,2,'system',NOW(),1),(41,15,2,2,'system',NOW(),1),
(42,8,2,2,'system',NOW(),1),(43,5,2,2,'system',NOW(),1),(44,16,2,2,'system',NOW(),1),(45,19,2,2,'system',NOW(),1);


INSERT INTO tbl_course_subject_map
(course_subject_id, course_id, subject_id, year_id, sem_id, priority_id, created_by, created_date, status_) VALUES

(1,20,28,1,1,1,'system',NOW(),1),(2,20,29,1,1,2,'system',NOW(),1),
(3,20,30,1,1,3,'system',NOW(),1),(4,20,56,1,1,4,'system',NOW(),1),
(5,20,55,2,3,1,'system',NOW(),1),(6,20,57,2,3,2,'system',NOW(),1),
(7,20,59,2,3,3,'system',NOW(),1),(8,20,58,2,3,4,'system',NOW(),1),

(9,21,28,1,1,1,'system',NOW(),1),(10,21,29,1,1,2,'system',NOW(),1),
(11,21,30,1,1,3,'system',NOW(),1),
(12,21,61,2,3,1,'system',NOW(),1),(13,21,62,2,3,2,'system',NOW(),1),

(14,16,28,1,1,1,'system',NOW(),1),(15,16,29,1,1,2,'system',NOW(),1),
(16,16,30,1,1,3,'system',NOW(),1),
(17,16,31,2,3,1,'system',NOW(),1),(18,16,32,2,3,2,'system',NOW(),1),

(19,22,28,1,1,1,'system',NOW(),1),(20,22,29,1,1,2,'system',NOW(),1),
(21,22,30,1,1,3,'system',NOW(),1),(22,22,64,1,1,4,'system',NOW(),1),
(23,22,65,2,3,1,'system',NOW(),1),(24,22,66,2,3,2,'system',NOW(),1),
(25,22,67,2,3,3,'system',NOW(),1),

(26,24,28,1,1,1,'system',NOW(),1),(27,24,29,1,1,2,'system',NOW(),1),
(28,24,30,1,1,3,'system',NOW(),1),(29,24,90,1,1,4,'system',NOW(),1),
(30,24,92,2,3,1,'system',NOW(),1),(31,24,91,2,3,2,'system',NOW(),1),
(32,24,67,2,3,3,'system',NOW(),1),

(33,18,40,2,3,1,'system',NOW(),1),(34,18,41,2,3,2,'system',NOW(),1),
(35,18,42,2,3,3,'system',NOW(),1),

(36,19,46,1,1,1,'system',NOW(),1),(37,19,47,1,1,2,'system',NOW(),1),
(38,19,48,1,1,3,'system',NOW(),1),
(39,19,51,2,3,1,'system',NOW(),1),(40,19,52,2,3,2,'system',NOW(),1),
(41,19,53,2,3,3,'system',NOW(),1),

(42,26,116,2,3,1,'system',NOW(),1),(43,26,117,2,3,2,'system',NOW(),1),
(44,26,118,2,3,3,'system',NOW(),1),

(45,3,1,1,1,1,'system',NOW(),1),(46,3,2,1,1,2,'system',NOW(),1),
(47,3,3,2,3,1,'system',NOW(),1),(48,3,4,2,3,2,'system',NOW(),1),
(49,3,5,2,3,3,'system',NOW(),1),

(50,10,14,1,1,1,'system',NOW(),1),(51,10,15,1,1,2,'system',NOW(),1),
(52,10,16,2,3,1,'system',NOW(),1),(53,10,17,2,3,2,'system',NOW(),1),

(54,9,10,1,1,1,'system',NOW(),1),(55,9,11,1,1,2,'system',NOW(),1),
(56,9,13,2,3,1,'system',NOW(),1),(57,9,12,2,3,2,'system',NOW(),1),

(58,23,69,1,1,1,'system',NOW(),1),(59,23,70,1,1,2,'system',NOW(),1),
(60,23,71,1,1,3,'system',NOW(),1),(61,23,72,1,1,4,'system',NOW(),1),
(62,23,73,1,1,5,'system',NOW(),1),
(63,23,79,2,3,1,'system',NOW(),1),(64,23,80,2,3,2,'system',NOW(),1),
(65,23,81,2,3,3,'system',NOW(),1),(66,23,82,2,3,4,'system',NOW(),1),
(67,23,83,2,3,5,'system',NOW(),1),(68,23,84,2,3,6,'system',NOW(),1),

(69,12,18,1,1,1,'system',NOW(),1),(70,12,19,1,1,2,'system',NOW(),1),
(71,12,20,1,1,3,'system',NOW(),1),(72,12,21,1,1,4,'system',NOW(),1),

(73,27,28,1,1,1,'system',NOW(),1),(74,27,29,1,1,2,'system',NOW(),1),
(75,27,30,1,1,3,'system',NOW(),1),(76,27,56,1,1,4,'system',NOW(),1),

(77,28,28,1,1,1,'system',NOW(),1),(78,28,29,1,1,2,'system',NOW(),1),
(79,28,30,1,1,3,'system',NOW(),1),(80,28,119,1,1,4,'system',NOW(),1),

(81,1,100,1,1,1,'system',NOW(),1),(82,1,101,1,1,2,'system',NOW(),1),
(83,1,102,1,1,3,'system',NOW(),1),(84,1,103,1,1,4,'system',NOW(),1),
(85,1,104,2,3,1,'system',NOW(),1),(86,1,105,2,3,2,'system',NOW(),1),
(87,1,106,2,3,3,'system',NOW(),1),(88,1,107,2,3,4,'system',NOW(),1),
(89,1,108,3,5,1,'system',NOW(),1),(90,1,109,3,5,2,'system',NOW(),1),

(91,2,110,1,1,1,'system',NOW(),1),(92,2,111,1,1,2,'system',NOW(),1),
(93,2,112,1,1,3,'system',NOW(),1),(94,2,113,1,1,4,'system',NOW(),1),
(95,2,114,2,3,1,'system',NOW(),1),(96,2,115,2,3,2,'system',NOW(),1);


------------------------------------------------------------------------

CREATE TABLE tbl_feedback (
  feedback_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status_ VARCHAR(20) NOT NULL DEFAULT 'New',
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by VARCHAR(100),
  reviewed_date DATETIME
);
