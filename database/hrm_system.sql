-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1:3307
-- Thời gian đã tạo: Th12 13, 2025 lúc 11:00 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `hrm_system`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `activity_logs`
--

CREATE TABLE `activity_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(50) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `old_values` text DEFAULT NULL,
  `new_values` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `allowances`
--

CREATE TABLE `allowances` (
  `allowance_id` int(11) NOT NULL,
  `allowance_name` varchar(100) NOT NULL,
  `allowance_code` varchar(20) NOT NULL,
  `amount` decimal(12,2) DEFAULT 0.00,
  `allowance_type` enum('fixed','percentage') DEFAULT 'fixed',
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `allowances`
--

INSERT INTO `allowances` (`allowance_id`, `allowance_name`, `allowance_code`, `amount`, `allowance_type`, `description`, `is_active`, `created_at`) VALUES
(1, 'Phụ cấp ăn trưa', 'LUNCH', 30000.00, 'fixed', NULL, 1, '2025-11-23 05:57:36'),
(2, 'Phụ cấp xăng xe', 'FUEL', 500000.00, 'fixed', NULL, 1, '2025-11-23 05:57:36'),
(3, 'Phụ cấp điện thoại', 'PHONE', 200000.00, 'fixed', NULL, 1, '2025-11-23 05:57:36'),
(4, 'Phụ cấp trách nhiệm', 'RESPONSIBILITY', 2000000.00, 'fixed', NULL, 1, '2025-11-23 05:57:36');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `attendance`
--

CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `shift_id` int(11) DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `actual_hours` decimal(4,2) DEFAULT 0.00,
  `overtime_hours` decimal(4,2) DEFAULT 0.00,
  `late_minutes` int(11) DEFAULT 0,
  `early_leave_minutes` int(11) DEFAULT 0,
  `status` enum('present','absent','late','half_day','leave') DEFAULT 'present',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `check_in_method` enum('manual','face_recognition','card','fingerprint') DEFAULT 'manual' COMMENT 'Method used for check-in',
  `check_out_method` enum('manual','face_recognition','card','fingerprint') DEFAULT 'manual' COMMENT 'Method used for check-out',
  `face_recognition_confidence` decimal(5,4) DEFAULT NULL COMMENT 'Face recognition confidence score',
  `check_in_photo` varchar(255) DEFAULT NULL COMMENT 'Path to photo taken during check-in',
  `check_out_photo` varchar(255) DEFAULT NULL COMMENT 'Path to photo taken during check-out'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `attendance`
--

INSERT INTO `attendance` (`attendance_id`, `employee_id`, `shift_id`, `attendance_date`, `check_in`, `check_out`, `actual_hours`, `overtime_hours`, `late_minutes`, `early_leave_minutes`, `status`, `notes`, `created_at`, `updated_at`, `check_in_method`, `check_out_method`, `face_recognition_confidence`, `check_in_photo`, `check_out_photo`) VALUES
(1, 1, 1, '2025-11-01', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-01 10:00:00', '2025-12-13 16:37:39', 'manual', 'manual', NULL, NULL, NULL),
(2, 1, 1, '2025-11-04', '08:05:00', '17:00:00', 7.92, 0.00, 5, 0, 'late', NULL, '2025-11-04 10:00:00', '2025-12-13 16:37:43', 'manual', 'manual', NULL, NULL, NULL),
(3, 2, 1, '2025-11-05', '08:00:00', '19:00:00', 8.00, 2.00, 0, 0, 'present', NULL, '2025-11-05 12:00:00', '2025-12-13 16:33:45', 'manual', 'manual', NULL, NULL, NULL),
(4, 2, 1, '2025-11-06', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-06 10:00:00', '2025-12-13 16:33:50', 'manual', 'manual', NULL, NULL, NULL),
(5, 1, 1, '2025-11-07', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-07 10:00:00', '2025-12-13 16:39:01', 'manual', 'manual', NULL, NULL, NULL),
(6, 1, 1, '2025-11-08', '08:15:00', '17:00:00', 7.75, 0.00, 15, 0, 'late', NULL, '2025-11-08 10:00:00', '2025-12-13 16:39:07', 'manual', 'manual', NULL, NULL, NULL),
(7, 6, 1, '2025-11-11', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-11 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(8, 6, 1, '2025-11-12', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-12 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(9, 6, 1, '2025-11-13', '08:00:00', '18:00:00', 8.00, 1.00, 0, 0, 'present', NULL, '2025-11-13 11:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(10, 6, 1, '2025-11-14', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-14 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(11, 6, 1, '2025-11-15', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-15 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(12, 6, 1, '2025-11-18', '08:10:00', '17:00:00', 7.83, 0.00, 10, 0, 'late', NULL, '2025-11-18 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(13, 6, 1, '2025-11-19', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-19 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(14, 6, 1, '2025-11-20', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-20 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(15, 2, 1, '2025-11-21', '08:00:00', '20:00:00', 8.00, 3.00, 0, 0, 'present', NULL, '2025-11-21 13:00:00', '2025-12-13 16:36:04', 'manual', 'manual', NULL, NULL, NULL),
(16, 6, 1, '2025-11-22', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-22 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(17, 6, 1, '2025-11-25', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-25 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(18, 6, 1, '2025-11-26', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-26 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(19, 6, 1, '2025-11-27', '08:00:00', '11:14:07', 3.24, 0.00, 0, 0, 'present', NULL, '2025-11-27 01:00:00', '2025-11-27 10:14:07', 'manual', 'manual', NULL, NULL, NULL),
(20, 11, 1, '2025-11-01', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-01 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(21, 11, 1, '2025-11-04', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-04 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(22, 11, 1, '2025-11-05', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-05 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(23, 11, 1, '2025-11-06', NULL, NULL, 0.00, 0.00, 0, 0, 'absent', NULL, '2025-11-06 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(24, 11, 1, '2025-11-07', NULL, NULL, 0.00, 0.00, 0, 0, 'absent', NULL, '2025-11-07 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(25, 11, 1, '2025-11-08', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-08 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(26, 11, 1, '2025-11-11', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-11 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(27, 11, 1, '2025-11-12', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-12 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(28, 11, 1, '2025-11-13', '08:30:00', '17:00:00', 7.50, 0.00, 30, 0, 'late', NULL, '2025-11-13 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(29, 11, 1, '2025-11-14', NULL, NULL, 0.00, 0.00, 0, 0, 'absent', NULL, '2025-11-14 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(30, 11, 1, '2025-11-15', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-15 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(31, 11, 1, '2025-11-18', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-18 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(32, 11, 1, '2025-11-19', NULL, NULL, 0.00, 0.00, 0, 0, 'absent', NULL, '2025-11-19 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(33, 11, 1, '2025-11-20', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-20 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(34, 11, 1, '2025-11-21', NULL, NULL, 0.00, 0.00, 0, 0, 'absent', NULL, '2025-11-21 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(35, 11, 1, '2025-11-22', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-22 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(36, 11, 1, '2025-11-25', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-25 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(37, 11, 1, '2025-11-26', '08:00:00', '17:00:00', 8.00, 0.00, 0, 0, 'present', NULL, '2025-11-26 10:00:00', '2025-11-27 10:11:39', 'manual', 'manual', NULL, NULL, NULL),
(52, 2, 1, '2025-12-14', '04:34:29', NULL, 0.00, 0.00, 0, 0, 'present', NULL, '2025-12-13 21:34:29', '2025-12-13 21:34:29', 'face_recognition', NULL, NULL, 'EMP002/EMP002_checkin_20251214_043429.jpg', NULL),
(54, 6, 1, '2025-12-14', '04:57:06', '04:57:48', 0.01, 0.00, 0, 0, 'present', NULL, '2025-12-13 21:57:06', '2025-12-13 21:57:48', 'face_recognition', 'face_recognition', NULL, 'EMP006/EMP006_checkin_20251214_045706.jpg', 'EMP006/EMP006_checkout_20251214_045748.jpg');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `deductions`
--

CREATE TABLE `deductions` (
  `deduction_id` int(11) NOT NULL,
  `deduction_name` varchar(100) NOT NULL,
  `deduction_code` varchar(20) NOT NULL,
  `deduction_type` enum('insurance','tax','other') DEFAULT 'other',
  `rate` decimal(5,2) DEFAULT 0.00 COMMENT 'percentage',
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `deductions`
--

INSERT INTO `deductions` (`deduction_id`, `deduction_name`, `deduction_code`, `deduction_type`, `rate`, `description`, `is_active`, `created_at`) VALUES
(1, 'Bảo hiểm xã hội', 'SOCIAL_INS', 'insurance', 8.00, NULL, 1, '2025-11-23 05:57:36'),
(2, 'Bảo hiểm y tế', 'HEALTH_INS', 'insurance', 1.50, NULL, 1, '2025-11-23 05:57:36'),
(3, 'Bảo hiểm thất nghiệp', 'UNEMPLOYMENT_INS', 'insurance', 1.00, NULL, 1, '2025-11-23 05:57:36'),
(4, 'Thuế TNCN', 'INCOME_TAX', 'tax', 10.00, NULL, 1, '2025-11-23 05:57:36');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `departments`
--

CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL,
  `department_name` varchar(100) NOT NULL,
  `department_code` varchar(20) NOT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `departments`
--

INSERT INTO `departments` (`department_id`, `department_name`, `department_code`, `manager_id`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Phòng Kỹ Thuật', 'IT', 1, 'Phòng phát triển và bảo trì hệ thống công nghệ thông tin', '2025-01-01 01:00:00', '2025-11-27 10:11:39'),
(2, 'Phòng Nhân Sự', 'HR', 2, 'Phòng quản lý nhân sự và tuyển dụng', '2025-01-01 01:00:00', '2025-11-27 10:11:39'),
(3, 'Phòng Kinh Doanh', 'SALES', 3, 'Phòng kinh doanh và phát triển thị trường', '2025-01-01 01:00:00', '2025-11-27 10:11:39'),
(4, 'Phòng Kế Toán', 'ACC', 4, 'Phòng kế toán và tài chính', '2025-01-01 01:00:00', '2025-12-13 16:08:37'),
(5, 'Phòng Marketing', 'MKT', 5, 'Phòng marketing và truyền thông', '2025-01-01 01:00:00', '2025-11-27 10:11:39');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `employees`
--

CREATE TABLE `employees` (
  `employee_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `employee_code` varchar(20) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `gender` enum('male','female','other') DEFAULT 'other',
  `date_of_birth` date DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `position_id` int(11) DEFAULT NULL,
  `hire_date` date NOT NULL,
  `contract_type` enum('fulltime','parttime','contract','intern') DEFAULT 'fulltime',
  `contract_start` date DEFAULT NULL,
  `contract_end` date DEFAULT NULL,
  `salary` decimal(12,2) DEFAULT 0.00,
  `bank_account` varchar(50) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `tax_code` varchar(20) DEFAULT NULL,
  `insurance_number` varchar(30) DEFAULT NULL,
  `education_level` varchar(50) DEFAULT NULL,
  `status` enum('active','inactive','resigned') DEFAULT 'active',
  `resignation_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `face_photo` varchar(255) DEFAULT NULL COMMENT 'Path to employee face photo for recognition'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `employees`
--

INSERT INTO `employees` (`employee_id`, `user_id`, `employee_code`, `full_name`, `gender`, `date_of_birth`, `phone`, `email`, `address`, `avatar`, `department_id`, `position_id`, `hire_date`, `contract_type`, `contract_start`, `contract_end`, `salary`, `bank_account`, `bank_name`, `tax_code`, `insurance_number`, `education_level`, `status`, `resignation_date`, `created_at`, `updated_at`, `face_photo`) VALUES
(1, 2, 'EMP001', 'Nguyễn Văn An', 'male', '1985-05-15', '0901234567', 'manager.it@hrm.com', '123 Đường Lê Lợi, Quận 1, TP.HCM', NULL, 1, 1, '2025-01-01', 'fulltime', NULL, NULL, 25000000.00, NULL, NULL, NULL, NULL, NULL, 'inactive', NULL, '2025-01-01 01:00:00', '2025-12-13 17:27:49', NULL),
(2, 3, 'EMP002', 'Trần Thị Bình', 'female', '1987-08-20', '0902345678', 'manager.hr@hrm.com', '456 Đường Nguyễn Huệ, Quận 1, TP.HCM', NULL, 2, 4, '2025-01-01', 'fulltime', NULL, NULL, 22000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-01-01 01:00:00', '2025-12-13 20:50:08', 'EMP002/EMP002.jpg'),
(3, 4, 'EMP003', 'Lê Minh Cường', 'male', '1986-03-10', '0903456789', 'manager.sales@hrm.com', '789 Đường Hai Bà Trưng, Quận 3, TP.HCM', NULL, 3, 6, '2025-01-01', 'fulltime', NULL, NULL, 23000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-01-01 01:00:00', '2025-11-27 10:11:39', NULL),
(4, 5, 'EMP004', 'Phạm Thị Dung', 'female', '1988-11-25', '0904567890', 'manager.acc@hrm.com', '321 Đường Lý Tự Trọng, Quận 1, TP.HCM', NULL, 4, 8, '2025-01-01', 'fulltime', NULL, NULL, 24000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-01-01 01:00:00', '2025-11-27 10:11:39', NULL),
(5, 6, 'EMP005', 'Hoàng Văn Dũng', 'male', '1989-07-18', '0905678901', 'manager.mkt@hrm.com', '654 Đường Pasteur, Quận 3, TP.HCM', NULL, 5, 10, '2025-01-01', 'fulltime', NULL, NULL, 22000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-01-01 01:00:00', '2025-11-27 10:11:39', NULL),
(6, 7, 'EMP006', 'Võ Thị Hà', 'female', '1992-01-15', '0906789012', 'dev001@hrm.com', '111 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM', NULL, 1, 2, '2025-01-15', 'fulltime', NULL, NULL, 20000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-01-15 01:00:00', '2025-12-13 20:55:49', 'EMP006/EMP006.jpg'),
(7, 8, 'EMP007', 'Đặng Văn Hùng', 'male', '1993-06-20', '0907890123', 'dev002@hrm.com', '222 Đường 3 Tháng 2, Quận 10, TP.HCM', NULL, 1, 2, '2025-02-01', 'fulltime', NULL, NULL, 20000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-02-01 01:00:00', '2025-11-27 10:11:39', NULL),
(8, 9, 'EMP008', 'Bùi Thị Lan', 'female', '1995-09-08', '0908901234', 'dev003@hrm.com', '333 Đường Điện Biên Phủ, Quận 3, TP.HCM', NULL, 1, 3, '2025-03-01', 'fulltime', NULL, NULL, 12000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-03-01 01:00:00', '2025-11-27 10:11:39', NULL),
(9, 10, 'EMP009', 'Trương Văn Long', 'male', '1991-04-12', '0909012345', 'hr001@hrm.com', '444 Đường Võ Văn Tần, Quận 3, TP.HCM', NULL, 2, 5, '2025-01-20', 'fulltime', NULL, NULL, 10000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-01-20 01:00:00', '2025-11-27 10:11:39', NULL),
(10, 11, 'EMP010', 'Lý Thị Mai', 'female', '1994-12-05', '0900123456', 'hr002@hrm.com', '555 Đường Nam Kỳ Khởi Nghĩa, Quận 1, TP.HCM', NULL, 2, 5, '2025-02-10', 'fulltime', NULL, NULL, 10000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-02-10 01:00:00', '2025-11-27 10:11:39', NULL),
(11, 12, 'EMP011', 'Phan Văn Nam', 'male', '1990-02-28', '0911234567', 'sale001@hrm.com', '666 Đường Trần Hưng Đạo, Quận 5, TP.HCM', NULL, 3, 7, '2025-01-10', 'fulltime', NULL, NULL, 11000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-01-10 01:00:00', '2025-11-27 10:11:39', NULL),
(12, 13, 'EMP012', 'Đinh Thị Oanh', 'female', '1992-08-17', '0912345678', 'sale002@hrm.com', '777 Đường Nguyễn Thị Minh Khai, Quận 3, TP.HCM', NULL, 3, 7, '2025-02-15', 'fulltime', NULL, NULL, 11000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-02-15 01:00:00', '2025-11-27 10:11:39', NULL),
(13, 14, 'EMP013', 'Vũ Văn Phong', 'male', '1991-11-22', '0913456789', 'sale003@hrm.com', '888 Đường Lê Văn Sỹ, Quận Phú Nhuận, TP.HCM', NULL, 3, 7, '2025-03-20', 'fulltime', NULL, NULL, 11000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-03-20 01:00:00', '2025-11-27 10:11:39', NULL),
(14, 15, 'EMP014', 'Ngô Thị Quỳnh', 'female', '1993-05-30', '0914567890', 'acc001@hrm.com', '999 Đường Hoàng Văn Thụ, Quận Tân Bình, TP.HCM', NULL, 4, 9, '2025-01-25', 'fulltime', NULL, NULL, 13000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-01-25 01:00:00', '2025-11-27 10:11:39', NULL),
(15, 16, 'EMP015', 'Hồ Văn Sơn', 'male', '1990-10-14', '0915678901', 'acc002@hrm.com', '1010 Đường Cộng Hòa, Quận Tân Bình, TP.HCM', NULL, 4, 9, '2025-02-20', 'fulltime', NULL, NULL, 13000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-02-20 01:00:00', '2025-11-27 10:11:39', NULL),
(16, 17, 'EMP016', 'Dương Thị Tâm', 'female', '1994-03-25', '0916789012', 'mkt001@hrm.com', '1111 Đường Lạc Long Quân, Quận 11, TP.HCM', NULL, 5, 11, '2025-01-30', 'fulltime', NULL, NULL, 11000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-01-30 01:00:00', '2025-11-27 10:11:39', NULL),
(17, 18, 'EMP017', 'Mai Văn Tùng', 'male', '1992-07-09', '0917890123', 'mkt002@hrm.com', '1212 Đường Âu Cơ, Quận Tân Phú, TP.HCM', NULL, 5, 11, '2025-03-10', 'fulltime', NULL, NULL, 11000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-03-10 01:00:00', '2025-11-27 10:11:39', NULL),
(18, 21, 'EMP018', 'Trần Văn Việt', 'male', '1991-09-19', '0918901234', 'inactive001@hrm.com', '1313 Đường Tân Sơn Nhì, Quận Tân Phú, TP.HCM', NULL, 1, 3, '2025-01-05', 'fulltime', NULL, NULL, 12000000.00, NULL, NULL, NULL, NULL, NULL, 'inactive', NULL, '2025-01-05 01:00:00', '2025-11-27 10:11:39', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `employee_allowances`
--

CREATE TABLE `employee_allowances` (
  `ea_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `allowance_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `employee_allowances`
--

INSERT INTO `employee_allowances` (`ea_id`, `employee_id`, `allowance_id`, `amount`, `start_date`, `end_date`, `is_active`) VALUES
(1, 1, 1, 660000.00, '0000-00-00', NULL, 1),
(2, 2, 1, 660000.00, '0000-00-00', NULL, 1),
(3, 3, 1, 660000.00, '0000-00-00', NULL, 1),
(4, 4, 1, 660000.00, '0000-00-00', NULL, 1),
(5, 5, 1, 660000.00, '0000-00-00', NULL, 1),
(6, 6, 1, 660000.00, '0000-00-00', NULL, 1),
(7, 7, 1, 660000.00, '0000-00-00', NULL, 1),
(8, 8, 1, 660000.00, '0000-00-00', NULL, 1),
(9, 9, 1, 660000.00, '0000-00-00', NULL, 1),
(10, 10, 1, 660000.00, '0000-00-00', NULL, 1),
(11, 11, 1, 660000.00, '0000-00-00', NULL, 1),
(12, 12, 1, 660000.00, '0000-00-00', NULL, 1),
(13, 13, 1, 660000.00, '0000-00-00', NULL, 1),
(14, 14, 1, 660000.00, '0000-00-00', NULL, 1),
(15, 15, 1, 660000.00, '0000-00-00', NULL, 1),
(16, 16, 1, 660000.00, '0000-00-00', NULL, 1),
(17, 17, 1, 660000.00, '0000-00-00', NULL, 1),
(18, 1, 2, 500000.00, '0000-00-00', NULL, 1),
(19, 2, 2, 500000.00, '0000-00-00', NULL, 1),
(20, 3, 2, 500000.00, '0000-00-00', NULL, 1),
(21, 4, 2, 500000.00, '0000-00-00', NULL, 1),
(22, 5, 2, 500000.00, '0000-00-00', NULL, 1),
(23, 11, 2, 500000.00, '0000-00-00', NULL, 1),
(24, 12, 2, 500000.00, '0000-00-00', NULL, 1),
(25, 13, 2, 500000.00, '0000-00-00', NULL, 1),
(26, 1, 3, 200000.00, '0000-00-00', NULL, 1),
(27, 2, 3, 200000.00, '0000-00-00', NULL, 1),
(28, 3, 3, 200000.00, '0000-00-00', NULL, 1),
(29, 4, 3, 200000.00, '0000-00-00', NULL, 1),
(30, 5, 3, 200000.00, '0000-00-00', NULL, 1),
(31, 1, 4, 2000000.00, '0000-00-00', NULL, 1),
(32, 2, 4, 2000000.00, '0000-00-00', NULL, 1),
(33, 3, 4, 2000000.00, '0000-00-00', NULL, 1),
(34, 4, 4, 2000000.00, '0000-00-00', NULL, 1),
(35, 5, 4, 2000000.00, '0000-00-00', NULL, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `employee_documents`
--

CREATE TABLE `employee_documents` (
  `document_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `document_type` enum('degree','certificate','contract','insurance','other') NOT NULL,
  `document_name` varchar(200) NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `face_recognition_logs`
