USE ems_dev;

-- Lookups -------------------------------------------------------------

INSERT INTO tbl_region_master (region_id, region_desc, created_by, created_date, status_) VALUES
  (1, 'Puducherry', 'system', NOW(), 1),
  (2, 'Karaikal', 'system', NOW(), 1),
  (3, 'Mahe', 'system', NOW(), 1),
  (4, 'Yanam', 'system', NOW(), 1);

INSERT INTO tbl_category_master (cat_id, cat_desc, created_by, created_date, status_) VALUES
  (1, 'Medical', 'system', NOW(), 1),
  (2, 'Allied Health', 'system', NOW(), 1),
  (3, 'Nursing', 'system', NOW(), 1),
  (4, 'Dental', 'system', NOW(), 1),
  (5, 'Opthomology', 'system', NOW(), 1),
  (6, 'Ayurveda', 'system', NOW(), 1),
  (7, 'Pharmacy', 'system', NOW(), 1);

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
  (1, 'First Semester', 7, 12, 'system', NOW(), 1),
  (2, 'Second Semester', 1, 5, 'system', NOW(), 1),
  (3, 'Third Semester', 7, 12, 'system', NOW(), 1),
  (4, 'Fourth Semester', 1, 5, 'system', NOW(), 1),
  (5, 'Fifth Semester', 7, 12, 'system', NOW(), 1),
  (6, 'Sixth Semester', 1, 5, 'system', NOW(), 1),
  (7, 'Seventh Semester', 7, 12, 'system', NOW(), 1),
  (8, 'Eighth Semester', 1, 5, 'system', NOW(), 1);

-- Institutions ----------------------------------------------------------
-- board is represented as bome_status / boen_status (1 = registered under that board)

INSERT INTO tbl_inst_master (inst_id, inst_name, bome_status, boen_status, region_id, cat_id, created_by, created_date, status_) VALUES
  (1, 'Mother Theresa Post Graduate & Research Institute of Health Sciences- Puducherry', 1, 1, 1, 1, 'system', NOW(), 1),
  (2, 'Mother Theresa Post Graduate & Research Institute of Health Sciences - Karaikal', 1, 1, 2, 1, 'system', NOW(), 1),
  (3, 'Mother Theresa Post Graduate & Research Institute of Health Sciences - Mahe', 1, 1, 3, 1, 'system', NOW(), 1),
  (4, 'Mother Theresa Post Graduate & Research Institute of Health Sciences - Yanam', 1, 1, 4, 1, 'system', NOW(), 1),
  (5, 'Vinayaka Missions College of Paramedical Sciences', 1, 0, 1, 2, 'system', NOW(), 1),
  (6, 'Pondicherry University Community College', 1, 0, 1, 1, 'system', NOW(), 1),
  (7, 'Sri Venkateswaraa College of Paramedical Sciences', 1, 0, 1, 2, 'system', NOW(), 1),
  (8, 'College of Nursing, East Coast Institute of Medical Sciences', 1, 0, 1, 3, 'system', NOW(), 1),
  (9, 'Immaculate Institute of Health Sciences', 1, 0, 1, 2, 'system', NOW(), 1),
  (10, 'Vinayaka Missions College of Nursing', 1, 0, 1, 3, 'system', NOW(), 1),
  (11, 'Aravind Eye Hospitals Post Graduate Institute of Ophthalmology', 1, 0, 1, 5, 'system', NOW(), 1),
  (12, 'A.G. Padmavathi College of Nursing', 1, 0, 1, 3, 'system', NOW(), 1),
  (13, 'Rajiv Gandhi Ayurveda Medical College', 1, 0, 1, 6, 'system', NOW(), 1),
  (14, 'Shri Venkateshwara College of Pharmacy', 1, 0, 1, 7, 'system', NOW(), 1),
  (15, 'Indirani School of Nursing', 1, 1, 1, 3, 'system', NOW(), 1),
  (16, 'RAAK School of Nursing', 1, 1, 1, 3, 'system', NOW(), 1),
  (17, 'Mahatma Gandhi Postgraduate Institute of Dental Sciences', 1, 0, 1, 4, 'system', NOW(), 1),
  (18, 'School of Allied Health Sciences, IGGGGH & PGI', 1, 0, 1, 2, 'system', NOW(), 1),
  (19, 'Annai Abirami Community College of Health Sciences', 1, 0, 1, 2, 'system', NOW(), 1),
  (20, 'Coast Institute of Allied Health Sciences, East College of Medical Sciences', 1, 0, 1, 2, 'system', NOW(), 1),
  (21, 'Christ College of Nursing', 1, 1, 1, 3, 'system', NOW(), 1);

