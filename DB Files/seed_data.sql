USE ems_dev;

-- Lookups -------------------------------------------------------------

INSERT INTO tbl_region_master (region_id, region_desc, created_by, created_date, status_) VALUES
  (1, 'Puducherry', 'system', NOW(), 1),
  (2, 'Karaikal', 'system', NOW(), 1),
  (3, 'Mahe', 'system', NOW(), 1),
  (4, 'Yanam', 'system', NOW(), 1);

INSERT INTO tbl_year_id (year_id, year_desc, created_by, created_date, status_) VALUES
  (1, 'Year 1', 'system', NOW(), 1),
  (2, 'Year 2', 'system', NOW(), 1),
  (3, 'Year 3', 'system', NOW(), 1),
  (4, 'Year 4', 'system', NOW(), 1);

INSERT INTO tbl_month_master (month_id, month_desc, created_by, created_date, status_) VALUES
  (1, 'January', 'system', NOW(), 1),
  (2, 'February', 'system', NOW(), 1),
  (3, 'March', 'system', NOW(), 1),
  (4, 'April', 'system', NOW(), 1),
  (5, 'May', 'system', NOW(), 1),
  (6, 'June', 'system', NOW(), 1),
  (7, 'July', 'system', NOW(), 1),
  (8, 'August', 'system', NOW(), 1),
  (9, 'September', 'system', NOW(), 1),
  (10, 'October', 'system', NOW(), 1),
  (11, 'November', 'system', NOW(), 1),
  (12, 'December', 'system', NOW(), 1);

INSERT INTO tbl_exam_sem_master (sem_id, sem_desc, start_month, end_month, created_by, created_date, status_) VALUES
  (1, 'Semester 1', 6, 11, 'system', NOW(), 1),
  (2, 'Semester 2', 12, 5, 'system', NOW(), 1);

-- Institutions ----------------------------------------------------------
-- board is represented as bome_status / boen_status (1 = registered under that board)

INSERT INTO tbl_inst_master (inst_id, inst_name, bome_status, boen_status, region_id, created_by, created_date, status_) VALUES
  (1, 'Mother Theresa Institute', 1, 0, 1, 'system', NOW(), 1),
  (2, 'Medical Training College', 1, 0, 2, 'system', NOW(), 1),
  (3, 'Nursing College', 0, 1, 1, 'system', NOW(), 1),
  (4, 'Nursing Sciences Institute', 0, 1, 3, 'system', NOW(), 0);

-- Courses (global master, scoped to institutions via tbl_inst_course_map) ----

INSERT INTO tbl_course_master (course_id, course_desc, bome_status, boen_status, created_by, created_date, status_) VALUES
  (1, 'Diploma in General Nursing', 1, 0, 'system', NOW(), 1),
  (2, 'Diploma in Medical Lab Technology', 1, 0, 'system', NOW(), 1),
  (3, 'Diploma in Radiography', 1, 0, 'system', NOW(), 1),
  (4, 'Diploma in Nursing Assistant', 0, 1, 'system', NOW(), 1);

INSERT INTO tbl_inst_course_map (inst_course_id, inst_id, course_id, created_by, created_date, status_) VALUES
  (1, 1, 1, 'system', NOW(), 1),
  (2, 1, 2, 'system', NOW(), 1),
  (3, 2, 3, 'system', NOW(), 1),
  (4, 3, 4, 'system', NOW(), 1);

-- Subjects (global master, scoped to courses via tbl_course_subject_map) -----

INSERT INTO tbl_subject_master (subject_id, subject_desc, bome_status, boen_status, created_by, created_date, status_) VALUES
  (1, 'Anatomy', 1, 0, 'system', NOW(), 1),
  (2, 'Physiology', 1, 0, 'system', NOW(), 1),
  (3, 'Pathology', 1, 0, 'system', NOW(), 1),
  (4, 'Fundamentals of Nursing', 0, 1, 'system', NOW(), 1);

INSERT INTO tbl_course_subject_map (course_subject_id, course_id, subject_id, year_id, sem_id, priority_id, created_by, created_date, status_) VALUES
  (1, 1, 1, 1, 1, 1, 'system', NOW(), 1),
  (2, 1, 2, 1, 1, 2, 'system', NOW(), 1),
  (3, 2, 3, 1, 2, 1, 'system', NOW(), 1),
  (4, 4, 4, 1, 1, 1, 'system', NOW(), 1);