--

CREATE TABLE `face_recognition_logs` (
  `log_id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `employee_code` varchar(20) DEFAULT NULL,
  `action` varchar(50) NOT NULL COMMENT 'check_in, check_out, upload_photo, recognition_attempt',
  `success` tinyint(1) NOT NULL DEFAULT 0,
  `confidence` decimal(5,4) DEFAULT NULL COMMENT 'Recognition confidence (0-1)',
  `image_path` varchar(255) DEFAULT NULL COMMENT 'Path to captured photo during recognition',
  `error_message` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Log of all face recognition activities';

--
-- Đang đổ dữ liệu cho bảng `face_recognition_logs`
--

INSERT INTO `face_recognition_logs` (`log_id`, `employee_id`, `employee_code`, `action`, `success`, `confidence`, `image_path`, `error_message`, `ip_address`, `created_at`) VALUES
(1, NULL, 'EMP006', 'upload_photo', 0, NULL, NULL, 'Lỗi kết nối đến dịch vụ nhận diện: Failed to connect to localhost port 5000 after 2246 ms: Couldn\'t connect to server', '::1', '2025-12-13 20:28:51'),
(2, NULL, 'EMP006', 'upload_photo', 1, NULL, NULL, 'Lưu ảnh thành công', '::1', '2025-12-13 20:29:25'),
(3, NULL, 'EMP006', 'upload_photo', 1, NULL, NULL, 'Lưu ảnh thành công', '::1', '2025-12-13 20:29:50'),
(4, 6, 'EMP006', 'check_in', 1, 0.8206, NULL, '✓ Chấm công VÀO thành công!\nNhân viên: Võ Thị Hà\nMã NV: EMP006\nĐộ tin cậy: 82.1%', '::1', '2025-12-13 20:31:08'),
(5, 6, 'EMP006', 'attendance_check', 0, 0.8261, NULL, 'Lỗi xử lý: combine() argument 2 must be datetime.time, not datetime.timedelta', '::1', '2025-12-13 20:31:54'),
(6, NULL, 'EMP002', 'upload_photo', 0, NULL, NULL, 'Phát hiện nhiều hơn 1 khuôn mặt. Vui lòng chỉ có 1 người trong ảnh', '::1', '2025-12-13 20:37:49'),
(7, NULL, 'EMP002', 'upload_photo', 0, NULL, NULL, 'Phát hiện nhiều hơn 1 khuôn mặt. Vui lòng chỉ có 1 người trong ảnh', '::1', '2025-12-13 20:37:56'),
(8, NULL, 'EMP002', 'upload_photo', 0, NULL, NULL, 'Phát hiện nhiều hơn 1 khuôn mặt. Vui lòng chỉ có 1 người trong ảnh', '::1', '2025-12-13 20:38:10'),
(9, NULL, 'EMP006', 'upload_photo', 1, NULL, NULL, 'Lưu ảnh thành công', '::1', '2025-12-13 20:38:20'),
(10, NULL, 'EMP006', 'upload_photo', 0, NULL, NULL, 'Phát hiện nhiều hơn 1 khuôn mặt. Vui lòng chỉ có 1 người trong ảnh', '::1', '2025-12-13 20:38:35'),
(11, NULL, 'EMP002', 'upload_photo', 0, NULL, NULL, 'Phát hiện nhiều hơn 1 khuôn mặt. Vui lòng chỉ có 1 người trong ảnh', '::1', '2025-12-13 20:38:44'),
(12, NULL, 'EMP002', 'upload_photo', 1, NULL, NULL, 'Lưu ảnh thành công', '::1', '2025-12-13 20:41:35'),
(13, NULL, 'EMP002', 'upload_photo', 0, NULL, NULL, 'Phát hiện nhiều hơn 1 khuôn mặt. Vui lòng chỉ có 1 người trong ảnh', '::1', '2025-12-13 20:41:42'),
(14, NULL, 'EMP002', 'upload_photo', 1, NULL, NULL, 'Lưu ảnh thành công', '::1', '2025-12-13 20:41:48'),
(15, NULL, 'EMP002', 'upload_photo', 0, NULL, NULL, 'Phát hiện nhiều hơn 1 khuôn mặt. Vui lòng chỉ có 1 người trong ảnh', '::1', '2025-12-13 20:41:54'),
(16, NULL, 'EMP002', 'upload_photo', 1, NULL, NULL, 'Lưu ảnh thành công', '::1', '2025-12-13 20:43:02'),
(17, NULL, 'EMP002', 'upload_photo', 0, NULL, NULL, 'Lỗi xác thực ảnh: Face could not be detected in C:\\xampp\\htdocs\\Nhom9\\backend\\face_recognition\\temp\\temp_20251214_034320.jpg.Please confirm that the picture is a face photo or consider to set enforce_detection param to False.', '::1', '2025-12-13 20:43:20'),
(18, NULL, 'EMP002', 'upload_photo', 1, NULL, NULL, 'Lưu ảnh thành công', '::1', '2025-12-13 20:43:36'),
(19, NULL, 'EMP002', 'upload_photo', 1, NULL, NULL, 'Lưu ảnh thành công', '::1', '2025-12-13 20:50:08'),
(20, 2, 'EMP002', 'check_in', 1, 0.8050, NULL, '✓ Chấm công VÀO thành công!\nNhân viên: Trần Thị Bình\nMã NV: EMP002\nĐộ tin cậy: 80.5%', '::1', '2025-12-13 20:52:30'),
(21, NULL, 'EMP006', 'upload_photo', 1, NULL, NULL, 'Lưu ảnh thành công', '::1', '2025-12-13 20:55:49'),
(22, 2, 'EMP002', 'attendance_check', 0, 0.7946, NULL, 'Lỗi xử lý: combine() argument 2 must be datetime.time, not datetime.timedelta', '::1', '2025-12-13 20:56:29'),
(23, 6, 'EMP006', 'check_in', 1, 0.9036, NULL, '✓ Chấm công VÀO thành công!\nNhân viên: Võ Thị Hà\nMã NV: EMP006\nĐộ tin cậy: 90.4%', '::1', '2025-12-13 21:04:50'),
(24, 6, 'EMP006', 'attendance_check', 0, 0.9141, NULL, 'Lỗi xử lý: combine() argument 2 must be datetime.time, not datetime.timedelta', '::1', '2025-12-13 21:07:06'),
(25, 6, 'EMP006', 'check_in', 1, 0.7836, NULL, '✓ Chấm công VÀO thành công!\nNhân viên: Võ Thị Hà\nMã NV: EMP006\nĐộ tin cậy: 78.4%', '::1', '2025-12-13 21:13:16'),
(26, 2, 'EMP002', 'check_in', 1, 0.7490, NULL, '✓ Chấm công VÀO thành công!\nNhân viên: Trần Thị Bình\nMã NV: EMP002\nĐộ tin cậy: 74.9%', '::1', '2025-12-13 21:19:21'),
(27, 2, 'EMP002', 'check_out', 1, 0.7301, NULL, '✓ Chấm công RA thành công!\nNhân viên: Trần Thị Bình\nGiờ làm: 0.1h', '::1', '2025-12-13 21:25:05'),
(28, 2, 'EMP002', 'attendance_check', 0, 0.7359, NULL, 'Nhân viên Trần Thị Bình đã chấm công đủ hôm nay', '::1', '2025-12-13 21:29:18'),
(29, 2, 'EMP002', 'attendance_check', 0, 0.7619, NULL, 'Nhân viên Trần Thị Bình đã chấm công đủ hôm nay', '::1', '2025-12-13 21:29:40'),
(30, 2, 'EMP002', 'attendance_check', 0, 0.7776, NULL, 'Nhân viên Trần Thị Bình đã chấm công đủ hôm nay', '::1', '2025-12-13 21:29:56'),
(31, 2, 'EMP002', 'attendance_check', 0, 0.7532, NULL, 'Nhân viên Trần Thị Bình đã chấm công đủ hôm nay', '::1', '2025-12-13 21:30:04'),
(32, 2, 'EMP002', 'attendance_check', 0, 0.8025, NULL, 'Nhân viên Trần Thị Bình đã chấm công đủ hôm nay', '::1', '2025-12-13 21:30:17'),
(33, 2, 'EMP002', 'attendance_check', 0, 0.7747, NULL, 'Nhân viên Trần Thị Bình đã chấm công đủ hôm nay', '::1', '2025-12-13 21:30:28'),
(34, 6, 'EMP006', 'check_out', 1, 0.7567, NULL, '✓ Chấm công RA thành công!\nNhân viên: Võ Thị Hà\nGiờ làm: 0.3h', '::1', '2025-12-13 21:31:27'),
(35, 6, 'EMP006', 'attendance_check', 0, 0.8409, NULL, 'Nhân viên Võ Thị Hà đã chấm công đủ hôm nay', '::1', '2025-12-13 21:32:02'),
(36, 6, 'EMP006', 'attendance_check', 0, 0.7076, NULL, 'Nhân viên Võ Thị Hà đã chấm công đủ hôm nay', '::1', '2025-12-13 21:32:24'),
(37, 6, 'EMP006', 'attendance_check', 0, 0.9087, NULL, 'Nhân viên Võ Thị Hà đã chấm công đủ hôm nay', '::1', '2025-12-13 21:32:33'),
(38, 6, 'EMP006', 'attendance_check', 0, 0.7656, NULL, 'Nhân viên Võ Thị Hà đã chấm công đủ hôm nay', '::1', '2025-12-13 21:33:20'),
(39, 6, 'EMP006', 'attendance_check', 0, 0.8147, NULL, 'Nhân viên Võ Thị Hà đã chấm công đủ hôm nay', '::1', '2025-12-13 21:33:28'),
(40, 2, 'EMP002', 'check_in', 1, 0.7325, NULL, '✓ Chấm công VÀO thành công!\nNhân viên: Trần Thị Bình\nMã NV: EMP002\nĐộ tin cậy: 73.3%', '::1', '2025-12-13 21:34:29'),
(41, 6, 'EMP006', 'check_in', 1, 0.8788, NULL, '✓ Chấm công VÀO thành công!\nNhân viên: Võ Thị Hà\nMã NV: EMP006\nĐộ tin cậy: 87.9%', '::1', '2025-12-13 21:46:29'),
(42, 6, 'EMP006', 'check_out', 1, 0.8915, NULL, '✓ Chấm công RA thành công!\nNhân viên: Võ Thị Hà\nGiờ làm: 0.1h', '::1', '2025-12-13 21:53:38'),
(43, 6, 'EMP006', 'check_in', 1, 0.9233, NULL, '✓ Chấm công VÀO thành công!\nNhân viên: Võ Thị Hà\nMã NV: EMP006\nĐộ tin cậy: 92.3%', '::1', '2025-12-13 21:57:06'),
(44, 6, 'EMP006', 'check_out', 1, 0.8354, NULL, '✓ Chấm công RA thành công!\nNhân viên: Võ Thị Hà\nGiờ làm: 0.0h', '::1', '2025-12-13 21:57:48');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `leave_balance`
--

CREATE TABLE `leave_balance` (
  `balance_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `leave_type_id` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `total_days` decimal(4,1) DEFAULT 0.0,
  `used_days` decimal(4,1) DEFAULT 0.0,
  `remaining_days` decimal(4,1) DEFAULT 0.0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `leave_balance`
--

INSERT INTO `leave_balance` (`balance_id`, `employee_id`, `leave_type_id`, `year`, `total_days`, `used_days`, `remaining_days`, `updated_at`) VALUES
(57, 6, 1, 2025, 12.0, 2.0, 10.0, '2025-11-27 10:11:39'),
(58, 7, 1, 2025, 12.0, 1.0, 11.0, '2025-11-27 10:11:39'),
(59, 8, 1, 2025, 12.0, 3.0, 6.0, '2025-11-27 10:55:23'),
(60, 9, 1, 2025, 12.0, 0.0, 12.0, '2025-11-27 10:11:39'),
(61, 10, 1, 2025, 12.0, 0.0, 12.0, '2025-11-27 10:11:39'),
(62, 11, 1, 2025, 12.0, 2.0, 10.0, '2025-11-27 10:11:39'),
(63, 12, 1, 2025, 12.0, 3.0, 9.0, '2025-11-27 10:11:39'),
(64, 13, 1, 2025, 12.0, 0.0, 12.0, '2025-11-27 10:11:39'),
(65, 14, 1, 2025, 12.0, 3.0, 9.0, '2025-11-27 10:11:39'),
(66, 15, 1, 2025, 12.0, 0.0, 12.0, '2025-11-27 10:11:39'),
(67, 16, 1, 2025, 12.0, 0.0, 12.0, '2025-11-27 10:11:39'),
(68, 17, 1, 2025, 12.0, 0.0, 12.0, '2025-11-27 10:11:39'),
(69, 11, 2, 2025, 30.0, 2.0, 28.0, '2025-11-27 10:11:39'),
(70, 9, 2, 2025, 30.0, 0.0, 30.0, '2025-11-27 10:11:39'),
(72, 6, 2, 2025, 12.0, 6.0, 3.0, '2025-12-13 17:01:31');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `leave_requests`
--

CREATE TABLE `leave_requests` (
  `leave_request_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `leave_type_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` decimal(3,1) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `leave_requests`
--

INSERT INTO `leave_requests` (`leave_request_id`, `employee_id`, `leave_type_id`, `start_date`, `end_date`, `total_days`, `reason`, `status`, `requested_at`, `reviewed_by`, `reviewed_at`, `review_notes`) VALUES
(1, 6, 1, '2025-11-28', '2025-11-29', 2.0, 'Nghỉ phép năm', 'approved', '2025-11-27 10:11:39', 1, '2025-11-25 03:00:00', NULL),
(2, 11, 2, '2025-11-06', '2025-11-07', 2.0, 'Con bị ốm cần chăm sóc', 'approved', '2025-11-27 10:11:39', 3, '2025-11-05 08:00:00', NULL),
(3, 12, 1, '2025-12-01', '2025-12-03', 3.0, 'Du lịch với gia đình', 'approved', '2025-11-27 10:11:39', 3, '2025-11-26 04:00:00', NULL),
(4, 7, 3, '2025-11-15', '2025-11-15', 1.0, 'Đi khám bệnh định kỳ', 'approved', '2025-11-27 10:11:39', 1, '2025-11-14 09:00:00', NULL),
(5, 14, 1, '2025-12-15', '2025-12-17', 3.0, 'Về quê', 'approved', '2025-11-27 10:11:39', 4, '2025-11-26 07:00:00', NULL),
(6, 8, 1, '2025-12-20', '2025-12-22', 3.0, 'Nghỉ lễ Giáng sinh', 'approved', '2025-11-27 10:11:39', 2, '2025-11-27 10:55:23', 'Approved'),
(7, 9, 2, '2025-12-05', '2025-12-06', 2.0, 'Việc gia đình', 'pending', '2025-11-27 10:11:39', NULL, NULL, NULL),
(8, 13, 1, '2025-12-10', '2025-12-12', 3.0, 'Nghỉ phép năm', 'pending', '2025-11-27 10:11:39', NULL, NULL, NULL),
(9, 16, 4, '2025-11-28', '2025-11-28', 1.0, 'Đám cưới bạn', 'pending', '2025-11-27 10:11:39', NULL, NULL, NULL),
(10, 10, 1, '2025-11-29', '2025-11-30', 2.0, 'Du lịch', 'rejected', '2025-11-27 10:11:39', 2, '2025-11-27 04:00:00', NULL),
(11, 15, 1, '2025-12-01', '2025-12-05', 5.0, 'Nghỉ dài ngày', 'rejected', '2025-11-27 10:11:39', 4, '2025-11-26 09:00:00', NULL),
(12, 6, 2, '2025-12-05', '2025-12-07', 3.0, 'tui bị sốt', 'approved', '2025-12-02 04:11:24', 1, '2025-12-02 04:11:34', 'Approved'),
(13, 6, 2, '2025-12-13', '2025-12-15', 3.0, 'bị sốt ạ', 'approved', '2025-12-13 16:59:05', 1, '2025-12-13 17:01:31', 'Approved');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `leave_types`
--

CREATE TABLE `leave_types` (
  `leave_type_id` int(11) NOT NULL,
  `leave_name` varchar(50) NOT NULL,
  `leave_code` varchar(20) NOT NULL,
  `max_days_per_year` int(11) DEFAULT 12,
  `is_paid` tinyint(1) DEFAULT 1,
  `requires_approval` tinyint(1) DEFAULT 1,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `leave_types`
--

INSERT INTO `leave_types` (`leave_type_id`, `leave_name`, `leave_code`, `max_days_per_year`, `is_paid`, `requires_approval`, `description`, `created_at`) VALUES
(1, 'Phép năm', 'ANNUAL', 12, 1, 1, NULL, '2025-11-23 05:57:36'),
(2, 'Nghỉ ốm', 'SICK', 30, 1, 1, NULL, '2025-11-23 05:57:36'),
(3, 'Nghỉ không lương', 'UNPAID', 365, 0, 1, NULL, '2025-11-23 05:57:36'),
(4, 'Nghỉ thai sản', 'MATERNITY', 180, 1, 1, NULL, '2025-11-23 05:57:36'),
(5, 'Nghỉ việc riêng', 'PERSONAL', 5, 1, 1, NULL, '2025-11-23 05:57:36');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','warning','success','error') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `link` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `type`, `is_read`, `link`, `created_at`) VALUES
(1, 1, 'Chào mừng!', 'Chào mừng bạn đến với hệ thống HRM!', 'info', 1, NULL, '2025-11-27 10:11:39'),
(2, 2, 'Đơn nghỉ phép mới', 'Nhân viên EMP006 đã gửi đơn xin nghỉ phép', 'warning', 1, NULL, '2025-11-27 10:11:39'),
(3, 3, 'Đơn nghỉ phép mới', 'Nhân viên EMP011 đã gửi đơn xin nghỉ phép', 'warning', 0, NULL, '2025-11-27 10:11:39'),
(4, 7, 'Đơn được duyệt', 'Đơn nghỉ phép của bạn đã được phê duyệt', 'success', 1, NULL, '2025-11-27 10:11:39'),
(5, 12, 'Đơn được duyệt', 'Đơn nghỉ phép của bạn đã được phê duyệt', 'success', 0, NULL, '2025-11-27 10:11:39'),
(6, 10, 'Đơn bị từ chối', 'Đơn nghỉ phép của bạn đã bị từ chối', 'error', 0, NULL, '2025-11-27 10:11:39'),
(7, 1, 'User mới đăng ký', 'User newuser001 đã đăng ký tài khoản', 'info', 1, NULL, '2025-11-27 10:11:39'),
(8, 1, 'User mới đăng ký', 'User newuser002 đã đăng ký tài khoản', 'info', 1, NULL, '2025-11-27 10:11:39'),
(9, 7, 'Bảng lương tháng 10', 'Bảng lương tháng 10/2025 đã được thanh toán', 'success', 1, NULL, '2025-11-27 10:11:39'),
(10, 12, 'Bảng lương tháng 10', 'Bảng lương tháng 10/2025 đã được thanh toán', 'success', 1, NULL, '2025-11-27 10:11:39');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payroll`
--

CREATE TABLE `payroll` (
  `payroll_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `payroll_month` int(11) NOT NULL,
  `payroll_year` int(11) NOT NULL,
  `base_salary` decimal(12,2) DEFAULT 0.00,
  `total_allowances` decimal(12,2) DEFAULT 0.00,
  `overtime_pay` decimal(12,2) DEFAULT 0.00,
  `gross_salary` decimal(12,2) DEFAULT 0.00 COMMENT 'Tổng lương trước khấu trừ',
  `total_deductions` decimal(12,2) DEFAULT 0.00,
  `insurance_deduction` decimal(12,2) DEFAULT 0.00,
  `tax_deduction` decimal(12,2) DEFAULT 0.00,
  `net_salary` decimal(12,2) DEFAULT 0.00,
  `work_days` decimal(4,1) DEFAULT 0.0,
  `actual_work_days` decimal(4,1) DEFAULT 0.0 COMMENT 'Số ngày công thực tế',
  `overtime_hours` decimal(6,2) DEFAULT 0.00,
  `status` enum('pending','approved','need_review','revised','paid') DEFAULT 'pending',
  `payment_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `payroll`
--

INSERT INTO `payroll` (`payroll_id`, `employee_id`, `payroll_month`, `payroll_year`, `base_salary`, `total_allowances`, `overtime_pay`, `gross_salary`, `total_deductions`, `insurance_deduction`, `tax_deduction`, `net_salary`, `work_days`, `actual_work_days`, `overtime_hours`, `status`, `payment_date`, `notes`, `admin_notes`, `approved_at`, `paid_at`, `created_at`, `updated_at`, `created_by`) VALUES
(83, 2, 12, 2025, 22000000.00, 3360000.00, 0.00, 25360000.00, 4510000.00, 0.00, 0.00, 20850000.00, 26.0, 26.0, 0.00, 'paid', NULL, NULL, NULL, '2025-12-13 18:56:07', '2025-12-13 19:05:22', '2025-12-13 18:45:12', '2025-12-13 19:05:22', NULL),
(84, 3, 12, 2025, 23000000.00, 3360000.00, 2000000.00, 26360000.00, 4715000.00, 0.00, 0.00, 23645000.00, 26.0, 26.0, 0.00, 'paid', NULL, 'chưa đủ', '', '2025-12-13 19:12:14', '2025-12-13 19:12:19', '2025-12-13 18:45:12', '2025-12-13 19:12:19', NULL),
(85, 4, 12, 2025, 24000000.00, 3360000.00, 0.00, 27360000.00, 4920000.00, 0.00, 0.00, 22440000.00, 26.0, 26.0, 0.00, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-12-13 18:45:12', '2025-12-13 18:55:21', NULL),
(86, 5, 12, 2025, 22000000.00, 3360000.00, 0.00, 25360000.00, 4510000.00, 0.00, 0.00, 20850000.00, 26.0, 26.0, 0.00, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-12-13 18:45:12', '2025-12-13 18:55:21', NULL),
(88, 7, 12, 2025, 20000000.00, 660000.00, 0.00, 20660000.00, 4100000.00, 0.00, 0.00, 16560000.00, 26.0, 26.0, 0.00, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-12-13 18:45:12', '2025-12-13 18:55:21', NULL),
(89, 8, 12, 2025, 12000000.00, 660000.00, 0.00, 12660000.00, 2460000.00, 0.00, 0.00, 10200000.00, 26.0, 26.0, 0.00, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-12-13 18:45:12', '2025-12-13 18:55:21', NULL),
(90, 9, 12, 2025, 10000000.00, 660000.00, 0.00, 10660000.00, 2050000.00, 0.00, 0.00, 8610000.00, 26.0, 26.0, 0.00, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-12-13 18:45:12', '2025-12-13 18:55:21', NULL),
(91, 10, 12, 2025, 10000000.00, 660000.00, 0.00, 10660000.00, 2050000.00, 0.00, 0.00, 8610000.00, 26.0, 26.0, 0.00, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-12-13 18:45:12', '2025-12-13 18:55:21', NULL),
(92, 11, 12, 2025, 11000000.00, 1160000.00, 0.00, 12160000.00, 2255000.00, 0.00, 0.00, 9905000.00, 26.0, 26.0, 0.00, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-12-13 18:45:12', '2025-12-13 18:55:21', NULL),
(93, 12, 12, 2025, 11000000.00, 1160000.00, 0.00, 12160000.00, 2255000.00, 0.00, 0.00, 9905000.00, 26.0, 26.0, 0.00, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-12-13 18:45:12', '2025-12-13 18:55:21', NULL),
(94, 13, 12, 2025, 11000000.00, 1160000.00, 0.00, 12160000.00, 2255000.00, 0.00, 0.00, 9905000.00, 26.0, 26.0, 0.00, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-12-13 18:45:12', '2025-12-13 18:55:21', NULL),
(95, 14, 12, 2025, 13000000.00, 660000.00, 0.00, 13660000.00, 2665000.00, 0.00, 0.00, 10995000.00, 26.0, 26.0, 0.00, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-12-13 18:45:12', '2025-12-13 18:55:21', NULL),
(96, 15, 12, 2025, 13000000.00, 660000.00, 0.00, 13660000.00, 2665000.00, 0.00, 0.00, 10995000.00, 26.0, 26.0, 0.00, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-12-13 18:45:12', '2025-12-13 18:55:21', NULL),
(97, 16, 12, 2025, 11000000.00, 660000.00, 0.00, 11660000.00, 2255000.00, 0.00, 0.00, 9405000.00, 26.0, 26.0, 0.00, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-12-13 18:45:12', '2025-12-13 18:55:21', NULL),
(98, 17, 12, 2025, 11000000.00, 660000.00, 0.00, 11660000.00, 2255000.00, 0.00, 0.00, 9405000.00, 26.0, 26.0, 0.00, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-12-13 18:45:12', '2025-12-13 18:55:21', NULL),
(99, 6, 12, 2025, 20000000.00, 660000.00, 0.00, 20660000.00, 4100000.00, 0.00, 0.00, 16560000.00, 26.0, 26.0, 0.00, 'paid', NULL, 'sai phụ cấp', 'đúng rồi nha nhân viên ơi', '2025-12-13 19:02:52', '2025-12-13 19:05:35', '2025-12-13 18:45:53', '2025-12-13 19:05:35', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `positions`
--

CREATE TABLE `positions` (
  `position_id` int(11) NOT NULL,
  `position_name` varchar(100) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `base_salary` decimal(12,2) DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `positions`
--

INSERT INTO `positions` (`position_id`, `position_name`, `department_id`, `base_salary`, `description`, `created_at`) VALUES
(1, 'Trưởng phòng IT', 1, 25000000.00, 'Quản lý phòng Kỹ Thuật', '2025-01-01 01:00:00'),
(2, 'Senior Developer', 1, 20000000.00, 'Lập trình viên cấp cao', '2025-01-01 01:00:00'),
(3, 'Junior Developer', 1, 12000000.00, 'Lập trình viên', '2025-01-01 01:00:00'),
(4, 'Trưởng phòng Nhân sự', 2, 22000000.00, 'Quản lý phòng Nhân sự', '2025-01-01 01:00:00'),
(5, 'Nhân viên Nhân sự', 2, 10000000.00, 'Nhân viên tuyển dụng và quản lý hồ sơ', '2025-01-01 01:00:00'),
(6, 'Trưởng phòng Kinh doanh', 3, 23000000.00, 'Quản lý phòng Kinh doanh', '2025-01-01 01:00:00'),
(7, 'Nhân viên Kinh doanh', 3, 11000000.00, 'Nhân viên bán hàng', '2025-01-01 01:00:00'),
(8, 'Trưởng phòng Kế toán', 4, 24000000.00, 'Quản lý phòng Kế toán', '2025-01-01 01:00:00'),
(9, 'Kế toán viên', 4, 13000000.00, 'Nhân viên kế toán', '2025-01-01 01:00:00'),
(10, 'Trưởng phòng Marketing', 5, 22000000.00, 'Quản lý phòng Marketing', '2025-01-01 01:00:00'),
(11, 'Nhân viên Marketing', 5, 11000000.00, 'Nhân viên marketing', '2025-01-01 01:00:00'),
(12, 'Giám đốc', NULL, 40000000.00, 'Giám đốc công ty', '2025-01-01 01:00:00'),
(13, 'Phó Giám đốc', NULL, 35000000.00, 'Phó Giám đốc công ty', '2025-01-01 01:00:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `salary_history`
--

CREATE TABLE `salary_history` (
  `history_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `old_salary` decimal(12,2) DEFAULT NULL,
  `new_salary` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `changed_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `salary_history`
--

INSERT INTO `salary_history` (`history_id`, `employee_id`, `old_salary`, `new_salary`, `effective_date`, `reason`, `notes`, `changed_by`, `created_at`) VALUES
(1, 6, 18000000.00, 20000000.00, '2025-06-01', 'Tăng lương định kỳ', NULL, 1, '2025-11-27 10:11:39'),
(2, 11, 10000000.00, 11000000.00, '2025-07-01', 'Tăng lương theo hiệu suất', NULL, 3, '2025-11-27 10:11:39'),
(3, 14, 12000000.00, 13000000.00, '2025-08-01', 'Tăng lương theo năng lực', NULL, 4, '2025-11-27 10:11:39');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','manager','employee') DEFAULT 'employee',
  `status` enum('pending','active','inactive','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password_hash`, `role`, `status`, `created_at`, `updated_at`, `last_login`) VALUES
(1, 'admin', 'admin@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'admin', 'active', '2025-01-01 01:00:00', '2025-12-13 20:52:44', '2025-12-13 20:52:44'),
(2, 'manager_it', 'manager.it@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'manager', 'active', '2025-01-01 01:00:00', '2025-12-13 19:29:03', '2025-12-13 19:29:03'),
(3, 'manager_hr', 'manager.hr@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'manager', 'active', '2025-01-01 01:00:00', '2025-12-13 21:34:42', '2025-12-13 21:34:42'),
(4, 'manager_sales', 'manager.sales@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'manager', 'active', '2025-01-01 01:00:00', '2025-12-13 19:08:27', '2025-12-13 19:08:27'),
(5, 'manager_acc', 'manager.acc@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'manager', 'active', '2025-01-01 01:00:00', '2025-12-13 16:01:02', NULL),
(6, 'manager_mkt', 'manager.mkt@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'manager', 'active', '2025-01-01 01:00:00', '2025-12-13 21:59:33', NULL),
(7, 'dev001', 'dev001@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-01-15 01:00:00', '2025-12-13 21:56:54', '2025-12-13 21:56:54'),
(8, 'dev002', 'dev002@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-02-01 01:00:00', '2025-12-13 21:59:37', NULL),
(9, 'dev003', 'dev003@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-03-01 01:00:00', '2025-12-13 21:59:39', NULL),
(10, 'hr001', 'hr001@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-01-20 01:00:00', '2025-12-13 21:59:41', NULL),
(11, 'hr002', 'hr002@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-02-10 01:00:00', '2025-12-13 21:59:44', NULL),
(12, 'sale001', 'sale001@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-01-10 01:00:00', '2025-12-13 21:59:46', NULL),
(13, 'sale002', 'sale002@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-02-15 01:00:00', '2025-12-13 21:59:48', NULL),
(14, 'sale003', 'sale003@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-03-20 01:00:00', '2025-12-13 21:59:50', NULL),
(15, 'acc001', 'acc001@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-01-25 01:00:00', '2025-12-13 21:59:53', NULL),
(16, 'acc002', 'acc002@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-02-20 01:00:00', '2025-12-13 21:59:57', NULL),
(17, 'mkt001', 'mkt001@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-01-30 01:00:00', '2025-12-13 21:59:59', NULL),
(18, 'mkt002', 'mkt002@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-03-10 01:00:00', '2025-12-13 22:00:05', NULL),
(19, 'newuser001', 'newuser001@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'pending', '2025-11-25 01:00:00', '2025-12-13 22:00:08', NULL),
(20, 'newuser002', 'newuser002@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'pending', '2025-11-26 01:00:00', '2025-12-13 22:00:10', NULL),
(21, 'inactive001', 'inactive001@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'inactive', '2025-01-05 01:00:00', '2025-12-13 22:00:12', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `work_shifts`
--

CREATE TABLE `work_shifts` (
  `shift_id` int(11) NOT NULL,
  `shift_name` varchar(50) NOT NULL,
  `shift_code` varchar(20) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `break_duration` int(11) DEFAULT 60 COMMENT 'minutes',
  `shift_type` enum('morning','afternoon','night','overtime') DEFAULT 'morning',
  `coefficient` decimal(3,2) DEFAULT 1.00 COMMENT 'salary multiplier',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `work_shifts`
--

INSERT INTO `work_shifts` (`shift_id`, `shift_name`, `shift_code`, `start_time`, `end_time`, `break_duration`, `shift_type`, `coefficient`, `is_active`, `created_at`) VALUES
(1, 'Ca sáng', 'MORNING', '08:00:00', '17:00:00', 60, 'morning', 1.00, 1, '2025-11-23 05:57:36'),
(2, 'Ca chiều', 'AFTERNOON', '13:00:00', '22:00:00', 60, 'afternoon', 1.10, 1, '2025-11-23 05:57:36'),
(3, 'Ca đêm', 'NIGHT', '22:00:00', '06:00:00', 60, 'night', 1.30, 1, '2025-11-23 05:57:36'),
(4, 'Tăng ca', 'OVERTIME', '18:00:00', '22:00:00', 60, 'overtime', 1.50, 1, '2025-11-23 05:57:36');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_table` (`table_name`),
  ADD KEY `idx_created` (`created_at`);

--
-- Chỉ mục cho bảng `allowances`
--
ALTER TABLE `allowances`
  ADD PRIMARY KEY (`allowance_id`),
  ADD UNIQUE KEY `allowance_code` (`allowance_code`);

--
-- Chỉ mục cho bảng `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD UNIQUE KEY `unique_attendance` (`employee_id`,`attendance_date`,`shift_id`),
  ADD KEY `shift_id` (`shift_id`),
  ADD KEY `idx_employee_date` (`employee_id`,`attendance_date`),
  ADD KEY `idx_date` (`attendance_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_check_in_photo` (`check_in_photo`),
  ADD KEY `idx_check_out_photo` (`check_out_photo`);

--
-- Chỉ mục cho bảng `deductions`
--
ALTER TABLE `deductions`
  ADD PRIMARY KEY (`deduction_id`),
  ADD UNIQUE KEY `deduction_code` (`deduction_code`);

--
-- Chỉ mục cho bảng `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`department_id`),
  ADD UNIQUE KEY `department_code` (`department_code`),
  ADD KEY `idx_code` (`department_code`),
  ADD KEY `manager_id` (`manager_id`);

--
-- Chỉ mục cho bảng `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`employee_id`),
  ADD UNIQUE KEY `employee_code` (`employee_code`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `position_id` (`position_id`),
  ADD KEY `idx_code` (`employee_code`),
  ADD KEY `idx_dept` (`department_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_name` (`full_name`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_face_photo` (`face_photo`);

--
-- Chỉ mục cho bảng `employee_allowances`
--
ALTER TABLE `employee_allowances`
  ADD PRIMARY KEY (`ea_id`),
  ADD KEY `allowance_id` (`allowance_id`),
  ADD KEY `idx_employee` (`employee_id`),
  ADD KEY `idx_active` (`is_active`);

--
-- Chỉ mục cho bảng `employee_documents`
--
ALTER TABLE `employee_documents`
  ADD PRIMARY KEY (`document_id`),
  ADD KEY `idx_employee` (`employee_id`),
  ADD KEY `idx_type` (`document_type`);

--
-- Chỉ mục cho bảng `face_recognition_logs`
--
ALTER TABLE `face_recognition_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_employee_code` (`employee_code`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Chỉ mục cho bảng `leave_balance`
--
ALTER TABLE `leave_balance`
  ADD PRIMARY KEY (`balance_id`),
  ADD UNIQUE KEY `unique_balance` (`employee_id`,`leave_type_id`,`year`),
  ADD KEY `leave_type_id` (`leave_type_id`),
  ADD KEY `idx_employee_year` (`employee_id`,`year`);

--
-- Chỉ mục cho bảng `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`leave_request_id`),
  ADD KEY `leave_type_id` (`leave_type_id`),
  ADD KEY `reviewed_by` (`reviewed_by`),
  ADD KEY `idx_employee` (`employee_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_dates` (`start_date`,`end_date`);

--
-- Chỉ mục cho bảng `leave_types`
--
ALTER TABLE `leave_types`
  ADD PRIMARY KEY (`leave_type_id`),
  ADD UNIQUE KEY `leave_code` (`leave_code`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_read` (`is_read`),
  ADD KEY `idx_created` (`created_at`);

--
-- Chỉ mục cho bảng `payroll`
--
ALTER TABLE `payroll`
  ADD PRIMARY KEY (`payroll_id`),
  ADD UNIQUE KEY `unique_payroll` (`employee_id`,`payroll_month`,`payroll_year`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_employee` (`employee_id`),
  ADD KEY `idx_period` (`payroll_year`,`payroll_month`),
  ADD KEY `idx_status` (`status`);

--
-- Chỉ mục cho bảng `positions`
--
ALTER TABLE `positions`
  ADD PRIMARY KEY (`position_id`),
  ADD KEY `idx_dept` (`department_id`);

--
-- Chỉ mục cho bảng `salary_history`
--
ALTER TABLE `salary_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `changed_by` (`changed_by`),
  ADD KEY `idx_employee` (`employee_id`),
  ADD KEY `idx_date` (`effective_date`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_role` (`role`);

--
-- Chỉ mục cho bảng `work_shifts`
--
ALTER TABLE `work_shifts`
  ADD PRIMARY KEY (`shift_id`),
  ADD UNIQUE KEY `shift_code` (`shift_code`),
  ADD KEY `idx_code` (`shift_code`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `allowances`
--
ALTER TABLE `allowances`
  MODIFY `allowance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `attendance`
--
ALTER TABLE `attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT cho bảng `deductions`
--
ALTER TABLE `deductions`
  MODIFY `deduction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `departments`
--
ALTER TABLE `departments`
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `employees`
--
ALTER TABLE `employees`
  MODIFY `employee_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT cho bảng `employee_allowances`
--
ALTER TABLE `employee_allowances`
  MODIFY `ea_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT cho bảng `employee_documents`
--
ALTER TABLE `employee_documents`
  MODIFY `document_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `face_recognition_logs`
--
ALTER TABLE `face_recognition_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT cho bảng `leave_balance`
--
ALTER TABLE `leave_balance`
  MODIFY `balance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- AUTO_INCREMENT cho bảng `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `leave_request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `leave_types`
--
ALTER TABLE `leave_types`
  MODIFY `leave_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT cho bảng `payroll`
--
ALTER TABLE `payroll`
  MODIFY `payroll_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `positions`
--
ALTER TABLE `positions`
  MODIFY `position_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `salary_history`
--
ALTER TABLE `salary_history`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT cho bảng `work_shifts`
--
ALTER TABLE `work_shifts`
  MODIFY `shift_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`shift_id`) REFERENCES `work_shifts` (`shift_id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employees_ibfk_3` FOREIGN KEY (`position_id`) REFERENCES `positions` (`position_id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `employee_allowances`
--
ALTER TABLE `employee_allowances`
  ADD CONSTRAINT `employee_allowances_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employee_allowances_ibfk_2` FOREIGN KEY (`allowance_id`) REFERENCES `allowances` (`allowance_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `employee_documents`
--
ALTER TABLE `employee_documents`
  ADD CONSTRAINT `employee_documents_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `face_recognition_logs`
--
ALTER TABLE `face_recognition_logs`
  ADD CONSTRAINT `face_recognition_logs_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `leave_balance`
--
ALTER TABLE `leave_balance`
  ADD CONSTRAINT `leave_balance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `leave_balance_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`leave_type_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`leave_type_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `leave_requests_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `payroll`
--
ALTER TABLE `payroll`
  ADD CONSTRAINT `payroll_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payroll_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `positions`
--
ALTER TABLE `positions`
  ADD CONSTRAINT `positions_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `salary_history`
--
ALTER TABLE `salary_history`
  ADD CONSTRAINT `salary_history_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `salary_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