-- Courses (global master, scoped to institutions via tbl_inst_course_map) ----

INSERT INTO tbl_course_master (course_id, course_desc, bome_status, boen_status, created_by, created_date, status_) VALUES
  (1, 'Diploma In General Nursing And Midwifery', 1, 1, 'system', NOW(), 1),
  (2, 'Certificate Course In Auxiliary-Nursing-Midwifery', 1, 1, 'system', NOW(), 1),
  (3, 'Diploma In Medical Lab. Technology', 1, 1, 'system', NOW(), 1),
  (4, 'Diploma In Certified Radiological Assistance (Revised)', 1, 1, 'system', NOW(), 1),
  (5, 'Diploma In Clinical Echo Cardiography', 1, 1, 'system', NOW(), 1),
  (6, 'Diploma In Dialysis Technology (Old)', 1, 1, 'system', NOW(), 1),
  (7, 'Diploma In Homoeopathy Pharmacy', 1, 1, 'system', NOW(), 1),
  (8, 'Diploma In Siddha Pharmacy', 1, 1, 'system', NOW(), 1),
  (9, 'Diploma In Ophthalmic Techniques', 1, 1, 'system', NOW(), 1),
  (10, 'Diploma In Optometry Certificate', 1, 1, 'system', NOW(), 1),
  (11, 'Diploma In Health Inspector', 1, 1, 'system', NOW(), 1),
  (12, 'Diploma For Ayurveda Panchakarma Therapist', 1, 1, 'system', NOW(), 1),
  (13, 'Diploma In Ayurveda Pharmacy', 1, 1, 'system', NOW(), 1),
  (14, 'Diploma In Pharmacy (Old)', 1, 1, 'system', NOW(), 1),
  (15, 'Diploma In Clinical Echo Cardiography (Revised)', 1, 1, 'system', NOW(), 1),
  (16, 'Diploma In Dialysis Technology', 1, 1, 'system', NOW(), 1),
  (17, 'Diploma In Multipurpose Health Worker (Female)', 1, 1, 'system', NOW(), 1),
  (18, 'Diploma In Dental Hygienist', 1, 1, 'system', NOW(), 1),
  (19, 'Diploma In Dental Mechanic', 1, 1, 'system', NOW(), 1),
  (20, 'Diploma In Medical Imaging Technology', 1, 1, 'system', NOW(), 1),
  (21, 'Diploma In Cardiac Care Technology', 1, 1, 'system', NOW(), 1),
  (22, 'Diploma In Operation Theatre Technology', 1, 1, 'system', NOW(), 1),
  (23, 'Diploma In Pharmacy', 1, 1, 'system', NOW(), 1),
  (24, 'Diploma In Anaesthesia Technology', 1, 1, 'system', NOW(), 1),
  (25, 'Diploma In Emergency Care Technology', 1, 1, 'system', NOW(), 1),
  (26, 'Diploma In Sanitary Inspector', 1, 1, 'system', NOW(), 1);

INSERT INTO tbl_inst_course_map (inst_course_id, inst_id, course_id, created_by, created_date, status_) VALUES
  (1, 1, 1, 'system', NOW(), 1),
  (2, 1, 2, 'system', NOW(), 1),
  (3, 2, 3, 'system', NOW(), 1),
  (4, 3, 4, 'system', NOW(), 1);

-- Subjects (global master, scoped to courses via tbl_course_subject_map) -----
-- (Truncated set wired into tbl_course_subject_map below - the full 93-subject
-- master list lives in backend/scripts/load_real_seed_data.py; run that script
-- against a fresh DB for the complete subject list.)

INSERT INTO tbl_subject_master (subject_id, subject_desc, bome_status, boen_status, created_by, created_date, status_) VALUES
  (1, 'ANATOMY & PHYSIOLOGY', 1, 1, 'system', NOW(), 1),
  (2, 'COMMUNITY HEALTH', 1, 1, 'system', NOW(), 1),
  (3, 'PATHOLOGY', 1, 1, 'system', NOW(), 1),
  (4, 'MICROBIOLOGY', 1, 1, 'system', NOW(), 1);

INSERT INTO tbl_course_subject_map (course_subject_id, course_id, subject_id, year_id, sem_id, priority_id, created_by, created_date, status_) VALUES
  (1, 1, 1, 1, 1, 1, 'system', NOW(), 1),
  (2, 1, 2, 1, 1, 2, 'system', NOW(), 1),
  (3, 2, 3, 1, 2, 1, 'system', NOW(), 1),
  (4, 4, 4, 1, 1, 1, 'system', NOW(), 1);
