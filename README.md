<div align="center">

# 🏢 HỆ THỐNG QUẢN LÝ NHÂN SỰ (HRM SYSTEM)

### *Human Resource Management System with AI Face Recognition*

[![PHP](https://img.shields.io/badge/PHP-7.4+-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://www.php.net/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 📋 Giới thiệu

Hệ thống Quản lý Nhân sự (HRM) là một ứng dụng web toàn diện giúp doanh nghiệp quản lý toàn bộ vòng đời nhân viên từ tuyển dụng, chấm công, tính lương, nghỉ phép đến khi nghỉ việc. 

**Điểm nổi bật:** Tích hợp **công nghệ AI nhận diện khuôn mặt (Face Recognition)** sử dụng DeepFace và TensorFlow để chấm công tự động, giúp tăng cường bảo mật và hiện đại hóa quy trình quản lý.

### ✨ Tính năng chính

- 🔐 **Xác thực & Phân quyền**: JWT Authentication với 3 vai trò (Admin, Manager, Employee)
- 👥 **Quản lý Nhân viên**: CRUD nhân viên, phòng ban, chức vụ
- 📸 **Chấm công AI**: Nhận diện khuôn mặt tự động với độ chính xác cao
- ⏰ **Quản lý Chấm công**: Theo dõi giờ vào/ra, làm thêm giờ, đi muộn, về sớm
- 🏖️ **Quản lý Nghỉ phép**: Đơn xin nghỉ, duyệt phép, theo dõi số ngày còn lại
- 💰 **Quản lý Lương**: Tính lương tự động, phụ cấp, khấu trừ bảo hiểm, thuế
- 📊 **Dashboard & Báo cáo**: Thống kê trực quan với Chart.js
- 🔔 **Thông báo realtime**: Cập nhật thông báo theo thời gian thực

---

## 👥 Nhóm phát triển

<table align="center">
<tr>
<td align="center">
<strong>Lê Duy Mạnh</strong><br/>
<sub>MSSV: 052205008936</sub>
</td>
<td align="center">
<strong>Huỳnh Cao Đức</strong><br/>
<sub>MSSV: 052205004871</sub>
</td>
</tr>
<tr>
<td align="center">
<strong>Đặng Thành Đình Phát</strong><br/>
<sub>MSSV: 052205008286</sub>
</td>
<td align="center">
<strong>Lê Thành Phú</strong><br/>
<sub>MSSV: 052205011458</sub>
</td>
</tr>
</table>

---

## 🚀 Công nghệ sử dụng

### Backend (PHP)
- **PHP 7.4+** - Server-side scripting language
- **MySQL 5.7+** - Relational database management system
- **Firebase JWT 6.0** - JSON Web Token authentication
- **Composer** - Dependency management
- **RESTful API** - API architecture pattern

### Frontend (React)
- **React 18.2** - JavaScript library for building UI
- **React Router DOM** - Client-side routing
- **Axios** - Promise-based HTTP client
- **TailwindCSS 3.0** - Utility-first CSS framework
- **Chart.js** - JavaScript charting library
- **React Icons** - Popular icons library
- **React Toastify** - Toast notification library

### Face Recognition System (Python + AI)
- **Python 3.8+** - Programming language
- **DeepFace 0.0.92** - Facial recognition framework
- **TensorFlow 2.17.1** - Machine learning framework
- **OpenCV 4.10** - Computer vision library
- **Flask 3.0.3** - Lightweight web framework
- **Flask-CORS 5.0** - Cross-Origin Resource Sharing
- **Pillow 10.4** - Python imaging library
- **MySQL Connector 8.2** - MySQL database connector
- **NumPy 1.26** - Numerical computing
- **Pandas 2.2** - Data manipulation

---

## 📦 Cấu trúc dự án

```
Nhom9/
├── 📁 backend/                      # PHP Backend
│   ├── 📁 api/                      # REST API Endpoints
│   │   ├── auth.php                 # Authentication API
│   │   ├── users.php                # User management
│   │   ├── employees.php            # Employee management
│   │   ├── departments.php          # Department management
│   │   ├── positions.php            # Position management
│   │   ├── attendance.php           # Attendance tracking
│   │   ├── leave_requests.php       # Leave request management
│   │   ├── payroll.php              # Payroll processing
│   │   ├── allowances.php           # Allowances management
│   │   ├── deductions.php           # Deductions management
│   │   ├── face_recognition.php     # Face recognition API bridge
│   │   ├── notifications.php        # Notification system
│   │   ├── dashboard.php            # Dashboard statistics
│   │   └── test-cors.php            # CORS testing
│   │
│   ├── 📁 config/                   # Configuration Files
│   │   ├── database.php             # Database connection
│   │   ├── cors.php                 # CORS configuration
│   │   └── jwt.php                  # JWT settings
│   │
│   ├── 📁 helpers/                  # Helper Classes
│   │   ├── Response.php             # Standardized API responses
│   │   └── Validator.php            # Input validation utilities
│   │
│   ├── 📁 middleware/               # Middleware
│   │   └── auth.php                 # JWT authentication middleware
│   │
│   ├── 📁 face_recognition/         # AI Face Recognition Service
│   │   ├── app.py                   # Flask application main
│   │   ├── face_recognition_system.py  # Core face recognition logic
│   │   ├── database.py              # Database operations
│   │   ├── config.py                # Python configuration
│   │   ├── requirements.txt         # Python dependencies
│   │   ├── 📁 employee_photos/      # Employee face registration photos
│   │   ├── 📁 attendance_photos/    # Attendance check-in/out photos
│   │   ├── 📁 temp/                 # Temporary image processing
│   │   ├── 📁 logs/                 # System logs
│   │   └── 📁 __pycache__/          # Python cache
│   │
│   ├── 📁 vendor/                   # Composer Dependencies
│   │   └── firebase/php-jwt/        # JWT library
│   └── composer.json                # PHP dependencies manifest
│
├── 📁 frontend/                     # React Frontend
│   ├── 📁 public/                   # Public Static Files
│   │   ├── index.html               # HTML template
│   │   └── manifest.json            # PWA manifest
│   │
│   ├── 📁 src/                      # Source Code
│   │   ├── 📁 components/           # React Components
│   │   │   ├── AdminLayout.js       # Admin layout wrapper
│   │   │   ├── ManagerLayout.js     # Manager layout wrapper
│   │   │   ├── EmployeeLayout.js    # Employee layout wrapper
│   │   │   └── NotificationsPanel.js # Notification component
│   │   │
│   │   ├── 📁 context/              # React Context API
│   │   │   └── AuthContext.js       # Authentication context
│   │   │
│   │   ├── 📁 pages/                # Page Components
│   │   │   ├── 📁 auth/             # Authentication Pages
│   │   │   │   └── Login.js         # Login page
│   │   │   │
│   │   │   ├── 📁 admin/            # Admin Pages
│   │   │   │   ├── Dashboard.js     # Admin dashboard
│   │   │   │   ├── Employees.js     # Employee management
│   │   │   │   ├── Users.js         # User management
│   │   │   │   ├── Attendance.js    # Attendance records
│   │   │   │   ├── LeaveRequests.js # Leave request approvals
│   │   │   │   ├── Payroll.js       # Payroll management
│   │   │   │   └── ...              # More admin pages
│   │   │   │
│   │   │   ├── 📁 manager/          # Manager Pages
│   │   │   │   └── Dashboard.js     # Manager dashboard
│   │   │   │
│   │   │   └── 📁 employee/         # Employee Pages
│   │   │       ├── Dashboard.js     # Employee dashboard
│   │   │       ├── FaceAttendance.js # AI face check-in/out
│   │   │       ├── MyAttendance.js  # Personal attendance
│   │   │       └── ...              # More employee pages
│   │   │
│   │   ├── 📁 services/             # API Services
│   │   │   └── api.js               # Axios configuration & API calls
│   │   │
│   │   ├── App.js                   # Main application component
│   │   ├── index.js                 # Application entry point
│   │   └── index.css                # Global styles with Tailwind
│   │
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   └── postcss.config.js            # PostCSS configuration
│
└── 📁 database/                     # Database
    └── hrm_system.sql               # MySQL database schema & sample data
```

---

## 🔧 Hướng dẫn cài đặt

### ⚙️ Yêu cầu hệ thống

- **XAMPP** (Apache 2.4+ + MySQL 5.7+ + PHP 7.4+)
- **Node.js 14+** và **npm** hoặc **yarn**
- **Python 3.8+** và **pip**
- **Composer** (PHP package manager)
- **Webcam** (cho tính năng nhận diện khuôn mặt)
- **4GB RAM** (tối thiểu cho TensorFlow)

---

### 1️⃣ Cài đặt Database

#### **Phương pháp 1: Sử dụng phpMyAdmin (Khuyến nghị)**

1. Khởi động XAMPP và bật **Apache** + **MySQL**
2. Mở trình duyệt, truy cập: `http://localhost/phpmyadmin`
3. Tạo database mới:
   - Click **"New"** ở sidebar
   - Nhập tên database: `hrm_system`
   - Collation: `utf8mb4_unicode_ci`
   - Click **"Create"**
4. Import dữ liệu:
   - Click vào database `hrm_system` vừa tạo
   - Chọn tab **"Import"**
   - Click **"Choose File"** và chọn file `database/hrm_system.sql`
   - Click **"Go"** để import

#### **Phương pháp 2: MySQL Command Line**

```bash
# Mở MySQL Command Line hoặc Terminal
mysql -u root -p

# Tạo database
CREATE DATABASE hrm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Sử dụng database
USE hrm_system;

# Import file SQL (thay đổi đường dẫn phù hợp)
SOURCE C:/xampp/htdocs/Nhom9/database/hrm_system.sql;

# Hoặc từ command line
mysql -u root -p hrm_system < C:/xampp/htdocs/Nhom9/database/hrm_system.sql
```

---

### 2️⃣ Cài đặt Backend (PHP)

```bash
# Di chuyển vào thư mục backend
cd C:\xampp\htdocs\Nhom9\backend

# Cài đặt PHP dependencies bằng Composer
composer install

# Nếu chưa có Composer, download tại: https://getcomposer.org/
# Hoặc cài đặt thủ công firebase/php-jwt:
composer require firebase/php-jwt
```

#### **Cấu hình Database**

Mở file `backend/config/database.php` và kiểm tra thông tin kết nối:

```php
private $host = "localhost";
private $port = "3307";  // Thay đổi nếu MySQL chạy port khác
private $db_name = "hrm_system";
private $username = "root";
private $password = "";  // Mật khẩu MySQL (mặc định rỗng trên XAMPP)
```

---

### 3️⃣ Cài đặt Face Recognition Service (Python)

```bash
# Di chuyển vào thư mục face recognition
cd C:\xampp\htdocs\Nhom9\backend\face_recognition

# Tạo virtual environment (khuyến nghị)
Remove-Item -Recurse -Force venv

py -3.11 -m venv venv

# 4. Activate the new environment
.\venv\Scripts\Activate

# Kích hoạt virtual environment
# Windows:
venv\Scripts\activate

# Cài đặt Python dependencies
pip install -r requirements.txt

# Nếu gặp lỗi với TensorFlow, thử:
pip install tensorflow-cpu==2.17.1  # Cho máy không có GPU
```

#### **Chạy Face Recognition Service**

```bash
# Trong thư mục backend/face_recognition (với venv đã kích hoạt)
python app.py

# Service sẽ chạy tại: http://localhost:5000
```

**Lưu ý:** Service này cần chạy song song với Apache để tính năng nhận diện khuôn mặt hoạt động.

---

### 4️⃣ Cài đặt Frontend (React)

```bash
# Di chuyển vào thư mục frontend
cd C:\xampp\htdocs\Nhom9\frontend

# Cài đặt Node.js dependencies
npm install

# Hoặc nếu dùng yarn:
yarn install
```

#### **Cấu hình API URL**

Mở file `frontend/src/services/api.js` và kiểm tra:

```javascript
const API_URL = 'http://localhost/Nhom9/backend/api';
// Thay đổi nếu backend ở đường dẫn khác
```

---

### 5️⃣ Chạy ứng dụng

#### **Khởi động Backend (XAMPP)**

1. Mở **XAMPP Control Panel**
2. Start **Apache**
3. Start **MySQL**
4. Kiểm tra backend: `http://localhost/Nhom9/backend/api/test-cors.php`

#### **Khởi động Face Recognition Service**

```bash
cd C:\xampp\htdocs\Nhom9\backend\face_recognition
venv\Scripts\activate  # Windows
python app.py

# Console sẽ hiển thị:
# * Running on http://127.0.0.1:5000
```

#### **Khởi động Frontend**

```bash
cd C:\xampp\htdocs\Nhom9\frontend
npm start

# Ứng dụng sẽ tự động mở tại: http://localhost:3000
```

---

## 👤 Tài khoản kiểm tra (Test Users)

> ⚠️ **Quan trọng:** Tất cả tài khoản đều có mật khẩu là: `123123`

### 🔴 Tài khoản Admin

| Username | Email | Role | Mô tả |
|----------|-------|------|-------|
| `admin` | admin@hrm.com | Admin | Quản trị hệ thống - Toàn quyền |

**Chức năng Admin:**
- ✅ Quản lý toàn bộ hệ thống
- ✅ Quản lý người dùng, phê duyệt tài khoản mới
- ✅ Quản lý nhân viên, phòng ban, chức vụ
- ✅ Xem và quản lý tất cả chấm công
- ✅ Phê duyệt nghỉ phép
- ✅ Quản lý lương, phụ cấp, khấu trừ
- ✅ Cấu hình hệ thống
- ✅ Xem tất cả báo cáo

---

### 🟡 Tài khoản Manager (Quản lý)

| Username | Email | Nhân viên | Phòng ban | Mô tả |
|----------|-------|-----------|-----------|-------|
| `manager_it` | manager.it@hrm.com | Nguyễn Văn An | Phòng Kỹ Thuật | Trưởng phòng IT |
| `manager_hr` | manager.hr@hrm.com | Trần Thị Bình | Phòng Nhân Sự | Trưởng phòng HR |
| `manager_sales` | manager.sales@hrm.com | Lê Minh Cường | Phòng Kinh Doanh | Trưởng phòng Sales |
| `manager_acc` | manager.acc@hrm.com | Phạm Thị Dung | Phòng Kế Toán | Trưởng phòng Kế toán |
| `manager_mkt` | manager.mkt@hrm.com | Hoàng Văn Dũng | Phòng Marketing | Trưởng phòng Marketing |

**Chức năng Manager:**
- ✅ Quản lý nhân viên trong phòng ban
- ✅ Xem chấm công của team
- ✅ Phê duyệt nghỉ phép cho nhân viên
- ✅ Xem báo cáo phòng ban
- ✅ Quản lý thông tin cá nhân

---

### 🟢 Tài khoản Employee (Nhân viên)

#### **Phòng Kỹ Thuật (IT)**

| Username | Email | Họ tên | Chức vụ | Lương cơ bản |
|----------|-------|--------|---------|--------------|
| `dev001` | dev001@hrm.com | Võ Thị Hà | Senior Developer | 20,000,000 VNĐ |
| `dev002` | dev002@hrm.com | Đặng Văn Hùng | Senior Developer | 20,000,000 VNĐ |
| `dev003` | dev003@hrm.com | Bùi Thị Lan | Junior Developer | 12,000,000 VNĐ |

#### **Phòng Nhân Sự (HR)**

| Username | Email | Họ tên | Chức vụ | Lương cơ bản |
|----------|-------|--------|---------|--------------|
| `hr001` | hr001@hrm.com | Trương Văn Long | HR Specialist | 10,000,000 VNĐ |
| `hr002` | hr002@hrm.com | Lý Thị Mai | HR Specialist | 10,000,000 VNĐ |

#### **Phòng Kinh Doanh (Sales)**

| Username | Email | Họ tên | Chức vụ | Lương cơ bản |
|----------|-------|--------|---------|--------------|
| `sale001` | sale001@hrm.com | Phan Văn Nam | Sales Executive | 11,000,000 VNĐ |
| `sale002` | sale002@hrm.com | Đinh Thị Oanh | Sales Executive | 11,000,000 VNĐ |
| `sale003` | sale003@hrm.com | Vũ Văn Phong | Sales Executive | 11,000,000 VNĐ |

#### **Phòng Kế Toán (Accounting)**

| Username | Email | Họ tên | Chức vụ | Lương cơ bản |
|----------|-------|--------|---------|--------------|
| `acc001` | acc001@hrm.com | Ngô Thị Quỳnh | Accountant | 13,000,000 VNĐ |
| `acc002` | acc002@hrm.com | Hồ Văn Sơn | Accountant | 13,000,000 VNĐ |

#### **Phòng Marketing**

| Username | Email | Họ tên | Chức vụ | Lương cơ bản |
|----------|-------|--------|---------|--------------|
| `mkt001` | mkt001@hrm.com | Dương Thị Tâm | Marketing Specialist | 11,000,000 VNĐ |
| `mkt002` | mkt002@hrm.com | Mai Văn Tùng | Marketing Specialist | 11,000,000 VNĐ |

**Chức năng Employee:**
- ✅ Xem thông tin cá nhân
- ✅ Chấm công bằng khuôn mặt (Face Recognition)
- ✅ Xem lịch sử chấm công
- ✅ Gửi đơn xin nghỉ phép
- ✅ Xem bảng lương
- ✅ Cập nhật thông tin cá nhân

---

### 🔵 Tài khoản Test khác

| Username | Email | Trạng thái | Mô tả |
|----------|-------|------------|-------|
| `newuser001` | newuser001@hrm.com | Pending | Tài khoản chờ phê duyệt |
| `newuser002` | newuser002@hrm.com | Pending | Tài khoản chờ phê duyệt |
| `inactive001` | inactive001@hrm.com | Inactive | Tài khoản đã vô hiệu hóa |

---

### 📝 Hướng dẫn đăng nhập

1. Truy cập: `http://localhost:3000`
2. Nhập **username** hoặc **email** (ví dụ: `admin` hoặc `admin@hrm.com`)
3. Nhập mật khẩu: `123123`
4. Click **"Đăng nhập"**

**Ví dụ đăng nhập Admin:**
```
Username: admin
Password: 123123
```

**Ví dụ đăng nhập Employee:**
```
Username: dev001
Password: 123123
```

---

## 📱 Chức năng chi tiết

### 🔐 1. Bảo mật & Xác thực

- ✅ **Đăng ký tài khoản**: Người dùng mới đăng ký (cần Admin phê duyệt)
- ✅ **Đăng nhập JWT**: Xác thực bằng JSON Web Token
- ✅ **Phân quyền 3 cấp**: Admin, Manager, Employee
- ✅ **Bảo mật mật khẩu**: Hash password bằng bcrypt
- ✅ **Session management**: Tự động logout khi token hết hạn

### 👥 2. Quản lý Nhân sự

- ✅ **CRUD Nhân viên**: Thêm, sửa, xóa, tìm kiếm nhân viên
- ✅ **Thông tin chi tiết**: Họ tên, ngày sinh, giới tính, SĐT, email, địa chỉ
- ✅ **Phòng ban & Chức vụ**: Quản lý tổ chức, cấp bậc
- ✅ **Hợp đồng lao động**: Loại hợp đồng, ngày bắt đầu, kết thúc
- ✅ **Thông tin ngân hàng**: Số tài khoản, ngân hàng
- ✅ **Bảo hiểm & Thuế**: Mã số thuế, số sổ BHXH

### 📸 3. Chấm công bằng AI Face Recognition

- ✅ **Đăng ký khuôn mặt**: Upload ảnh và training AI model
- ✅ **Check-in tự động**: Nhận diện khuôn mặt và ghi nhận giờ vào
- ✅ **Check-out tự động**: Nhận diện và ghi nhận giờ ra
- ✅ **Độ chính xác cao**: Sử dụng DeepFace với ngưỡng 60%
- ✅ **Lưu ảnh chứng từ**: Lưu ảnh mỗi lần check-in/out
- ✅ **Log hoạt động**: Ghi lại tất cả lịch sử nhận diện

### ⏰ 4. Quản lý Chấm công

- ✅ **Ghi nhận giờ làm**: Check-in, check-out tự động/thủ công
- ✅ **Tính giờ làm việc**: Tự động tính tổng giờ làm
- ✅ **Tăng ca**: Theo dõi giờ làm thêm
- ✅ **Đi muộn/Về sớm**: Tính toán và cảnh báo
- ✅ **Ca làm việc**: Quản lý các ca sáng, chiều, tối

### 🏖️ 5. Quản lý Nghỉ phép

- ✅ **Gửi đơn xin nghỉ**: Nhân viên tạo yêu cầu nghỉ phép
- ✅ **Phê duyệt**: Manager/Admin duyệt hoặc từ chối
- ✅ **Loại nghỉ phép**: Phép năm, ốm đau, việc riêng, cưới/tang
- ✅ **Số ngày phép**: Theo dõi tổng số, đã dùng, còn lại
- ✅ **Lịch sử nghỉ phép**: Xem tất cả đơn đã gửi

### 💰 6. Quản lý Lương

- ✅ **Tính lương tự động**: Dựa trên chấm công và cấu hình
- ✅ **Lương cơ bản**: Theo hợp đồng
- ✅ **Phụ cấp**: Ăn trưa, xăng xe, điện thoại, trách nhiệm
- ✅ **Khấu trừ**: BHXH (8%), BHYT (1.5%), BHTN (1%), Thuế TNCN (10%)
- ✅ **Bảng lương**: Hiển thị chi tiết thu nhập

### 📊 7. Dashboard & Báo cáo

- ✅ **Tổng quan**: Số nhân viên, phòng ban, chức vụ
- ✅ **Biểu đồ**: Chart.js - Pie, Bar, Line charts
- ✅ **Thống kê chấm công**: Theo ngày, tuần, tháng
- ✅ **Thống kê nghỉ phép**: Đơn pending, approved, rejected
- ✅ **Báo cáo realtime**: Cập nhật tự động

---

## 🛠️ Troubleshooting (Xử lý sự cố)

### ❌ Lỗi Database Connection

**Giải pháp:**
1. Kiểm tra MySQL đã chạy trong XAMPP
2. Kiểm tra port MySQL (mặc định 3306 hoặc 3307)
3. Mở `backend/config/database.php` và điều chỉnh port nếu cần

### ❌ Lỗi CORS

**Giải pháp:**
1. Kiểm tra `backend/config/cors.php`
2. Đảm bảo file `cors.php` được include trong mọi API endpoint
3. Clear browser cache và thử lại

### ❌ Lỗi JWT Token

**Giải pháp:**
1. Logout và login lại để lấy token mới
2. Kiểm tra `backend/config/jwt.php`

### ❌ Lỗi Face Recognition Service

**Giải pháp:**
1. Kiểm tra service Python đã chạy: `python app.py`
2. Kiểm tra port 5000 không bị chiếm
3. Kiểm tra file `config.py` có đúng thông tin database

### ❌ Lỗi TensorFlow Installation

**Giải pháp:**
```bash
pip install tensorflow-cpu==2.17.1  # Cho máy không có GPU
```

---

## 📚 Tài liệu tham khảo

### Backend
- [PHP Documentation](https://www.php.net/docs.php)
- [MySQL Reference](https://dev.mysql.com/doc/)
- [Firebase JWT PHP](https://github.com/firebase/php-jwt)

### Frontend
- [React Documentation](https://react.dev/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Chart.js Docs](https://www.chartjs.org/docs/)

### AI/ML
- [DeepFace GitHub](https://github.com/serengil/deepface)
- [TensorFlow Documentation](https://www.tensorflow.org/api_docs)
- [OpenCV Python Tutorials](https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html)

---

## 📞 Liên hệ & Hỗ trợ

### Nhóm phát triển

- **Lê Duy Mạnh** - MSSV: 052205008936
- **Huỳnh Cao Đức** - MSSV: 052205004871  
- **Đặng Thành Đình Phát** - MSSV: 052205008286
- **Lê Thành Phú** - MSSV: 052205011458

---

## 📄 License (Giấy phép)

Copyright © 2025 Nhóm 9 - Hệ thống Quản lý Nhân sự (HRM System)

Dự án này được phát triển cho mục đích học tập và nghiên cứu.

---

<div align="center">

### 🌟 Developed with ❤️ by Nhóm 9 🌟

**HRM System - Modern Human Resource Management**

[![Made with PHP](https://img.shields.io/badge/Made%20with-PHP-777BB4?style=flat&logo=php)](https://www.php.net/)
[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Made with Python](https://img.shields.io/badge/Made%20with-Python-3776AB?style=flat&logo=python)](https://www.python.org/)

---

**⭐ Nếu thấy hữu ích, hãy cho dự án một ngôi sao! ⭐**

</div>
