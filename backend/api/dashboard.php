<?php
/**
 * Dashboard Statistics API
 */

// Set timezone to Vietnam (UTC+7)
date_default_timezone_set('Asia/Ho_Chi_Minh');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

// GET dashboard statistics
if ($method === 'GET' && strpos($uri, '/stats') !== false) {
    $user = AuthMiddleware::authenticate();
    
    // Total employees
    $stmt = $db->query("SELECT COUNT(*) as total FROM employees WHERE status = 'active'");
    $totalEmployees = $stmt->fetch()['total'];
    
    // Today's attendance stats
    $today = date('Y-m-d');
    $stmt = $db->prepare("
        SELECT 
            COUNT(DISTINCT CASE WHEN status = 'present' THEN employee_id END) as present,
            COUNT(DISTINCT CASE WHEN status = 'absent' THEN employee_id END) as absent,
            COUNT(DISTINCT CASE WHEN status = 'late' THEN employee_id END) as late
        FROM attendance
        WHERE attendance_date = ?
    ");
    $stmt->execute([$today]);
    $attendance = $stmt->fetch();
    
    // Employees on leave today
    $stmt = $db->prepare("
        SELECT COUNT(DISTINCT employee_id) as on_leave
        FROM leave_requests
        WHERE status = 'approved'
          AND start_date <= ?
          AND end_date >= ?
    ");
    $stmt->execute([$today, $today]);
    $onLeave = $stmt->fetch()['on_leave'];
    
    // Current month total salary
    $currentMonth = date('n');
    $currentYear = date('Y');
    $stmt = $db->prepare("
        SELECT COALESCE(SUM(net_salary), 0) as total
        FROM payroll
        WHERE payroll_month = ? AND payroll_year = ?
    ");
    $stmt->execute([$currentMonth, $currentYear]);
    $totalSalary = $stmt->fetch()['total'] ?? 0;
    
    Response::success([
        'total_employees' => (int)$totalEmployees,
        'present_today' => (int)$attendance['present'],
        'absent_today' => (int)$attendance['absent'],
        'late_today' => (int)$attendance['late'],
        'on_leave_today' => (int)$onLeave,
        'total_salary_month' => (float)$totalSalary,
    ]);
}

// GET attendance trends (last 7 days)
if ($method === 'GET' && strpos($uri, '/attendance-trends') !== false) {
    $user = AuthMiddleware::authenticate();
    
    $stmt = $db->query("
        SELECT 
            attendance_date,
            COUNT(DISTINCT CASE WHEN status = 'present' THEN employee_id END) as present,
            COUNT(DISTINCT CASE WHEN status = 'late' THEN employee_id END) as late,
            COUNT(DISTINCT CASE WHEN status = 'absent' THEN employee_id END) as absent
        FROM attendance
        WHERE attendance_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY attendance_date
        ORDER BY attendance_date
    ");
    
    $trends = $stmt->fetchAll();
    
    Response::success($trends);
}

// GET employees by department
if ($method === 'GET' && strpos($uri, '/employees-by-department') !== false) {
    $user = AuthMiddleware::authenticate();
    
    $stmt = $db->query("
        SELECT 
            d.department_name,
            COUNT(e.employee_id) as employee_count
        FROM departments d
        LEFT JOIN employees e ON d.department_id = e.department_id AND e.status = 'active'
        GROUP BY d.department_id, d.department_name
        ORDER BY employee_count DESC
    ");
    
    $departments = $stmt->fetchAll();
    
    Response::success($departments);
}

// GET gender distribution
if ($method === 'GET' && strpos($uri, '/gender-distribution') !== false) {
    $user = AuthMiddleware::authenticate();
    
    $stmt = $db->query("
        SELECT 
            gender,
            COUNT(*) as count
        FROM employees
        WHERE status = 'active'
        GROUP BY gender
    ");
    
    $distribution = $stmt->fetchAll();
    
    Response::success($distribution);
}

// GET recent activities
if ($method === 'GET' && strpos($uri, '/recent-activities') !== false) {
    $user = AuthMiddleware::authenticate();
    
    $stmt = $db->query("
        SELECT 
            n.notification_id,
            n.title,
            n.message,
            n.type,
            n.created_at,
            u.username
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.user_id
        ORDER BY n.created_at DESC
        LIMIT 10
    ");
    
    $activities = $stmt->fetchAll();
    
    Response::success($activities);
}

// GET pending approvals count
if ($method === 'GET' && strpos($uri, '/pending-approvals') !== false) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    
    // Pending users
    $stmt = $db->query("SELECT COUNT(*) as count FROM users WHERE status = 'pending'");
    $pendingUsers = $stmt->fetch()['count'];
    
    // Pending leave requests
    $stmt = $db->query("SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'");
    $pendingLeaves = $stmt->fetch()['count'];
    
    // Pending payroll
    $stmt = $db->query("SELECT COUNT(*) as count FROM payroll WHERE status = 'pending'");
    $pendingPayroll = $stmt->fetch()['count'];
    
    Response::success([
        'pending_users' => (int)$pendingUsers,
        'pending_leave_requests' => (int)$pendingLeaves,
        'pending_payroll' => (int)$pendingPayroll,
        'total_pending' => (int)($pendingUsers + $pendingLeaves + $pendingPayroll)
    ]);
}

Response::error('Endpoint not found', 404);
