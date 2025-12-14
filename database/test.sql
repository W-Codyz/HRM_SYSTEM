-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1:3307
-- Thời gian đã tạo: Th12 14, 2025 lúc 12:39 PM
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
(13, 14, 'EMP013', 'Vũ Văn Phong', 'male', '1991-11-22', '0913456789', 'sale003@hrm.com', '888 Đường Lê Văn Sỹ, Quận Phú Nhuận, TP.HCM', NULL, 3, 7, '2025-03-20', 'fulltime', NULL, NULL, 11000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-03-20 01:00:00', '2025-12-14 06:22:29', 'EMP013/EMP013.jpg'),
(14, 15, 'EMP014', 'Ngô Thị Quỳnh', 'female', '1993-05-30', '0914567890', 'acc001@hrm.com', '999 Đường Hoàng Văn Thụ, Quận Tân Bình, TP.HCM', NULL, 4, 9, '2025-01-25', 'fulltime', NULL, NULL, 13000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-01-25 01:00:00', '2025-11-27 10:11:39', NULL),
(15, 16, 'EMP015', 'Hồ Văn Sơn', 'male', '1990-10-14', '0915678901', 'acc002@hrm.com', '1010 Đường Cộng Hòa, Quận Tân Bình, TP.HCM', NULL, 4, 9, '2025-02-20', 'fulltime', NULL, NULL, 13000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-02-20 01:00:00', '2025-11-27 10:11:39', NULL),
(16, 17, 'EMP016', 'Dương Thị Tâm', 'female', '1994-03-25', '0916789012', 'mkt001@hrm.com', '1111 Đường Lạc Long Quân, Quận 11, TP.HCM', NULL, 5, 11, '2025-01-30', 'fulltime', NULL, NULL, 11000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-01-30 01:00:00', '2025-11-27 10:11:39', NULL),
(17, 18, 'EMP017', 'Mai Văn Tùng', 'male', '1992-07-09', '0917890123', 'mkt002@hrm.com', '1212 Đường Âu Cơ, Quận Tân Phú, TP.HCM', NULL, 5, 11, '2025-03-10', 'fulltime', NULL, NULL, 11000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-03-10 01:00:00', '2025-11-27 10:11:39', NULL),
(18, 21, 'EMP018', 'Trần Văn Việt', 'male', '1991-09-19', '0918901234', 'inactive001@hrm.com', '1313 Đường Tân Sơn Nhì, Quận Tân Phú, TP.HCM', NULL, 1, 3, '2025-01-05', 'fulltime', NULL, NULL, 12000000.00, NULL, NULL, NULL, NULL, NULL, 'inactive', NULL, '2025-01-05 01:00:00', '2025-11-27 10:11:39', NULL),
(19, 23, 'DM001', 'Lê Duy Mạnh', 'male', '2005-09-15', '1234567890', 'duymanh@gmail.com', '19/4b Tân Chánh Hiệp 25', NULL, 1, 2, '2025-12-14', 'fulltime', NULL, NULL, 22000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-12-14 10:50:50', '2025-12-14 10:51:43', NULL),
(20, 24, 'DP001', 'Đặng Thành Đình Phát', 'male', '2005-09-15', '4343', 'ddinhphat9@gmail.com', '19/4b Tân Chánh Hiệp 25', NULL, 4, 12, '2025-12-15', 'fulltime', NULL, NULL, 40000000.00, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2025-12-14 11:37:31', '2025-12-14 11:37:31', NULL);

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
(1, 'admin', 'admin@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'admin', 'active', '2025-01-01 01:00:00', '2025-12-14 10:46:48', '2025-12-14 10:46:48'),
(2, 'manager_it', 'manager.it@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'manager', 'active', '2025-01-01 01:00:00', '2025-12-14 11:12:06', '2025-12-14 11:12:06'),
(3, 'manager_hr', 'manager.hr@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'manager', 'active', '2025-01-01 01:00:00', '2025-12-14 07:20:53', '2025-12-14 07:20:53'),
(4, 'manager_sales', 'manager.sales@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'manager', 'active', '2025-01-01 01:00:00', '2025-12-13 19:08:27', '2025-12-13 19:08:27'),
(5, 'manager_acc', 'manager.acc@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'manager', 'active', '2025-01-01 01:00:00', '2025-12-13 16:01:02', NULL),
(6, 'manager_mkt', 'manager.mkt@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'manager', 'active', '2025-01-01 01:00:00', '2025-12-13 21:59:33', NULL),
(7, 'dev001', 'dev001@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'manager', 'active', '2025-01-15 01:00:00', '2025-12-14 11:25:56', '2025-12-14 11:25:56'),
(8, 'dev002', 'dev002@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-02-01 01:00:00', '2025-12-13 21:59:37', NULL),
(9, 'dev003', 'dev003@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-03-01 01:00:00', '2025-12-13 21:59:39', NULL),
(10, 'hr001', 'hr001@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-01-20 01:00:00', '2025-12-13 21:59:41', NULL),
(11, 'hr002', 'hr002@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-02-10 01:00:00', '2025-12-13 21:59:44', NULL),
(12, 'sale001', 'sale001@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-01-10 01:00:00', '2025-12-14 11:22:36', NULL),
(14, 'sale003', 'sale003@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'admin', 'active', '2025-03-20 01:00:00', '2025-12-14 10:48:39', '2025-12-14 10:48:39'),
(15, 'acc001', 'acc001@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-01-25 01:00:00', '2025-12-13 21:59:53', NULL),
(16, 'acc002', 'acc002@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-02-20 01:00:00', '2025-12-13 21:59:57', NULL),
(17, 'mkt001', 'mkt001@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-01-30 01:00:00', '2025-12-13 21:59:59', NULL),
(18, 'mkt002', 'mkt002@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'active', '2025-03-10 01:00:00', '2025-12-14 08:30:25', NULL),
(21, 'inactive001', 'inactive001@hrm.com', '$2a$12$pamzEdvM8YJmAXbGCeE2N.d.MKIeNlXcY0yPuUl6U1WAh.8IRtiOy', 'employee', 'inactive', '2025-01-05 01:00:00', '2025-12-13 22:00:12', NULL),
(23, 'manh', 'duymanh@gmail.com', '$2y$10$gSOCim6asnuisWg0Xc/nSOekteWPmSRiqKXW/7Vm4IP00gExyQeRG', 'employee', 'active', '2025-12-14 10:50:50', '2025-12-14 11:25:13', '2025-12-14 11:25:13'),
(24, 'dinhphat', 'ddinhphat9@gmail.com', '$2y$10$xNFr7l0hfw/qShpkBnHCv.B8DknhybK44U8GtWBCiusDq68EHvAei', 'employee', 'active', '2025-12-14 11:37:31', '2025-12-14 11:37:48', '2025-12-14 11:37:48');

--
-- Chỉ mục cho các bảng đã đổ
--

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
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `employees`
--
ALTER TABLE `employees`
  MODIFY `employee_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employees_ibfk_3` FOREIGN KEY (`position_id`) REFERENCES `positions` (`position_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
