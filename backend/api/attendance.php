<?php
/**
 * Attendance Management API
 */

// Set timezone to Vietnam (UTC+7)
date_default_timezone_set('Asia/Ho_Chi_Minh');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/NotificationHelper.php';
require_once __DIR__ . '/../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();
$notificationHelper = new NotificationHelper($db);

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$data = json_decode(file_get_contents("php://input"), true);

// GET attendance records
if ($method === 'GET' && !preg_match('/\/attendance\/\d+/', $uri)) {
    $user = AuthMiddleware::authenticate();
    
    $query = "
        SELECT a.*, 
               e.employee_code, e.full_name,
               d.department_name,
               p.position_name,
               s.shift_name
        FROM attendance a
        INNER JOIN employees e ON a.employee_id = e.employee_id
        LEFT JOIN departments d ON e.department_id = d.department_id
        LEFT JOIN positions p ON e.position_id = p.position_id
        LEFT JOIN work_shifts s ON a.shift_id = s.shift_id
        WHERE 1=1
    ";
    
    $params = [];
    
    // Role-based filtering
    // Admin: sees all attendance
    // Manager: sees team attendance when department_id or date filter is present
    // Employee: only sees their own attendance
    if ($user['role'] === 'employee') {
        // Employees always see only their own attendance
        $query .= " AND a.employee_id = ?";
        $params[] = $user['employee_id'];
    } elseif ($user['role'] === 'manager' && !isset($_GET['department_id']) && !isset($_GET['date'])) {
        // Managers without department/date filter see only their own attendance
        $query .= " AND a.employee_id = ?";
        $params[] = $user['employee_id'];
    }
    
    // Filter by date
    if (isset($_GET['date'])) {
        $query .= " AND a.attendance_date = ?";
        $params[] = $_GET['date'];
    }
    
    // Filter by month
    if (isset($_GET['month']) && isset($_GET['year'])) {
        $query .= " AND MONTH(a.attendance_date) = ? AND YEAR(a.attendance_date) = ?";
        $params[] = $_GET['month'];
        $params[] = $_GET['year'];
    }
    
    // Filter by employee
    if (isset($_GET['employee_id'])) {
        $query .= " AND a.employee_id = ?";
        $params[] = $_GET['employee_id'];
    }
    
    // Filter by department
    if (isset($_GET['department_id'])) {
        $query .= " AND e.department_id = ?";
        $params[] = $_GET['department_id'];
    }
    
    // Filter by status
    if (isset($_GET['status'])) {
        $query .= " AND a.status = ?";
        $params[] = $_GET['status'];
    }
    
    $query .= " ORDER BY a.attendance_date DESC, e.employee_code";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    Response::success($records);
}

