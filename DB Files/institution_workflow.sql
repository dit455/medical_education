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
