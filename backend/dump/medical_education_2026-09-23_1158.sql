-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: medical_education
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tbl_attendance`
--

DROP TABLE IF EXISTS `tbl_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_attendance` (
  `attendance_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `subject_id` int DEFAULT NULL,
  `exam_type` varchar(50) DEFAULT NULL,
  `attendance` int DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` varchar(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`attendance_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `tbl_attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `tbl_student_master` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_attendance`
--

LOCK TABLES `tbl_attendance` WRITE;
/*!40000 ALTER TABLE `tbl_attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_category_master`
--

DROP TABLE IF EXISTS `tbl_category_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_category_master` (
  `cat_id` int NOT NULL,
  `cat_desc` varchar(100) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`cat_id`),
  CONSTRAINT `tbl_category_master_chk_1` CHECK ((`cat_id` between 0 and 99999))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_category_master`
--

LOCK TABLES `tbl_category_master` WRITE;
/*!40000 ALTER TABLE `tbl_category_master` DISABLE KEYS */;
INSERT INTO `tbl_category_master` VALUES (1,'Medical','system','2026-06-18 00:36:01',NULL,NULL,1),(2,'Allied Health','system','2026-06-18 00:36:01',NULL,NULL,1),(3,'Nursing','system','2026-06-18 00:36:01',NULL,NULL,1),(4,'Dental','system','2026-06-18 00:36:01',NULL,NULL,1),(5,'Opthomology','system','2026-06-18 00:36:01',NULL,NULL,1),(6,'Ayurveda','system','2026-06-18 00:36:01',NULL,NULL,1),(7,'Pharmacy','system','2026-06-18 00:36:01',NULL,NULL,1);
/*!40000 ALTER TABLE `tbl_category_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_course_master`
--

DROP TABLE IF EXISTS `tbl_course_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_course_master` (
  `course_id` int NOT NULL,
  `course_desc` varchar(200) DEFAULT NULL,
  `course_abbr` varchar(30) DEFAULT NULL,
  `bome_status` int DEFAULT NULL,
  `boen_status` int DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`course_id`),
  CONSTRAINT `tbl_course_master_chk_1` CHECK ((`course_id` between 0 and 99999)),
  CONSTRAINT `tbl_course_master_chk_2` CHECK ((`bome_status` between 0 and 9)),
  CONSTRAINT `tbl_course_master_chk_3` CHECK ((`boen_status` between 0 and 9))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_course_master`
--

LOCK TABLES `tbl_course_master` WRITE;
/*!40000 ALTER TABLE `tbl_course_master` DISABLE KEYS */;
INSERT INTO `tbl_course_master` VALUES (1,'Diploma In General Nursing And Midwifery','DGNM',1,1,'system','2026-06-18 00:36:10','admin','2026-09-08 14:15:37',1),(2,'Certificate Course In Auxiliary-Nursing-Midwifery','ANM',1,1,'system','2026-06-18 00:36:10','admin','2026-08-27 16:59:33',1),(4,'Diploma In Certified Radiological Assistance (Revised)','DCRA',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(5,'Diploma In Clinical Echo Cardiography','DCEC',1,1,'system','2026-06-18 00:36:10','admin','2026-09-15 10:48:04',1),(6,'Diploma In Dialysis Technology (Old)','DDT-OLD',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(7,'Diploma In Homoeopathy Pharmacy','DHP',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(8,'Diploma In Siddha Pharmacy','DSP',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(9,'Diploma In Ophthalmic Techniques','DOT',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(10,'Diploma In Optometry Certificate','DO',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(11,'Diploma In Health Inspector','DHI',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(12,'Diploma For Ayurveda Panchakarma Therapist','DAPT',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(13,'Diploma In Ayurveda Pharmacy','DAP',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(14,'Diploma In Pharmacy (Old)','DPHARM-OLD',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(15,'Diploma In Clinical Echo Cardiography (Revised)','DCEC-REV',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(16,'Diploma In Dialysis Technology','DDT',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(17,'Diploma In Multipurpose Health Worker (Female)','DMHW-F',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(18,'Diploma In Dental Hygienist','DDH',1,1,'system','2026-06-18 00:36:10','admin','2026-09-03 15:08:28',0),(19,'Diploma In Dental Mechanic','DDM',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(20,'Diploma In Medical Imaging Technology','DMIT',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(21,'DIPLOMA IN CARDIAC CARE TECHNOLOGY','DCCT',1,1,'system','2026-06-18 00:36:10','admin','2026-09-03 10:38:13',1),(22,'DIPLOMA IN OPERATION THEATRE TECHNOLOGY','DOTT',1,1,'system','2026-06-18 00:36:10','admin','2026-09-03 14:02:42',1),(23,'Diploma In Pharmacy','D.PHARM',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(24,'Diploma In Anaesthesia Technology','DAT',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(25,'Diploma In Emergency Care Technology','DECT',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(26,'Diploma In Sanitary Inspector','DSI',1,1,'system','2026-06-18 00:36:10',NULL,NULL,1),(27,'Diploma In Uro Technology','DUT',1,0,'system','2026-09-04 11:13:35',NULL,NULL,1),(28,'Diploma In ECG Technician','DECG',1,0,'system','2026-09-04 11:13:35',NULL,NULL,1),(29,'MATHS','',0,0,'system','2026-09-22 15:29:55',NULL,NULL,1),(30,'CHEMISTRY','CH',0,0,'system','2026-09-23 10:28:20',NULL,NULL,1),(31,'CHIMISTRY','CH',0,0,'system','2026-09-23 10:28:36',NULL,NULL,1),(32,'CHEMISTRE','CE',0,0,'system','2026-09-23 10:33:49',NULL,NULL,0),(33,'FVBHB4457@','@!',0,0,'system','2026-09-23 10:36:42',NULL,NULL,1);
/*!40000 ALTER TABLE `tbl_course_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_course_subject_map`
--

DROP TABLE IF EXISTS `tbl_course_subject_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_course_subject_map` (
  `course_subject_id` int NOT NULL,
  `course_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `year_id` int NOT NULL,
  `sem_id` int NOT NULL,
  `priority_id` int NOT NULL,
  `created_by` varchar(50) DEFAULT 'admin',
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`course_subject_id`),
  UNIQUE KEY `uq_course_subject_map` (`course_id`,`subject_id`,`year_id`,`sem_id`),
  KEY `fk_course_subject_map_subject` (`subject_id`),
  KEY `fk_course_subject_map_year` (`year_id`),
  KEY `fk_course_subject_map_sem` (`sem_id`),
  CONSTRAINT `fk_course_subject_map_course` FOREIGN KEY (`course_id`) REFERENCES `tbl_course_master` (`course_id`),
  CONSTRAINT `fk_course_subject_map_sem` FOREIGN KEY (`sem_id`) REFERENCES `tbl_exam_sem_master` (`sem_id`),
  CONSTRAINT `fk_course_subject_map_subject` FOREIGN KEY (`subject_id`) REFERENCES `tbl_subject_master` (`subject_id`),
  CONSTRAINT `fk_course_subject_map_year` FOREIGN KEY (`year_id`) REFERENCES `tbl_year_master` (`year_id`),
  CONSTRAINT `tbl_course_subject_map_chk_1` CHECK ((`course_subject_id` between 0 and 9999999999))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_course_subject_map`
--

LOCK TABLES `tbl_course_subject_map` WRITE;
/*!40000 ALTER TABLE `tbl_course_subject_map` DISABLE KEYS */;
INSERT INTO `tbl_course_subject_map` VALUES (1,20,28,1,1,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(2,20,29,1,1,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(3,20,30,1,1,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(4,20,56,1,1,4,'system','2026-09-04 11:40:58',NULL,NULL,1),(5,20,55,2,3,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(6,20,57,2,3,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(7,20,59,2,3,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(8,20,58,2,3,4,'system','2026-09-04 11:40:58',NULL,NULL,1),(9,21,28,1,1,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(10,21,29,1,1,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(11,21,30,1,1,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(12,21,61,2,3,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(13,21,62,2,3,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(14,16,28,1,1,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(15,16,29,1,1,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(16,16,30,1,1,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(17,16,31,2,3,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(18,16,32,2,3,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(19,22,28,1,1,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(20,22,29,1,1,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(21,22,30,1,1,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(22,22,64,1,1,4,'system','2026-09-04 11:40:58',NULL,NULL,1),(23,22,65,2,3,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(24,22,66,2,3,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(25,22,67,2,3,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(26,24,28,1,1,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(27,24,29,1,1,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(28,24,30,1,1,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(29,24,90,1,1,4,'system','2026-09-04 11:40:58',NULL,NULL,1),(30,24,92,2,3,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(31,24,91,2,3,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(32,24,67,2,3,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(33,18,40,2,3,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(34,18,41,2,3,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(35,18,42,2,3,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(36,19,46,1,1,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(37,19,47,1,1,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(38,19,48,1,1,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(39,19,51,2,3,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(40,19,52,2,3,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(41,19,53,2,3,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(42,26,116,2,3,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(43,26,117,2,3,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(44,26,118,2,3,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(50,10,14,1,1,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(51,10,15,1,1,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(52,10,16,2,3,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(53,10,17,2,3,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(54,9,10,1,1,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(55,9,11,1,1,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(56,9,13,2,3,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(57,9,12,2,3,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(58,23,69,1,1,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(59,23,70,1,1,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(60,23,71,1,1,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(61,23,72,1,1,4,'system','2026-09-04 11:40:58',NULL,NULL,1),(62,23,73,1,1,5,'system','2026-09-04 11:40:58',NULL,NULL,1),(63,23,79,2,3,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(64,23,80,2,3,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(65,23,81,2,3,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(66,23,82,2,3,4,'system','2026-09-04 11:40:58',NULL,NULL,1),(67,23,83,2,3,5,'system','2026-09-04 11:40:58',NULL,NULL,1),(68,23,84,2,3,6,'system','2026-09-04 11:40:58',NULL,NULL,1),(69,12,18,1,1,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(70,12,19,1,1,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(71,12,20,1,1,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(72,12,21,1,1,4,'system','2026-09-04 11:40:58',NULL,NULL,1),(73,27,28,1,1,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(74,27,29,1,1,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(75,27,30,1,1,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(76,27,56,1,1,4,'system','2026-09-04 11:40:58',NULL,NULL,1),(77,28,28,1,1,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(78,28,29,1,1,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(79,28,30,1,1,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(80,28,119,1,1,4,'system','2026-09-04 11:40:58',NULL,NULL,1),(81,1,100,1,1,1,'system','2026-09-04 11:40:58','admin','2026-09-08 13:34:28',1),(82,1,101,1,1,2,'system','2026-09-04 11:40:58','admin','2026-09-08 13:34:29',1),(83,1,102,1,1,3,'system','2026-09-04 11:40:58','admin','2026-09-08 13:34:30',1),(84,1,103,1,1,4,'system','2026-09-04 11:40:58','admin','2026-09-15 10:52:48',1),(85,1,104,2,3,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(86,1,105,2,3,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(87,1,106,2,3,3,'system','2026-09-04 11:40:58',NULL,NULL,1),(88,1,107,2,3,4,'system','2026-09-04 11:40:58',NULL,NULL,1),(89,1,108,3,5,1,'system','2026-09-04 11:40:58',NULL,NULL,1),(90,1,109,3,5,2,'system','2026-09-04 11:40:58',NULL,NULL,1),(91,1,1,1,1,1,'admin','2026-09-08 09:56:04','admin','2026-09-08 14:40:42',1),(92,1,19,1,1,12,'admin','2026-09-15 11:29:06',NULL,NULL,1),(93,2,1,1,1,1,'admin','2026-09-16 14:29:45',NULL,NULL,1),(94,2,2,1,1,2,'admin','2026-09-16 14:29:45',NULL,NULL,1),(95,2,3,1,1,3,'admin','2026-09-16 14:29:45',NULL,NULL,1);
/*!40000 ALTER TABLE `tbl_course_subject_map` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_email_otp`
--

DROP TABLE IF EXISTS `tbl_email_otp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_email_otp` (
  `email` varchar(255) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `attempts` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_email_otp`
--

LOCK TABLES `tbl_email_otp` WRITE;
/*!40000 ALTER TABLE `tbl_email_otp` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_email_otp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_exam_category_master`
--

DROP TABLE IF EXISTS `tbl_exam_category_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_exam_category_master` (
  `exam_cat_id` int NOT NULL,
  `exam_cat_desc` varchar(100) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`exam_cat_id`),
  CONSTRAINT `tbl_exam_category_master_chk_1` CHECK ((`exam_cat_id` between 0 and 99))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_exam_category_master`
--

LOCK TABLES `tbl_exam_category_master` WRITE;
/*!40000 ALTER TABLE `tbl_exam_category_master` DISABLE KEYS */;
INSERT INTO `tbl_exam_category_master` VALUES (1,'Main Exam (M)','system','2026-08-12 16:41:46',NULL,NULL,1),(2,'Arrear Exam (A)','system','2026-08-12 16:41:46',NULL,NULL,1);
/*!40000 ALTER TABLE `tbl_exam_category_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_exam_schedule`
--

DROP TABLE IF EXISTS `tbl_exam_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_exam_schedule` (
  `exam_sch_id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `year_id` int NOT NULL,
  `sem_id` int NOT NULL,
  `exam_date` date DEFAULT NULL,
  `exam_session_id` int DEFAULT NULL,
  `exam_cat_id` int DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `status_` varchar(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`exam_sch_id`),
  KEY `course_id` (`course_id`),
  KEY `subject_id` (`subject_id`),
  KEY `year_id` (`year_id`),
  KEY `sem_id` (`sem_id`),
  CONSTRAINT `tbl_exam_schedule_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `tbl_course_master` (`course_id`),
  CONSTRAINT `tbl_exam_schedule_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `tbl_subject_master` (`subject_id`),
  CONSTRAINT `tbl_exam_schedule_ibfk_3` FOREIGN KEY (`year_id`) REFERENCES `tbl_year_master` (`year_id`),
  CONSTRAINT `tbl_exam_schedule_ibfk_4` FOREIGN KEY (`sem_id`) REFERENCES `tbl_exam_sem_master` (`sem_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_exam_schedule`
--

LOCK TABLES `tbl_exam_schedule` WRITE;
/*!40000 ALTER TABLE `tbl_exam_schedule` DISABLE KEYS */;
INSERT INTO `tbl_exam_schedule` VALUES (1,1,52,1,1,'2026-08-12',1,1,'Approver_C26','2026-08-14 15:21:04','Active'),(2,1,52,1,1,'2026-08-06',1,1,'Approver_C26','2026-08-14 16:16:34','Active'),(3,1,53,1,1,'2026-08-06',1,1,'Approver_SMT27','2026-08-14 16:28:42','Active'),(4,1,52,1,1,'2026-08-17',1,1,'Approver_SMC28','2026-08-18 12:33:21','Active'),(5,2,50,1,1,'2026-08-18',1,1,'Approver_SMC28','2026-08-18 12:39:06','Active'),(7,2,50,1,1,'2026-08-25',1,1,'Approver_T24','2026-08-25 10:51:58','Active'),(8,2,50,1,1,'2026-08-12',1,1,'Approver_T24','2026-08-25 10:53:12','Active'),(9,2,68,1,1,'2026-08-05',1,1,'Approver_T24','2026-08-27 17:03:25','Active'),(10,1,69,1,1,'2026-08-01',1,1,'Approver_S31','2026-08-31 13:36:41','Active'),(11,1,69,1,2,'2026-09-02',1,1,'Approver_S31','2026-09-01 10:09:56','Active'),(12,1,69,1,1,'2026-01-01',NULL,1,'Approver_S31','2026-09-02 16:31:13','Active'),(13,1,90,2,1,'2026-01-01',1,2,'Approver_S31','2026-09-09 10:48:33','Active'),(14,1,91,2,1,'2026-01-01',NULL,1,'Approver_S31','2026-09-09 10:48:58','Active');
/*!40000 ALTER TABLE `tbl_exam_schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_exam_sem_master`
--

DROP TABLE IF EXISTS `tbl_exam_sem_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_exam_sem_master` (
  `sem_id` int NOT NULL,
  `sem_desc` varchar(200) DEFAULT NULL,
  `start_month` int DEFAULT NULL,
  `end_month` int DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`sem_id`),
  KEY `fk_exam_sem_start_month` (`start_month`),
  KEY `fk_exam_sem_end_month` (`end_month`),
  CONSTRAINT `fk_exam_sem_end_month` FOREIGN KEY (`end_month`) REFERENCES `tbl_month_master` (`month_id`),
  CONSTRAINT `fk_exam_sem_start_month` FOREIGN KEY (`start_month`) REFERENCES `tbl_month_master` (`month_id`),
  CONSTRAINT `tbl_exam_sem_master_chk_1` CHECK ((`sem_id` between 0 and 99))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_exam_sem_master`
--

LOCK TABLES `tbl_exam_sem_master` WRITE;
/*!40000 ALTER TABLE `tbl_exam_sem_master` DISABLE KEYS */;
INSERT INTO `tbl_exam_sem_master` VALUES (1,'First Semester',7,12,'system','2026-06-18 00:35:57',NULL,NULL,1),(2,'Second Semester',1,5,'system','2026-06-18 00:35:57',NULL,NULL,1),(3,'Third Semester',7,12,'system','2026-06-18 00:35:57',NULL,NULL,1),(4,'Fourth Semester',1,5,'system','2026-06-18 00:35:57',NULL,NULL,1),(5,'Fifth Semester',7,12,'system','2026-06-18 00:35:57',NULL,NULL,0),(6,'Sixth Semester',1,5,'system','2026-06-18 00:35:57',NULL,NULL,0),(7,'Seventh Semester',7,12,'system','2026-06-18 00:35:57',NULL,NULL,0),(8,'Eighth Semester',1,5,'system','2026-06-18 00:35:57',NULL,NULL,0);
/*!40000 ALTER TABLE `tbl_exam_sem_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_exam_session_master`
--

DROP TABLE IF EXISTS `tbl_exam_session_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_exam_session_master` (
  `exam_session_id` int NOT NULL,
  `exam_session_desc` varchar(100) DEFAULT NULL,
  `exam_session_abr` varchar(10) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`exam_session_id`),
  CONSTRAINT `tbl_exam_session_master_chk_1` CHECK ((`exam_session_id` between 0 and 99))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_exam_session_master`
--

LOCK TABLES `tbl_exam_session_master` WRITE;
/*!40000 ALTER TABLE `tbl_exam_session_master` DISABLE KEYS */;
INSERT INTO `tbl_exam_session_master` VALUES (1,'Forenoon','FN','system','2026-08-12 16:41:46',NULL,NULL,1),(2,'Afternoon','AN','system','2026-08-12 16:41:46',NULL,NULL,1);
/*!40000 ALTER TABLE `tbl_exam_session_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_exam_type_master`
--

DROP TABLE IF EXISTS `tbl_exam_type_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_exam_type_master` (
  `exam_type_id` int NOT NULL,
  `exam_type_desc` varchar(100) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`exam_type_id`),
  CONSTRAINT `tbl_exam_type_master_chk_1` CHECK ((`exam_type_id` between 0 and 99))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_exam_type_master`
--

LOCK TABLES `tbl_exam_type_master` WRITE;
/*!40000 ALTER TABLE `tbl_exam_type_master` DISABLE KEYS */;
INSERT INTO `tbl_exam_type_master` VALUES (1,'Internal Assessment (IA)','system','2026-08-08 10:56:31',NULL,NULL,1),(2,'External Assessment (EA)','system','2026-08-08 10:56:31',NULL,NULL,1),(3,'Theory / Practical (TH)','system','2026-08-08 10:56:31',NULL,NULL,1);
/*!40000 ALTER TABLE `tbl_exam_type_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_inst_course_map`
--

DROP TABLE IF EXISTS `tbl_inst_course_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_inst_course_map` (
  `inst_course_id` int NOT NULL,
  `inst_id` int NOT NULL,
  `course_id` int NOT NULL,
  `duration` int DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`inst_course_id`),
  UNIQUE KEY `uq_inst_course_map` (`inst_id`,`course_id`),
  KEY `fk_inst_course_map_course` (`course_id`),
  CONSTRAINT `fk_inst_course_map_course` FOREIGN KEY (`course_id`) REFERENCES `tbl_course_master` (`course_id`),
  CONSTRAINT `fk_inst_course_map_inst` FOREIGN KEY (`inst_id`) REFERENCES `tbl_inst_master` (`inst_id`),
  CONSTRAINT `tbl_inst_course_map_chk_1` CHECK ((`inst_course_id` between 0 and 9999999999))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_inst_course_map`
--

LOCK TABLES `tbl_inst_course_map` WRITE;
/*!40000 ALTER TABLE `tbl_inst_course_map` DISABLE KEYS */;
INSERT INTO `tbl_inst_course_map` VALUES (1,1,1,3,'system','2026-09-04 11:38:09',NULL,NULL,1),(2,1,2,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(4,3,4,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(5,18,21,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(6,18,20,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(7,18,16,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(8,18,22,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(17,1,20,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(18,1,16,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(19,11,10,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(20,11,9,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(21,14,23,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(22,7,16,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(23,7,21,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(24,7,20,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(25,22,21,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(26,22,16,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(28,13,12,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(29,17,19,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(30,17,18,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(31,5,1,3,'system','2026-09-04 11:38:09',NULL,NULL,1),(32,10,1,3,'system','2026-09-04 11:38:09',NULL,NULL,1),(34,4,1,3,'system','2026-09-04 11:38:09',NULL,NULL,1),(35,15,1,3,'system','2026-09-04 11:38:09',NULL,NULL,1),(36,8,1,3,'system','2026-09-04 11:38:09',NULL,NULL,1),(37,9,1,3,'system','2026-09-04 11:38:09',NULL,NULL,1),(39,4,2,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(41,15,2,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(42,8,2,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(43,5,2,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(44,16,2,2,'system','2026-09-04 11:38:09',NULL,NULL,1),(53,33,1,2,'admin','2026-09-07 12:03:48',NULL,NULL,1),(54,33,2,2,'admin','2026-09-07 12:03:48',NULL,NULL,1),(55,13,1,2,'admin','2026-09-08 09:49:39',NULL,NULL,1),(57,19,1,2,'admin','2026-09-08 09:54:37',NULL,NULL,1),(58,15,5,3,'admin','2026-09-15 10:47:39',NULL,NULL,1),(59,34,1,3,'admin','2026-09-23 11:19:19',NULL,NULL,1),(60,34,2,3,'admin','2026-09-23 11:19:19',NULL,NULL,1),(61,34,4,3,'admin','2026-09-23 11:19:19',NULL,NULL,1),(62,19,2,4,'admin','2026-09-23 11:27:36',NULL,NULL,1),(63,19,4,4,'admin','2026-09-23 11:27:36',NULL,NULL,1),(64,19,5,4,'admin','2026-09-23 11:27:36',NULL,NULL,1),(65,19,6,4,'admin','2026-09-23 11:27:36',NULL,NULL,1),(66,19,7,4,'admin','2026-09-23 11:27:36',NULL,NULL,1),(67,19,8,4,'admin','2026-09-23 11:27:37',NULL,NULL,1);
/*!40000 ALTER TABLE `tbl_inst_course_map` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_inst_master`
--

DROP TABLE IF EXISTS `tbl_inst_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_inst_master` (
  `inst_id` int NOT NULL,
  `inst_name` varchar(200) DEFAULT NULL,
  `inst_abbr` varchar(30) DEFAULT NULL,
  `inst_email` varchar(255) DEFAULT NULL,
  `bome_status` int DEFAULT NULL,
  `boen_status` int DEFAULT NULL,
  `region_id` int DEFAULT NULL,
  `cat_id` int DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`inst_id`),
  KEY `fk_inst_region` (`region_id`),
  KEY `fk_inst_category` (`cat_id`),
  CONSTRAINT `fk_inst_category` FOREIGN KEY (`cat_id`) REFERENCES `tbl_category_master` (`cat_id`),
  CONSTRAINT `fk_inst_region` FOREIGN KEY (`region_id`) REFERENCES `tbl_region_master` (`region_id`),
  CONSTRAINT `tbl_inst_master_chk_1` CHECK ((`inst_id` between 0 and 99999)),
  CONSTRAINT `tbl_inst_master_chk_2` CHECK ((`bome_status` between 0 and 9)),
  CONSTRAINT `tbl_inst_master_chk_3` CHECK ((`boen_status` between 0 and 9))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_inst_master`
--

LOCK TABLES `tbl_inst_master` WRITE;
/*!40000 ALTER TABLE `tbl_inst_master` DISABLE KEYS */;
INSERT INTO `tbl_inst_master` VALUES (1,'Mother Theresa Post Graduate & Research Institute of Health Sciences- Puducherry','MTP',NULL,1,1,1,1,'system','2026-06-18 00:36:05',NULL,NULL,1),(2,'Mother Theresa Post Graduate & Research Institute of Health Sciences - Karaikal','MTK',NULL,1,1,2,1,'system','2026-06-18 00:36:05',NULL,NULL,1),(3,'Mother Theresa Post Graduate & Research Institute of Health Sciences - Mahe','MTM',NULL,1,1,3,1,'system','2026-06-18 00:36:05',NULL,NULL,1),(4,'Mother Theresa Post Graduate & Research Institute of Health Sciences - Yanam','MTY',NULL,1,1,4,1,'system','2026-06-18 00:36:05',NULL,NULL,1),(5,'Vinayaka Missions College of Paramedical Sciences','VMP',NULL,1,0,1,2,'system','2026-06-18 00:36:05',NULL,NULL,1),(6,'Pondicherry University Community College','PUCC',NULL,1,0,1,1,'system','2026-06-18 00:36:05',NULL,NULL,1),(7,'Sri Venkateswaraa College of Paramedical Sciences','SVCPS',NULL,1,0,1,2,'system','2026-06-18 00:36:05',NULL,NULL,1),(8,'College of Nursing, East Coast Institute of Medical Sciences',NULL,NULL,1,0,1,3,'system','2026-06-18 00:36:05','admin','2026-09-08 11:03:30',1),(9,'Immaculate Institute of Health Sciences','IIHS',NULL,1,0,1,2,'system','2026-06-18 00:36:05',NULL,NULL,1),(10,'Vinayaka Missions College of Nursing','VMK',NULL,1,0,1,3,'system','2026-06-18 00:36:05','admin','2026-08-27 15:16:52',1),(11,'Aravind Eye Hospitals Post Graduate Institute of Ophthalmology',NULL,NULL,1,0,1,5,'system','2026-06-18 00:36:05','admin','2026-09-08 15:09:57',1),(13,'Rajiv Gandhi Ayurveda Medical College','RGAMC',NULL,1,0,1,6,'system','2026-06-18 00:36:05',NULL,NULL,1),(14,'Shri Venkateshwara College of Pharmacy',NULL,NULL,1,0,1,7,'system','2026-06-18 00:36:05','admin','2026-09-22 12:27:49',1),(15,'Indirani School of Nursing','ICON',NULL,1,1,1,3,'system','2026-06-18 00:36:05',NULL,NULL,1),(16,'RAAK School of Nursing','RAAK',NULL,1,1,1,3,'system','2026-06-18 00:36:05',NULL,NULL,1),(17,'Mahatma Gandhi Postgraduate Institute of Dental Sciences','MGDC',NULL,1,0,1,4,'system','2026-06-18 00:36:05',NULL,NULL,1),(18,'School of Allied Health Sciences, IGGGGH & PGI','SAHS',NULL,1,0,1,2,'system','2026-06-18 00:36:05',NULL,NULL,1),(19,'Annai Abirami Community College of Health Sciences',NULL,NULL,1,0,2,2,'system','2026-09-04 11:32:55','admin','2026-09-23 11:17:11',1),(20,'Coast Institute of Allied Health Sciences, East College of Medical Sciences','CIAHS',NULL,1,0,1,2,'system','2026-06-18 00:36:05',NULL,NULL,1),(22,'East Coast Institute of Paramedical Sciences, Puducherry','ECIPS',NULL,1,0,1,2,'system','2026-09-04 11:02:02',NULL,NULL,1),(33,'CHRIST COLLEGE NURSING',NULL,'sriramsakthivel2512@gmail.com',1,0,1,1,'admin','2026-09-02 11:23:44','admin','2026-09-08 11:03:25',1),(34,'SAVI','GS','savikingart@gmail.com',1,0,2,3,'admin','2026-09-23 11:18:55',NULL,NULL,1);
/*!40000 ALTER TABLE `tbl_inst_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_marks_category_master`
--

DROP TABLE IF EXISTS `tbl_marks_category_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_marks_category_master` (
  `marks_cat_id` int NOT NULL,
  `marks_cat_desc` varchar(100) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`marks_cat_id`),
  CONSTRAINT `tbl_marks_category_master_chk_1` CHECK ((`marks_cat_id` between 0 and 99))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_marks_category_master`
--

LOCK TABLES `tbl_marks_category_master` WRITE;
/*!40000 ALTER TABLE `tbl_marks_category_master` DISABLE KEYS */;
INSERT INTO `tbl_marks_category_master` VALUES (1,'Distinction','system','2026-08-08 10:56:38',NULL,NULL,1),(2,'First Division','system','2026-08-08 10:56:38',NULL,NULL,1),(3,'Second Division','system','2026-08-08 10:56:38',NULL,NULL,1),(4,'Third Division','system','2026-08-08 10:56:38',NULL,NULL,1),(5,'Pass','system','2026-08-08 10:56:38',NULL,NULL,1),(6,'Fail','system','2026-08-08 10:56:38',NULL,NULL,1);
/*!40000 ALTER TABLE `tbl_marks_category_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_month_master`
--

DROP TABLE IF EXISTS `tbl_month_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_month_master` (
  `month_id` int NOT NULL,
  `month_desc` varchar(100) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`month_id`),
  CONSTRAINT `tbl_month_master_chk_1` CHECK ((`month_id` between 0 and 99))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_month_master`
--

LOCK TABLES `tbl_month_master` WRITE;
/*!40000 ALTER TABLE `tbl_month_master` DISABLE KEYS */;
INSERT INTO `tbl_month_master` VALUES (1,'January','system','2026-06-18 00:35:53',NULL,NULL,1),(2,'February','system','2026-06-18 00:35:53',NULL,NULL,1),(3,'March','system','2026-06-18 00:35:53',NULL,NULL,1),(4,'April','system','2026-06-18 00:35:53',NULL,NULL,1),(5,'May','system','2026-06-18 00:35:53',NULL,NULL,1),(6,'June','system','2026-06-18 00:35:53',NULL,NULL,1),(7,'July','system','2026-06-18 00:35:53',NULL,NULL,1),(8,'August','system','2026-06-18 00:35:53',NULL,NULL,1),(9,'September','system','2026-06-18 00:35:53',NULL,NULL,1),(10,'October','system','2026-06-18 00:35:53',NULL,NULL,1),(11,'November','system','2026-06-18 00:35:53',NULL,NULL,1),(12,'December','system','2026-06-18 00:35:53',NULL,NULL,1);
/*!40000 ALTER TABLE `tbl_month_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_pending_changes`
--

DROP TABLE IF EXISTS `tbl_pending_changes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_pending_changes` (
  `change_id` int NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(30) NOT NULL,
  `action` varchar(10) NOT NULL,
  `entity_id` int DEFAULT NULL,
  `institution_id` int NOT NULL,
  `payload_json` json DEFAULT NULL,
  `status_` varchar(20) NOT NULL DEFAULT 'Pending',
  `requested_by` varchar(50) DEFAULT NULL,
  `requested_date` datetime DEFAULT NULL,
  `reviewed_by` varchar(50) DEFAULT NULL,
  `reviewed_date` datetime DEFAULT NULL,
  `review_note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`change_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_pending_changes`
--

LOCK TABLES `tbl_pending_changes` WRITE;
/*!40000 ALTER TABLE `tbl_pending_changes` DISABLE KEYS */;
INSERT INTO `tbl_pending_changes` VALUES (1,'internal_marks','create',4,31,'{\"semId\": 1, \"result\": \"Pass\", \"yearId\": 2, \"courseId\": 1, \"examDate\": \"Jan -Feb 2026\", \"examCatId\": 1, \"passMarks\": 90, \"studentId\": 35, \"subjectId\": 91, \"totalMarks\": 100, \"scoredMarks\": 100, \"admissionYear\": \"2025-02-11\"}','Approved','Creator_S31','2026-09-08 12:39:40','Approver_S31','2026-09-09 10:48:58',NULL),(2,'internal_marks','create',3,31,'{\"semId\": 1, \"result\": \"Absent\", \"yearId\": 2, \"courseId\": 1, \"examDate\": \"jan-feb 2026\", \"isAbsent\": true, \"examCatId\": 2, \"passMarks\": null, \"studentId\": 35, \"subjectId\": 90, \"totalMarks\": null, \"scoredMarks\": null, \"admissionYear\": \"2025-02-11\", \"examSessionId\": 1}','Approved','Creator_S31','2026-09-09 10:44:58','Approver_S31','2026-09-09 10:48:33',NULL),(3,'internal_marks','create',NULL,31,'{\"semId\": 1, \"result\": \"Absent\", \"yearId\": 2, \"courseId\": 1, \"examDate\": \"Jan-Feb 2025\", \"isAbsent\": true, \"examCatId\": 2, \"passMarks\": null, \"studentId\": 35, \"subjectId\": 90, \"totalMarks\": null, \"scoredMarks\": null, \"admissionYear\": \"2025-02-11\", \"examSessionId\": 1}','Rejected','Creator_S31','2026-09-09 10:45:41','Approver_S31','2026-09-09 10:48:52','p[\''),(4,'internal_marks','create',NULL,31,'{\"semId\": 1, \"result\": \"Pass\", \"yearId\": 1, \"courseId\": 2, \"examDate\": \"Jan -Feb 2026\", \"examCatId\": 1, \"passMarks\": 40, \"studentId\": 40, \"subjectId\": 93, \"totalMarks\": 100, \"scoredMarks\": 67, \"admissionYear\": \"2026-09-15\"}','Pending','Creator_S31','2026-09-16 14:49:49',NULL,NULL,NULL);
/*!40000 ALTER TABLE `tbl_pending_changes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_region_master`
--

DROP TABLE IF EXISTS `tbl_region_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_region_master` (
  `region_id` int NOT NULL,
  `region_desc` varchar(200) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`region_id`),
  CONSTRAINT `tbl_region_master_chk_1` CHECK ((`region_id` between 0 and 99))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_region_master`
--

LOCK TABLES `tbl_region_master` WRITE;
/*!40000 ALTER TABLE `tbl_region_master` DISABLE KEYS */;
INSERT INTO `tbl_region_master` VALUES (1,'Puducherry','system','2026-06-18 00:35:46',NULL,NULL,1),(2,'Karaikal','system','2026-06-18 00:35:46',NULL,NULL,1),(3,'Mahe','system','2026-06-18 00:35:46',NULL,NULL,1),(4,'Yanam','system','2026-06-18 00:35:46',NULL,NULL,1);
/*!40000 ALTER TABLE `tbl_region_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_student_det`
--

DROP TABLE IF EXISTS `tbl_student_det`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_student_det` (
  `student_id` int NOT NULL AUTO_INCREMENT,
  `student_reg_no` varchar(50) DEFAULT NULL,
  `student_name` varchar(300) NOT NULL,
  `student_dob` date DEFAULT NULL,
  `admission_year` date DEFAULT NULL,
  `student_father_name` varchar(300) DEFAULT NULL,
  `student_address` varchar(300) DEFAULT NULL,
  `student_email` varchar(100) DEFAULT NULL,
  `student_mobile` varchar(20) DEFAULT NULL,
  `student_gender` varchar(10) DEFAULT NULL,
  `student_photo` varchar(255) DEFAULT NULL,
  `region_id` int DEFAULT NULL,
  `student_other_state` varchar(100) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `status_` varchar(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`student_id`),
  KEY `region_id` (`region_id`),
  CONSTRAINT `tbl_student_det_ibfk_1` FOREIGN KEY (`region_id`) REFERENCES `tbl_region_master` (`region_id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_student_det`
--

LOCK TABLES `tbl_student_det` WRITE;
/*!40000 ALTER TABLE `tbl_student_det` DISABLE KEYS */;
INSERT INTO `tbl_student_det` VALUES (35,'S0001','SAVIDSDD','2003-06-10','2025-02-11','RDSD','PUDUCHERRY, PONDICHERRY, PONDICHERRY - 605009','savi@gmail.com','7696986969','Female','student_photos/student_35_4ef01572.jpg',NULL,'Pondicherry','Creator_S31','2026-09-08 12:22:30','Active'),(36,'MT0001','RANJITH','2009-02-06','2026-09-09','MOHAN','77, THIRUVALLUVAR NAGAR, Villupuram, Tamil Nadu - 605652','ranjith123@gmail.com','8561564981','Male','student_photos/student_36_d8208f96.png',NULL,'Tamil Nadu','Creator_MT40','2026-09-15 11:21:44','Active'),(37,'SCON0001','NANDA','2009-02-02','2026-09-15','VENDHAN','5, KOIL STREET, VILLUPURAM, TAMIL NADU - 605602','nanda123@gmail.com','9515345641','Male',NULL,NULL,'Tamil Nadu','Creator_SCON41','2026-09-16 11:30:19','Active'),(39,'SCON0002','SIVA','2009-02-05','2026-09-11','RAMAN','6, CHETTI STREET, Pondicherry, Pondicherry - 605002','SIVA123@GMAIL.COM','8513231321','Male','student_photos/student_39_e560b690.png',NULL,'Pondicherry','Creator_SCON41','2026-09-16 11:35:49','Active'),(40,'S0002','HJHJHJH','2003-01-08','2026-09-15','DFD','JKLJKJJ, PUDUCHERRY, Pondicherry, Pondicherry - 605009','hkhk@gmail.com','7970798780','Female','student_photos/student_40_14e43dfe.jpg',NULL,'Pondicherry','Creator_S31','2026-09-16 11:40:51','Active');
/*!40000 ALTER TABLE `tbl_student_det` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_student_enrol`
--

DROP TABLE IF EXISTS `tbl_student_enrol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_student_enrol` (
  `student_enrol_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `inst_id` int NOT NULL,
  `course_id` int NOT NULL,
  `year_id` int NOT NULL,
  `student_reg_no` varchar(50) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `status_` varchar(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`student_enrol_id`),
  KEY `student_id` (`student_id`),
  KEY `inst_id` (`inst_id`),
  KEY `course_id` (`course_id`),
  KEY `year_id` (`year_id`),
  CONSTRAINT `tbl_student_enrol_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `tbl_student_det` (`student_id`),
  CONSTRAINT `tbl_student_enrol_ibfk_2` FOREIGN KEY (`inst_id`) REFERENCES `tbl_inst_master` (`inst_id`),
  CONSTRAINT `tbl_student_enrol_ibfk_3` FOREIGN KEY (`course_id`) REFERENCES `tbl_course_master` (`course_id`),
  CONSTRAINT `tbl_student_enrol_ibfk_4` FOREIGN KEY (`year_id`) REFERENCES `tbl_year_master` (`year_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_student_enrol`
--

LOCK TABLES `tbl_student_enrol` WRITE;
/*!40000 ALTER TABLE `tbl_student_enrol` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_student_enrol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_student_marks`
--

DROP TABLE IF EXISTS `tbl_student_marks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_student_marks` (
  `student_marks_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `exam_type_id` int NOT NULL,
  `exam_cat_id` int DEFAULT NULL,
  `marks_obtain` decimal(10,2) DEFAULT NULL,
  `total_marks` decimal(10,2) DEFAULT NULL,
  `exam_date` date DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `status_` varchar(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`student_marks_id`),
  KEY `student_id` (`student_id`),
  KEY `subject_id` (`subject_id`),
  KEY `exam_type_id` (`exam_type_id`),
  CONSTRAINT `tbl_student_marks_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `tbl_student_det` (`student_id`),
  CONSTRAINT `tbl_student_marks_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `tbl_subject_master` (`subject_id`),
  CONSTRAINT `tbl_student_marks_ibfk_3` FOREIGN KEY (`exam_type_id`) REFERENCES `tbl_exam_type_master` (`exam_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_student_marks`
--

LOCK TABLES `tbl_student_marks` WRITE;
/*!40000 ALTER TABLE `tbl_student_marks` DISABLE KEYS */;
INSERT INTO `tbl_student_marks` VALUES (3,35,90,1,2,NULL,NULL,'2026-01-01','Approver_S31','2026-09-09 10:48:33','Active'),(4,35,91,1,1,100.00,100.00,'2026-01-01','Approver_S31','2026-09-09 10:48:58','Active');
/*!40000 ALTER TABLE `tbl_student_marks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_student_master`
--

DROP TABLE IF EXISTS `tbl_student_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_student_master` (
  `student_id` int NOT NULL AUTO_INCREMENT,
  `student_name` varchar(150) NOT NULL,
  `register_no` varchar(50) DEFAULT NULL,
  `inst_id` int NOT NULL,
  `course_id` int NOT NULL,
  `term` varchar(50) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` varchar(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`student_id`),
  KEY `inst_id` (`inst_id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `tbl_student_master_ibfk_1` FOREIGN KEY (`inst_id`) REFERENCES `tbl_inst_master` (`inst_id`),
  CONSTRAINT `tbl_student_master_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `tbl_course_master` (`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_student_master`
--

LOCK TABLES `tbl_student_master` WRITE;
/*!40000 ALTER TABLE `tbl_student_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_student_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_subject_marks`
--

DROP TABLE IF EXISTS `tbl_subject_marks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_subject_marks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_subject_id` int NOT NULL,
  `exam_type_id` int NOT NULL,
  `max_marks` int NOT NULL DEFAULT '0',
  `pass_marks` int NOT NULL DEFAULT '0',
  `total_marks` int NOT NULL DEFAULT '100',
  `effective_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `exam_type_id` (`exam_type_id`),
  KEY `tbl_subject_marks_ibfk_1` (`course_subject_id`),
  CONSTRAINT `tbl_subject_marks_ibfk_1` FOREIGN KEY (`course_subject_id`) REFERENCES `tbl_course_subject_map` (`course_subject_id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_subject_marks_ibfk_2` FOREIGN KEY (`exam_type_id`) REFERENCES `tbl_exam_type_master` (`exam_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=141 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_subject_marks`
--

LOCK TABLES `tbl_subject_marks` WRITE;
/*!40000 ALTER TABLE `tbl_subject_marks` DISABLE KEYS */;
INSERT INTO `tbl_subject_marks` VALUES (133,91,1,100,90,100,NULL),(136,81,1,50,40,100,NULL),(137,81,2,50,35,100,NULL),(138,92,1,66,44,100,NULL),(139,92,2,34,23,100,NULL),(140,93,1,100,40,100,NULL);
/*!40000 ALTER TABLE `tbl_subject_marks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_subject_marks_log`
--

DROP TABLE IF EXISTS `tbl_subject_marks_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_subject_marks_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `course_subject_id` int NOT NULL,
  `exam_type_id` int NOT NULL,
  `old_max_marks` int DEFAULT NULL,
  `old_pass_marks` int DEFAULT NULL,
  `old_total_marks` int DEFAULT NULL,
  `new_max_marks` int DEFAULT NULL,
  `new_pass_marks` int DEFAULT NULL,
  `new_total_marks` int DEFAULT NULL,
  `action_` varchar(10) NOT NULL,
  `changed_by` varchar(50) DEFAULT NULL,
  `changed_date` datetime DEFAULT NULL,
  `signed_by` varchar(50) DEFAULT NULL,
  `signed_payload` text,
  `signature_` text,
  `signed_date` datetime DEFAULT NULL,
  `signature_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `exam_type_id` (`exam_type_id`),
  KEY `tbl_subject_marks_log_ibfk_1` (`course_subject_id`),
  CONSTRAINT `tbl_subject_marks_log_ibfk_1` FOREIGN KEY (`course_subject_id`) REFERENCES `tbl_course_subject_map` (`course_subject_id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_subject_marks_log_ibfk_2` FOREIGN KEY (`exam_type_id`) REFERENCES `tbl_exam_type_master` (`exam_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_subject_marks_log`
--

LOCK TABLES `tbl_subject_marks_log` WRITE;
/*!40000 ALTER TABLE `tbl_subject_marks_log` DISABLE KEYS */;
INSERT INTO `tbl_subject_marks_log` VALUES (99,91,1,NULL,NULL,NULL,100,90,100,'INSERT','admin','2026-09-08 12:37:44','admin','91|1|100|90|100|ADMIN_20260908_123743','FXyd1rABTpULqGdhbPI8XYf9mf5v0giLIbihe1GRx177z2NwWWxfqv8LCvbkdBsEOHXJ6ldUCaLyQpp+pg0sO6A7ljqh4zk23DxwtrCWiFd1vK5+VpzjS5J7Acgcy3CyRIiuzGAgOm3BpvFxEoBPaJiiKtHIA8RRGcya8rfSDirtrzBYsSFu+w0fKrPok525oVTDXSmfF9VNvPL7b0TqH4gevtpJ+vhUg3pcIBsOA23VhlYn7gqWk9eavfP+xlihSr9r/6ASePd7i+hPMBfGHCKz0I/PyS7MyDM5oyer7QRBxMGmgagBKRgPgTfsYa8cRzY4w6wfOHlyvK5SiKf/Pg==','2026-09-08 12:37:44','ADMIN_20260908_123743'),(100,81,1,NULL,NULL,NULL,50,40,100,'INSERT','admin','2026-09-08 15:12:56','admin','81|1|50|40|100|ADMIN_20260908_151256','UC8+jCsV/chL9Lw6SfhOtr/36pq4pp5o4kYifIsDDY0weM/DilN+ymmnGlc+WPFLI69il6b5RXrJ1F2nKiX52jOHQZzAC8jCNMk8Mu5a2eUsFvxsQmK7L/dPpBJzn8okSFThEHB3gsM4/9TqRFbVu70ylPdNDfxHGL0oAQqkUUQ5uPmIBVyl/lzOaQ+FGb0yauVdBO0mwV4+kn0rqtDhp05HhsIU8L1ceFK3XM16Ru1pivPOE4nCn7JmaMa+5+/+21IzPdSDVAbRQFjyE68POzzymxbtPpPth9RbGR9BZy2e1ydzLWjSWK3jpV5bIP3F7DxI0+nA/N8CHp3GwdrjQg==','2026-09-08 15:12:56','ADMIN_20260908_151256'),(101,81,2,NULL,NULL,NULL,50,10,100,'INSERT','admin','2026-09-08 15:12:56','admin','81|2|50|10|100|ADMIN_20260908_151256','hA94T4fgVjBtJ/mtsaTyBShqzfkBfMRzIBqCSrt9n6oJ6e17LzCb0frpPVxD8yEwJE82CpD/9C2SyUxldFYVY6ntn2FTfrfHuMsefu+fx0YU8Irby7ncscDgjgL9Pn18N6LKldQVBYKwvxCRbeyL8jFmeZmVgMxq1pKFt8TuoyzwjAGQfQQGQPM14LvO1fkSKOVO80V22Dt8Vau4LqFkixflH01yo+jlH5f6G+a3wO4Y3tQnSmX/b75vriuE0T9BUl9/9lFpL79KgfW5Wx0mclK4A/SFl8XaENUs9jxMg1ETznUZRnjQ+rmQrbdgg3cSW7Ex+2EC0oPO7tus7n5IyA==','2026-09-08 15:12:56','ADMIN_20260908_151256'),(102,81,2,50,10,100,50,35,100,'UPDATE','admin','2026-09-15 10:53:45','admin','81|2|50|35|100|ADMIN_20260915_105343','YsERVdXLvSNpS5hzg3wfGgs/T/Nwg60qaiGmFmsZBiHHV8u8JKRkPvbeta1V6dtMJ2Fx1fth0pZpnTK0tFrCkNm6slojEVp29HYSyn1qI7p1FOatvvnDx0/HJe6/W1BzT/+B/vKbMFhq3JDYaaxdcB9UZcvq0nmuSnKTuLWXHOIhjORhs4kMgBFK/BoVx+3H8QAoalgKs9DRe4PXOrSHc1bJfgh7eDg/Zz2h8j1a0OvlGHNdiFjaRSA0/wfo8b/Y0s1Nv5WX/6VuSUd2HZUPUaYZRe3UOs5ou1pAuYzWjo0mhS75FYWz90QCEfRrFPFE0sYIbG4FeDSQTPpx1OLibA==','2026-09-15 10:53:45','ADMIN_20260915_105343'),(103,92,1,NULL,NULL,NULL,66,44,100,'INSERT','admin','2026-09-15 11:29:07','admin','92|1|66|44|100|ADMIN_20260915_112906','XFe//IGNmjjjIwMaAKi0IhP31ryN+FkYl9RuiqaeAa7r2bPyCnFtp/ZToNzpxo8ea0ZS9zMy2mC1rWKfWYb6XmPaiJKVg2D/6au/v9Z50CC/MSjLFj2SV+CypvItshHpSWi0mBXcmM2wK8de4Tp4yhv6+aSIlxyP9EL1Gvknc3o1nSFWTgxVDUtRFBIVBwEgmLXihrGTELfgWLvG8TxPAQLRrRjJXdbHhJEIfOMc18Hdxcdp2O8ml+rnCE++UogqklIzTdUycZMB4yQqQjkaPO1znAnlFnX5KXdaZFvvEXXNeY7Xpl/clQkKpi4EmbC03Y5dHvGfqm2l6lMJmIB5zg==','2026-09-15 11:29:07','ADMIN_20260915_112906'),(104,92,2,NULL,NULL,NULL,34,23,100,'INSERT','admin','2026-09-15 11:29:07','admin','92|2|34|23|100|ADMIN_20260915_112906','id0xyY/A3ZtvZmf8Y8h9y2JFDBJkkU3zLQZBe2v7GGr3QRAXgT95PWB7mfTRavuwHrQm4wLccZKsqDqGQIJMUa18giAlpeimZDJ+PRVcwoZ4tuFcYhePutCAlyCgkaoSKzt3kugTzUBA9tfIvYbQlVprpXLfVRKbzBqGb2MXJOXepysBfVDnNaIRG5sgPcD0JVoEY6uguVMu1GxiIzXwlTxP2WyBeL+0qFKBB8x570+Se9bfWUY1f6Nq/oMlrzb/7UNBni68SFZC3lbjj5FS8SwAituVsR2KLgclgnuQEVnXkTwnYJ9BwXI0tjOAzwl+IAp6ssjChPziSs+8kEuzSQ==','2026-09-15 11:29:07','ADMIN_20260915_112906'),(105,93,1,NULL,NULL,NULL,100,40,100,'INSERT','admin','2026-09-16 14:30:00','admin','93|1|100|40|100|ADMIN_20260916_143000','bHP4bXPzK54RPtDRvxp4Webpm18Ek3XYG9FwaZJIZ5dpmUPC+W95NkXCUsBgIW+3Hpo0px0TOUJzx/LFVvzjNtTxka395bPdo/JOK2j8QhxddIsqNPOM9RbkSVUhvnwV+0K/TZCTOQ9Xsr7qWTDzhtvEQ2iUeGsUpl6MxPsg9UmDZzKcl5wcs5borVx6Q9wNc/7J17lMI4T+APid31EnqON1XthVx9V8Bn2y8CsyTPYDRsNd+nmxqBbSGacl3HAiQzm6Xp/R3rR2cbiyyXaH+DC8S0f5Q2D7BzHUfg/5DBjTCOh6Defhgw8yuvZ0Gs6mfibvSgyYjn1DHVNknSaXdQ==','2026-09-16 14:30:00','ADMIN_20260916_143000');
/*!40000 ALTER TABLE `tbl_subject_marks_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_subject_master`
--

DROP TABLE IF EXISTS `tbl_subject_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_subject_master` (
  `subject_id` int NOT NULL,
  `subject_desc` varchar(200) DEFAULT NULL,
  `bome_status` int DEFAULT NULL,
  `boen_status` int DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`subject_id`),
  UNIQUE KEY `uq_subject_desc` (`subject_desc`),
  CONSTRAINT `tbl_subject_master_chk_1` CHECK ((`subject_id` between 0 and 9999)),
  CONSTRAINT `tbl_subject_master_chk_2` CHECK ((`bome_status` between 0 and 9)),
  CONSTRAINT `tbl_subject_master_chk_3` CHECK ((`boen_status` between 0 and 9))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_subject_master`
--

LOCK TABLES `tbl_subject_master` WRITE;
/*!40000 ALTER TABLE `tbl_subject_master` DISABLE KEYS */;
INSERT INTO `tbl_subject_master` VALUES (1,'ANATOMY & PHYSIOLOGY',1,1,'system','2026-06-18 00:36:20','admin','2026-09-08 14:40:42',1),(2,'COMMUNITY HEALTH',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(3,'PATHOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(4,'MICROBIOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(5,'BIOCHEMISTRY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(6,'Pr-I PATHOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(7,'Pr-II MICROBIOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(8,'Pr-III BIOCHEMISTRY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(9,'PRACTICAL',1,1,'system','2026-06-18 00:36:20','admin','2026-08-07 13:24:07',1),(10,'BASIC SCIENCES, OPTICS & REFRACTION',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(11,'EYE DISEASES AND INVESTIGATIONS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(12,'COMMUNITY OPHTHALMOLOGY & COMMON EYE DISEASES',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(13,'OPERATION THEATRE OFFICE PROCEDURES & OPTICS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(14,'OCULAR ANATOMY, PHYSIO, PHARM, MICRO, BIO & PATH.',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(15,'PHYSICAL GEOMATRIC, VISUAL OPTICS & BASIC OPTOMETRIC INSTRUMENTS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(16,'OCULAR DISEASES, OPT.INST.& COMMUNITY OPHTHALMOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(17,'OPTOMETRIC OPTICS CONTACT LENSES & LOW VISION AIDS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(18,'AYURVEDA ADISTHANA SIDHANTHA',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(19,'SHAREERA VINJANA',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(20,'DRAVYA – OUSHAHA VINJANA',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(21,'SWASTHA VRITHA & YOGA',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(22,'PANCHAKARMA VIDHIKAL',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(23,'KERALEEYA VISHESHA VIDHIKAL',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(24,'KRIYA KRAMAM (IN SHALYA, SHALKYA, PRASOOTHI)',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(25,'Pr-I PANCHAKARMA VIDHIKAL',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(26,'Pr-II KERALEEYA VISHESHA VIDHIKAL',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(27,'Pr-III KRIYA KRAMAM (IN SHALYA, SHALKYA, PRASOOTHI)',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(28,'HUMAN ANATOMY & HUMAN PHYSIOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(29,'APPLIED BIOCHEMISTRY & APPLIED PHARMACOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(30,'APPLIED MICROBIOLOGY & APPLIED PATHOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(31,'DIALYSIS TECHNOLOGY-I',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(32,'DIALYSIS TECHNOLOGY-II',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(33,'Pr-DIALYSIS TECHNOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(34,'ANATOMY, PHYSIOLOGY & HISTOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(35,'PHARMACALOGY, PATHOLOGY & MICROBIOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(36,'FOOD NUTRITION & RADIOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(37,'PR-I ANATOMY, PHYSIOLOGY & HISTOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(38,'PR-II PHARMACOLOGY, PATHOLOGY & MICROBIOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(39,'PR-III FOOD NUTRITION & RADIOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(40,'DENTAL HYGIENE & ORAL PROPHYLAXIS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(41,'DENTAL HEALTH EDU, COMM / P.H. DENTISTRY. PREVENTIVE DENT',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(42,'DENTAL MATERIALS, DENT ETHICS JURISPRUDENCE, ORIENT. IN DENT',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(43,'PR-I DENTAL HYGIENE & ORAL PROPHYLAXIS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(44,'PR-II DENTAL HEALTH EDU, COMM/P.H. DENTISTRY. PREVENTIVE DENT',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(45,'PR-III DENT MATERIALS, DENT ETHICS JURISPRUDENCE, ORIENT. IN DENT',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(46,'APPLIED PHYSICS, CHEMISTRY & MECHANICS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(47,'DENTAL MECHANICS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(48,'APPLIED ORAL ANATOMY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(49,'PR-I DENTAL MECHANICS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(50,'PR-II APPLIED ORAL ANATOMY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(51,'DENTAL MECHANICS (FINAL)',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(52,'DENTAL MATERIALS & METALLURGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(53,'BASIC KNOWLEDGE OF COMPUTER & MEDICAL RECORDS MGT',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(54,'PR-DENTAL MECHANICS (FINAL)',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(55,'BASIC RADIOGRAPHIC TECH IMAGE PROCESSING TECH',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(56,'GENERAL PHYSICS & RADIOGRAPHIC PHYSICS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(57,'SPECIAL RADIOGRAPHIC PROCEDURES',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(58,'RADIATION DETECTION & RADIATION PROTECTION',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(59,'CT, MRI, ULTRASOUND MODERN & ADVANCED IMAGING TECHNIQUES',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(60,'Pr-GENERAL, SPECIAL & ADVANCED RADIOGRAPHIC TECHNIQUES',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(61,'CARDIAC CARE TECHNOLOGY-I',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(62,'CARDIAC CARE TECHNOLOGY-II',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(63,'Pr-CARDIAC CARE TECHNOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(64,'OPERATION THEATRE EQUIPMENT & TECHNIQUES',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(65,'PRINCIPLES PROCEDURE OF STERILIZATION & ANAESTHESIA THEATRE',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(66,'BASIC INTENSIVE CARE TECHNIQUES IN OPERATION THEATRE',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(67,'MEDICINE AND MEDICAL ETHICS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(68,'Pr-CSSD PROCEDURE TECHNIQUES PRACTICAL & CLINICAL EDUCATION',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(69,'PHARMACEUTICS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(70,'PHARMACEUTICAL CHEMISTRY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(71,'PHARMACOGNOSY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(72,'HUMAN ANATOMY & PHYSIOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(73,'SOCIAL PHARMACY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(74,'PR-I PHARMACEUTICS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(75,'PR-II PHARMACEUTICAL CHEMISTRY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(76,'PR-III PHARMACOGNOSY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(77,'PR-IV HUMAN ANATOMY & PHYSIOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(78,'PR-V SOCIAL PHARMACY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(79,'PHARMACOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(80,'COMMUNITY PHARMACY & MANAGEMENT',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(81,'BIOCHEMISTRY & CLINICAL PATHOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(82,'PHARMACOTHERAPEUTICS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(83,'HOSPITAL & CLINICAL PHARMACY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(84,'PHARMACY LAW & ETHICS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(85,'PR-I PHARMACOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(86,'PR-II COMMUNITY PHARMACY & MANAGEMENT',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(87,'PR-III BIOCHEMISTRY & CLINICAL PATHOLOGY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(88,'PR-IV PHARMACOTHERAPEUTICS',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(89,'PR-V HOSPITAL & CLINICAL PHARMACY',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(90,'CLINICAL THEATRE IN THE MORNING AND PRINCIPLES OF ANAESTHESIA-I',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(91,'PRINCIPLES OF ANAESTHESIA-II',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(92,'PRINCIPLES OF STERILIZATION & ANAESTHESIA TECH',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(93,'PRE-ANAESTHETIC TECHNIQUES & CLINICAL EDUCATION',1,1,'system','2026-06-18 00:36:20',NULL,NULL,1),(100,'BIO-SCIENCES',1,1,'system','2026-09-04 11:14:04','admin','2026-09-08 13:34:28',1),(101,'BEHAVIOURAL SCIENCES',0,1,'system','2026-09-04 11:14:04','admin','2026-09-08 13:34:29',1),(102,'NURSING FOUNDATION',0,1,'system','2026-09-04 11:14:04','admin','2026-09-08 13:34:30',1),(103,'COMMUNITY HEALTH NURSING - I',0,1,'system','2026-09-04 11:14:04','admin','2026-09-15 10:52:48',1),(104,'MEDICAL SURGICAL NURSING - I',0,1,'system','2026-09-04 11:14:04',NULL,NULL,1),(105,'MEDICAL SURGICAL NURSING - II',0,1,'system','2026-09-04 11:14:04',NULL,NULL,1),(106,'MENTAL HEALTH NURSING',0,1,'system','2026-09-04 11:14:04',NULL,NULL,1),(107,'PEDIATRIC NURSING',0,1,'system','2026-09-04 11:14:04',NULL,NULL,1),(108,'MIDWIFERY & GYNECOLOGICAL NURSING',0,1,'system','2026-09-04 11:14:04',NULL,NULL,1),(109,'COMMUNITY HEALTH NURSING - II',0,1,'system','2026-09-04 11:14:04',NULL,NULL,1),(110,'COMMUNITY HEALTH NURSING',0,1,'system','2026-09-04 11:14:04','admin','2026-09-08 09:53:11',1),(111,'HEALTH PROMOTION',0,1,'system','2026-09-04 11:14:04','admin','2026-09-08 09:53:12',1),(112,'PRIMARY HEALTH CARE NURSING',0,1,'system','2026-09-04 11:14:04','admin','2026-09-08 09:53:13',1),(113,'CHILD HEALTH NURSING',0,1,'system','2026-09-04 11:14:04','admin','2026-09-08 09:53:13',1),(114,'MIDWIFERY',0,1,'system','2026-09-04 11:14:04','admin','2026-09-08 09:53:14',1),(115,'HEALTH CENTRE MANAGEMENT',0,1,'system','2026-09-04 11:14:04',NULL,NULL,1),(116,'PAPER-IV',1,0,'system','2026-09-04 11:14:04',NULL,NULL,1),(117,'PAPER-V',1,0,'system','2026-09-04 11:14:04',NULL,NULL,1),(118,'PAPER-VI',1,0,'system','2026-09-04 11:14:04',NULL,NULL,1),(119,'BASIC ECG TECHNOLOGY',1,0,'system','2026-09-04 11:14:04',NULL,NULL,1),(120,'MATHS',0,0,'system','2026-09-23 11:07:03',NULL,NULL,1),(121,'MATHS2@',0,0,'system','2026-09-23 11:08:31',NULL,NULL,1),(122,'HD',0,0,'system','2026-09-23 11:12:14',NULL,NULL,0);
/*!40000 ALTER TABLE `tbl_subject_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_user_keys`
--

DROP TABLE IF EXISTS `tbl_user_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_user_keys` (
  `user_id` varchar(50) NOT NULL,
  `public_key` text NOT NULL,
  `private_key` text NOT NULL,
  `created_date` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_user_keys`
--

LOCK TABLES `tbl_user_keys` WRITE;
/*!40000 ALTER TABLE `tbl_user_keys` DISABLE KEYS */;
INSERT INTO `tbl_user_keys` VALUES ('admin','-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr1ERfFDp7jXrxXhULXBI\nu0nl2Cwb4tv8xLhU9doCl4RHEZHTeUcy/p74X4zltUP9e//j4A7uEgU9fVHRVcLq\ngf5WqXyAWfz6nCIIcEDevL0Kt078IyE2gkWlpOJ07C5z1MaarEhIw3FetoFYBaSc\nVt054xsyZGoJ08wrGOQ1brPSrk7W1IkCnuhSi4Wfr6tKFg5HMH3ct8omFRVBfY/W\n2EbYqO4Sk6Zq9vZ7OSDLcyFSIVJfb8xuG8wKQKnFbyZAOcnxO0LCM1SHElGGjcqN\nhYCBIFXBMHd6YHFu2w4JrFKNT3tb2DmBOKyEIUkeP9NbYqmMo2U2y463VOa7jzmC\nGwIDAQAB\n-----END PUBLIC KEY-----\n','-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCvURF8UOnuNevF\neFQtcEi7SeXYLBvi2/zEuFT12gKXhEcRkdN5RzL+nvhfjOW1Q/17/+PgDu4SBT19\nUdFVwuqB/lapfIBZ/PqcIghwQN68vQq3TvwjITaCRaWk4nTsLnPUxpqsSEjDcV62\ngVgFpJxW3TnjGzJkagnTzCsY5DVus9KuTtbUiQKe6FKLhZ+vq0oWDkcwfdy3yiYV\nFUF9j9bYRtio7hKTpmr29ns5IMtzIVIhUl9vzG4bzApAqcVvJkA5yfE7QsIzVIcS\nUYaNyo2FgIEgVcEwd3pgcW7bDgmsUo1Pe1vYOYE4rIQhSR4/01tiqYyjZTbLjrdU\n5ruPOYIbAgMBAAECggEABRpLc35ZaLUKETvQ22e2vjjG51VVVHOJtmIVGvjG9YkE\nlobTjGadndqbqRBNSUra0Gagx883b6/WW9TrTl83eyQfepxkkfnyg2PcMgQ5V237\nJ121qgIX94+2ZAexVoR9m5ZSPyx1bbbZhl9aZAOoB0E2I52RiGmrso3xPS67PWcT\nGgfntRk/Wf1GOBOUxGRqhaPcqbAnBdon8S0NnBxt8u+97D4zHbXM2pZZjclJXX16\ngGacyDzEhaJn0VBojPzth2OZPlYX1xFX1B4274G0kp1yrFUIbEYazzRILgNT0VfZ\nyQw/Sp50LvNlESzufphRkTz6T/8bOW6nlTBLRt8EZQKBgQDo3ZFEN7clpHGHjhaR\nuji/+ihEbhxYY/MRixtvYyB13hW7IK3pQwSmfRzEc17n/iLuEgHzFOehQezPIXQm\nKatRKIDKFA/bz9nWmfnkKwWGKPfr17/yKWFhtOzMHFR9saIpD8ywaAZQvD4VWSyG\nloYjeJKavIzwpr0jEcRfOxEixQKBgQDAu97S9uD32uiSk2/heQNLF1nboZeS9Jii\naxve9xD0wd3KqVD0yPW0lmjCf1HwgUttROoiBkT96rmGcyAqyydA5CzRRPKXUawX\naYGzd6/hZ6uBYh+9RWv6TDgE4L7Nt8OiEJI9RbDEQsdo3fzUYu9iyTPtRmlBTqPy\nXMjINYTfXwKBgAiS599YIdEr/dYc4C3bam1/G25xk2+ZtoBl28u9HZvZYnlyWZTm\nF8y9fIqrKMpn7AdR+Gpn0aN5VuvFco5ZKGqjkCJgnLjeLUoefznsb5ah+YbgebvD\n1EcRr0pQnLfIC41xfHreSaU9WRfWIbKO5j92GAfEe3f826fn5pAPD7F1AoGARwt5\nwc5bc0HwhUdv8G9JNX7wErPoSbV8JjLRXUk5qN9lwHTVcMY7PExNZZTFQaCHi0nh\n/JTPDcJejR8W9m9YkuUJWELQIdNrWl37/4nY/X/XiqP/Cyfx+5vo8nNeIjrhFHaD\nUa7E0DPFifR6ZFfr4kBEsexIlFhGuupU4OhJiIUCgYAaTdUWJUmw3J0QyD7uX/gZ\nIp62HnLNDW8FXwS9qjd7vgUrAnhEPsbWTvJJhVvKOdte0ZDNDj3YJJ3w33zYN6fp\n5J5VeBck3FGFUM/7I3EALe09y2A47gIQwueWkVphVyHqfSiA/MDvJukYYoykbshu\nE1Hk4ICHqAT7H+3aJFkDyA==\n-----END PRIVATE KEY-----\n','2026-08-10 10:59:52'),('system','-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5SkExQDIMqzVuOOZrbwg\nsOI/2zHbxRjCfqjmgWUVTHmUsJfNOfs3L0aCsc5jcK26QH1d+N4S/4N+OjoEbB97\nm65rPcNJGelg1m2HHFJmTaLI9ewgLTHJc8JuwoK/c4wby+SIBL6iqfFOHGedpvFg\nWuvX6H3jpgQZHyTR440L1R8M4ue7/mGIvCzXGdvV/pc/ZbxYJlB81gfpmc6N3jur\nLHpg0+WCF8tRj3RZnRZwb/XRu65XAquUhcWnVPq8T0SkLNKdtrL+eGrq66W3cg7w\ncHG2GBdT7OIEsa8jS220zg2XVWov9OdpF+0uqCWWjT2vUZDUIkMoM+4MwZ4xWTKH\nOQIDAQAB\n-----END PUBLIC KEY-----\n','-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDlKQTFAMgyrNW4\n45mtvCCw4j/bMdvFGMJ+qOaBZRVMeZSwl805+zcvRoKxzmNwrbpAfV343hL/g346\nOgRsH3ubrms9w0kZ6WDWbYccUmZNosj17CAtMclzwm7Cgr9zjBvL5IgEvqKp8U4c\nZ52m8WBa69fofeOmBBkfJNHjjQvVHwzi57v+YYi8LNcZ29X+lz9lvFgmUHzWB+mZ\nzo3eO6ssemDT5YIXy1GPdFmdFnBv9dG7rlcCq5SFxadU+rxPRKQs0p22sv54aurr\npbdyDvBwcbYYF1Ps4gSxryNLbbTODZdVai/052kX7S6oJZaNPa9RkNQiQygz7gzB\nnjFZMoc5AgMBAAECggEAIEqmbGhOza1DNJmF51ByPtqy6t1cvapeheChEqy+0pbz\nV+scNUZsIVJLSmjt5Evmyf2gh1grzyulVukkBGRvU6HBZOOm4mrbhXvLpTcLSXdd\n4CGU6ylv3MsSNoCcH9kndZTPgfOnElF5k1EaixLKZCWFuDI9KQC81YGnvev7Nd20\n/KSNjl5VH/dPTvLZZEOIMLy86OKYDig0g4DJZmghwNc1khifZ9PilxKKSL/VG1rn\n7YSJkr4X9TsGVHueMDtOztGLoGSi58s5gYdCEQt3T/4CdaIQR8nlsKWGAYpm/li2\nlq9gN09xCXyZHWZIW0C0mAG5iA4rMHEQa48AcnkP8QKBgQD0H1pIhez4miyEf3IM\nHXAhOYGbqN8Jkr2WdjH26ijQrIddjyql8RkuSaMsY0ga50iCzqNEDD9ldesEApZV\ncRcd5VSW+ymDS7oRtOqJmbU9geUoXPKavrmM0AGxvRnP4y8stGxBaI1yob/8SiAD\nl+xhl11p3z8fk6l1SikfUALwnQKBgQDwT04TgP8RvwbNO2kH3BUA8qDCC2oM7Nmm\nSAc7zXjHH7RMHB0kthYrgcXwntgtzhbOH8lt2cviPTSahTSe3iLoC+IV3qbbU1Rr\na1LgqZlAoIGstHLCYzz34V3eBmbzgWZjU8p8Ln+1Zz7IXRiRx3dI/r7Ac4kAtXCB\nRdp46/RITQKBgQC54f2u5zsveMWZBinjC69LvSvxSL673V466TjWWCpH6ncQSGki\n/dg8pJl4vQg0ZBOUdp9euyyypv0Sip3J5VjCzNKCPDC55rmBrg5ARCf686N3/n5E\nUiGbFO+VVPYIk2ZiVedwTpoVxRAYnKCP2+iDzuu0J+c6tgb8ZkG1tAjpCQKBgQCl\nnSIj0uz23/3iByW1Yvmes5gS4ybtTXYaYN2LW2n3YWQyZ9W17T+OMFuoHvDBcJzK\n5aE+cbFPc/sC2vaO3myUG0xu4gmAcgdmGIr/hiK2JWf5DEtiqF3mP40fbK4a930G\ny0JrHuiorkTYdUBvh1YwGlB/9Z/fuyuUC/4rBAJQqQKBgQCL2DQeARt6mVB7HvkC\n3hK3yV5dTGrd6Pe1FCuLPsPGEfU6303pzK0HMrmpLd6dn0NKXTbvKP9DXDTYO/tW\nFZ2rdG9nWwOTCc8Qq2Otj6afL9W95vDX2/Ja8LXgtD7m+We6ApZFXfzDbe2C7qds\n2NQ/wempql9RECZG6b3oR2PWmg==\n-----END PRIVATE KEY-----\n','2026-08-14 11:33:23');
/*!40000 ALTER TABLE `tbl_user_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_year_id`
--

DROP TABLE IF EXISTS `tbl_year_id`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_year_id` (
  `year_id` int NOT NULL,
  `year_desc` varchar(100) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`year_id`),
  CONSTRAINT `tbl_year_id_chk_1` CHECK ((`year_id` between 0 and 99))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_year_id`
--

LOCK TABLES `tbl_year_id` WRITE;
/*!40000 ALTER TABLE `tbl_year_id` DISABLE KEYS */;
INSERT INTO `tbl_year_id` VALUES (1,'Year 1','system','2026-08-08 12:17:31',NULL,NULL,1),(2,'Year 2','system','2026-08-08 12:17:31',NULL,NULL,1),(3,'Year 3','system','2026-08-08 12:17:31',NULL,NULL,1),(4,'Year 4','system','2026-08-08 12:17:31',NULL,NULL,1);
/*!40000 ALTER TABLE `tbl_year_id` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_year_master`
--

DROP TABLE IF EXISTS `tbl_year_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_year_master` (
  `year_id` int NOT NULL,
  `year_desc` varchar(100) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`year_id`),
  CONSTRAINT `tbl_year_master_chk_1` CHECK ((`year_id` between 0 and 99))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_year_master`
--

LOCK TABLES `tbl_year_master` WRITE;
/*!40000 ALTER TABLE `tbl_year_master` DISABLE KEYS */;
INSERT INTO `tbl_year_master` VALUES (1,'Year 1','system','2026-06-28 22:25:18',NULL,NULL,1),(2,'Year 2','system','2026-06-28 22:25:18',NULL,NULL,1),(3,'Year 3','system','2026-06-28 22:25:18',NULL,NULL,1),(4,'Year 4','system','2026-06-28 22:25:18',NULL,NULL,1);
/*!40000 ALTER TABLE `tbl_year_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_year_ref`
--

DROP TABLE IF EXISTS `tbl_year_ref`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_year_ref` (
  `year_ref` int NOT NULL,
  `year_ref_desc` varchar(100) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `status_` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`year_ref`),
  CONSTRAINT `tbl_year_ref_chk_1` CHECK ((`year_ref` between 0 and 99))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_year_ref`
--

LOCK TABLES `tbl_year_ref` WRITE;
/*!40000 ALTER TABLE `tbl_year_ref` DISABLE KEYS */;
INSERT INTO `tbl_year_ref` VALUES (1,'2010','system','2026-08-08 10:56:46',NULL,NULL,1),(2,'2011','system','2026-08-08 10:56:46',NULL,NULL,1),(3,'2012','system','2026-08-08 10:56:46',NULL,NULL,1),(4,'2013','system','2026-08-08 10:56:46',NULL,NULL,1),(5,'2014','system','2026-08-08 10:56:46',NULL,NULL,1),(6,'2015','system','2026-08-08 10:56:46',NULL,NULL,1),(7,'2016','system','2026-08-08 10:56:46',NULL,NULL,1),(8,'2017','system','2026-08-08 10:56:46',NULL,NULL,1),(9,'2018','system','2026-08-08 10:56:46',NULL,NULL,1),(10,'2019','system','2026-08-08 10:56:46',NULL,NULL,1),(11,'2020','system','2026-08-08 10:56:46',NULL,NULL,1),(12,'2021','system','2026-08-08 10:56:46',NULL,NULL,1),(13,'2022','system','2026-08-08 10:56:46',NULL,NULL,1),(14,'2023','system','2026-08-08 10:56:46',NULL,NULL,1),(15,'2024','system','2026-08-08 10:56:46',NULL,NULL,1),(16,'2025','system','2026-08-08 10:56:46',NULL,NULL,1),(17,'2026','system','2026-08-08 10:56:46',NULL,NULL,1),(18,'2027','system','2026-08-08 10:56:46',NULL,NULL,1),(19,'2028','system','2026-08-08 10:56:46',NULL,NULL,1),(20,'2029','system','2026-08-08 10:56:46',NULL,NULL,1),(21,'2030','system','2026-08-08 10:56:46',NULL,NULL,1),(22,'2031','system','2026-08-08 10:56:46',NULL,NULL,1),(23,'2032','system','2026-08-08 10:56:46',NULL,NULL,1),(24,'2033','system','2026-08-08 10:56:46',NULL,NULL,1),(25,'2034','system','2026-08-08 10:56:46',NULL,NULL,1),(26,'2035','system','2026-08-08 10:56:46',NULL,NULL,1);
/*!40000 ALTER TABLE `tbl_year_ref` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `inst_id` int DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'user',
  `permissions_json` text,
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  `institution_role` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `fk_users_inst` (`inst_id`),
  CONSTRAINT `fk_users_inst` FOREIGN KEY (`inst_id`) REFERENCES `tbl_inst_master` (`inst_id`)
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'superadmin',NULL,'scrypt:32768:8:1$l7hiKYmG9OV6QJer$2db3e8edffb1f729ab43c6a7cfc1475b3b9fc43906d87b831e371c74b9898cdd8f219fdc9a9fb8d800840ab039fda16cc8d853ba2e9e8eb5012bedadee475378',NULL,'system','Super Admin',NULL,0,NULL),(2,'admin',NULL,'scrypt:32768:8:1$ZEaDgd4R1ejhpaIJ$464017c5331282a2b3ef3aba4e89c1d924dfaeeb57ff2f255c65838f4f3ae6494f22e0a272733afa60738f2e2b13b17b8c506087de682da5979bbee55d47a0c4','admin','superadmin','department-admin',NULL,0,NULL),(55,'Creator_CCN33',33,'scrypt:32768:8:1$nKHLWmv6Av3LDo6Q$49aa9593efb5234e1b73160ec7e967878d8b2b135143d551763a79d73190146b7b413a7ca9901c2b906985b12b8df72233149c391c62449f7094ebbd33d0fcf6',NULL,'admin','Institution',NULL,1,'Creator'),(56,'Approver_CCN33',33,'scrypt:32768:8:1$edJdn8ZU6BYaZP9K$252084903b1970a9b39d252afcd13d8229b522fddd1057b9140d0d48d3216ac28367d3101bd2a65d77f52b9c78cf252277ee45cefc9a5801174f67d7f0ff0cfe',NULL,'admin','Institution',NULL,1,'Approver'),(113,'Creator_S34',34,'scrypt:32768:8:1$NRbufHtMlMOK40Ad$0c366203395c10aaca064eb77baaca832b804120ae8723186f07580e4992c66cc58606e91581f1a39b1b80e8fdf840f6bc44d1687f2cd2d4a88110ca5eb0d27c',NULL,'admin','Institution',NULL,1,'Creator'),(114,'Approver_S34',34,'scrypt:32768:8:1$a3PPF3m3hrDPQ8gA$4f7534fb7afe9d7417aff0f5ba27ff13736eab898b087f700085162bd967ff1be79944ad4abab1b4457745acb82ebaf24d95ed508dd7331d96afd4eda66eda88',NULL,'admin','Institution',NULL,1,'Approver');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'medical_education'
--

--
-- Dumping routines for database 'medical_education'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-23 11:58:08