// GET single attendance
if ($method === 'GET' && preg_match('/\/attendance\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::authenticate();
    $attendanceId = $matches[1];
    
    $stmt = $db->prepare("
        SELECT a.*, 
               e.employee_code, e.full_name,
               d.department_name,
               p.position_name,
               s.shift_name, s.start_time, s.end_time
        FROM attendance a
        INNER JOIN employees e ON a.employee_id = e.employee_id
        LEFT JOIN departments d ON e.department_id = d.department_id
        LEFT JOIN positions p ON e.position_id = p.position_id
        LEFT JOIN work_shifts s ON a.shift_id = s.shift_id
        WHERE a.attendance_id = ?
    ");
    $stmt->execute([$attendanceId]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$record) {
        Response::notFound('Attendance record not found');
    }
    
    Response::success($record);
}

// CHECK-IN
if ($method === 'POST' && strpos($uri, '/checkin') !== false) {
    $user = AuthMiddleware::authenticate();
    
    $employeeId = $data['employee_id'] ?? $user['employee_id'];
    $date = $data['date'] ?? date('Y-m-d');
    $time = $data['time'] ?? date('H:i:s');
    $shiftId = $data['shift_id'] ?? 1;
    $isManual = isset($data['employee_id']) && ($user['role'] === 'admin' || $user['role'] === 'manager');
    
    
    $stmt = $db->prepare("
        SELECT attendance_id FROM attendance 
        WHERE employee_id = ? AND attendance_date = ? AND shift_id = ?
    ");
    $stmt->execute([$employeeId, $date, $shiftId]);
    
    if ($stmt->rowCount() > 0) {
        Response::error('Đã chấm công vào ca làm này rồi');
    }
    
    try {
        // Get shift info to calculate late minutes
        $stmt = $db->prepare("SELECT start_time FROM work_shifts WHERE shift_id = ?");
        $stmt->execute([$shiftId]);
        $shift = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $lateMinutes = 0;
        if ($shift) {
            $shiftStart = strtotime($shift['start_time']);
            $checkInTime = strtotime($time);
            $diff = $checkInTime - $shiftStart;
            $lateMinutes = max(0, floor($diff / 60));
        }
        
        /* if (!$isManual && $lateMinutes > 60) {
            Response::error('Bạn đã muộn quá 60 phút, không thể chấm công. Vui lòng liên hệ quản lý!');
        } */
        
        // Nếu là chấm công thủ công và có truyền status thì dùng status đó, không thì tự động tính
        if ($isManual && isset($data['status'])) {
            $status = $data['status'];
        } else {
            $status = $lateMinutes > 15 ? 'late' : 'present';
        }
        
        $stmt = $db->prepare("
            INSERT INTO attendance (employee_id, shift_id, attendance_date, check_in, late_minutes, status, check_in_method)
            VALUES (?, ?, ?, ?, ?, ?, 'manual')
        ");
        
        $stmt->execute([$employeeId, $shiftId, $date, $time, $lateMinutes, $status]);
        
        // Lấy dữ liệu vừa tạo để trả về
        $attendanceId = $db->lastInsertId();
        $stmt = $db->prepare("
            SELECT * FROM attendance WHERE attendance_id = ?
        ");
        $stmt->execute([$attendanceId]);
        $attendanceData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::created($attendanceData, 'Chấm công vào thành công');
        
    } catch (PDOException $e) {
        Response::error('Chấm công thất bại: ' . $e->getMessage());
    }
}

// CHECK-OUT
if ($method === 'POST' && strpos($uri, '/checkout') !== false) {
    $user = AuthMiddleware::authenticate();
    
    $employeeId = $data['employee_id'] ?? $user['employee_id'];
    $date = $data['date'] ?? date('Y-m-d');
    $time = $data['time'] ?? date('H:i:s');
    $shiftId = $data['shift_id'] ?? 1;
    
    // Find today's attendance record
    $stmt = $db->prepare("
        SELECT attendance_id, check_in FROM attendance 
        WHERE employee_id = ? AND attendance_date = ? AND shift_id = ? AND check_out IS NULL
    ");
    $stmt->execute([$employeeId, $date, $shiftId]);
    $attendance = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$attendance) {
        Response::error('Không tìm thấy bản ghi chấm công vào hôm nay');
    }
    
    try {
        // Calculate actual hours
        $checkIn = strtotime($attendance['check_in']);
        $checkOut = strtotime($time);
        $actualHours = round(($checkOut - $checkIn) / 3600, 2);
        
        // Calculate overtime (if > 8 hours)
        $overtimeHours = max(0, $actualHours - 8);
        
        $stmt = $db->prepare("
            UPDATE attendance SET
                check_out = ?,
                actual_hours = ?,
                overtime_hours = ?,
                check_out_method = 'manual'
            WHERE attendance_id = ?
        ");
        
        $stmt->execute([$time, $actualHours, $overtimeHours, $attendance['attendance_id']]);
        
        // Lấy dữ liệu đầy đủ sau khi update để trả về
        $stmt = $db->prepare("
            SELECT * FROM attendance WHERE attendance_id = ?
        ");
        $stmt->execute([$attendance['attendance_id']]);
        $attendanceData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::success($attendanceData, 'Chấm công ra thành công');
        
    } catch (PDOException $e) {
        Response::error('Chấm công ra thất bại: ' . $e->getMessage());
    }
}

// CREATE attendance manually
if ($method === 'POST' && !strpos($uri, '/checkin') && !strpos($uri, '/checkout')) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    
    try {
        $stmt = $db->prepare("
            INSERT INTO attendance (employee_id, shift_id, attendance_date, check_in, check_out, 
                                   actual_hours, overtime_hours, late_minutes, early_leave_minutes, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['employee_id'],
            $data['shift_id'] ?? 1,
            $data['attendance_date'],
            $data['check_in'] ?? null,
            $data['check_out'] ?? null,
            $data['actual_hours'] ?? 0,
            $data['overtime_hours'] ?? 0,
            $data['late_minutes'] ?? 0,
            $data['early_leave_minutes'] ?? 0,
            $data['status'] ?? 'present',
            $data['notes'] ?? null
        ]);
        
        Response::created([
            'attendance_id' => $db->lastInsertId()
        ], 'Attendance created successfully');
        
    } catch (PDOException $e) {
        Response::error('Failed to create attendance: ' . $e->getMessage());
    }
}

// UPDATE attendance
if ($method === 'PUT' && preg_match('/\/attendance\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    $attendanceId = $matches[1];
    
    try {
        // Get old attendance data and employee info for notification
        $stmt = $db->prepare("
            SELECT a.*, e.user_id as employee_user_id, e.full_name as employee_name
            FROM attendance a
            JOIN employees e ON a.employee_id = e.employee_id
            WHERE a.attendance_id = ?
        ");
        $stmt->execute([$attendanceId]);
        $oldAttendance = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$oldAttendance) {
            Response::notFound('Attendance record not found');
        }
        
        $stmt = $db->prepare("
            UPDATE attendance SET
                check_in = ?,
                check_out = ?,
                actual_hours = ?,
                overtime_hours = ?,
                late_minutes = ?,
                early_leave_minutes = ?,
                status = ?,
                notes = ?
            WHERE attendance_id = ?
        ");
        
        $stmt->execute([
            $data['check_in'] ?? null,
            $data['check_out'] ?? null,
            $data['actual_hours'] ?? 0,
            $data['overtime_hours'] ?? 0,
            $data['late_minutes'] ?? 0,
            $data['early_leave_minutes'] ?? 0,
            $data['status'] ?? 'present',
            $data['notes'] ?? null,
            $attendanceId
        ]);
        
        // Send notification to employee about attendance edit
        if ($oldAttendance['employee_user_id'] && $oldAttendance['employee_user_id'] != $user['user_id']) {
            $editorName = $user['role'] === 'admin' ? 'Quản trị viên' : 'Quản lý';
            $notificationHelper->notifyAttendanceEdited(
                $oldAttendance['employee_user_id'],
                $oldAttendance['employee_name'],
                $oldAttendance['attendance_date'],
                $editorName
            );
        }
        
        Response::success(['attendance_id' => $attendanceId], 'Attendance updated successfully');
        
    } catch (PDOException $e) {
        Response::error('Failed to update attendance: ' . $e->getMessage());
    }
}

// DELETE attendance
if ($method === 'DELETE' && preg_match('/\/attendance\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin']);
    $attendanceId = $matches[1];
    
    $stmt = $db->prepare("DELETE FROM attendance WHERE attendance_id = ?");
    $stmt->execute([$attendanceId]);
    
    if ($stmt->rowCount() > 0) {
        Response::success(null, 'Attendance deleted successfully');
    } else {
        Response::notFound('Attendance not found');
    }
}

Response::error('Endpoint not found', 404);
