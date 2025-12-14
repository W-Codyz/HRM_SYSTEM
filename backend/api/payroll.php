<?php
/**
 * Payroll Management API
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

// Debug logging
error_log("=== PAYROLL API REQUEST ===");
error_log("Method: $method");
error_log("URI: $uri");
error_log("Data: " . json_encode($data));

// GET payroll records
if ($method === 'GET' && !preg_match('/\/payroll\.php\/\d+/', $uri)) {
    $user = AuthMiddleware::authenticate();
    
    $query = "
        SELECT p.*,
               e.employee_code, e.full_name,
               d.department_name,
               pos.position_name
        FROM payroll p
        INNER JOIN employees e ON p.employee_id = e.employee_id
        LEFT JOIN departments d ON e.department_id = d.department_id
        LEFT JOIN positions pos ON e.position_id = pos.position_id
        WHERE 1=1
    ";
    
    $params = [];
    
    // Employees and Managers can only see their own payroll
    if ($user['role'] === 'employee' || $user['role'] === 'manager') {
        $query .= " AND p.employee_id = ?";
        $params[] = $user['employee_id'];
    }
    
    // Filter by employee
    if (isset($_GET['employee_id'])) {
        $query .= " AND p.employee_id = ?";
        $params[] = $_GET['employee_id'];
    }
    
    // Filter by month/year
    if (isset($_GET['month']) && isset($_GET['year'])) {
        $query .= " AND p.payroll_month = ? AND p.payroll_year = ?";
        $params[] = $_GET['month'];
        $params[] = $_GET['year'];
    }
    
    // Filter by status
    if (isset($_GET['status'])) {
        $query .= " AND p.status = ?";
        $params[] = $_GET['status'];
    }
    
    $query .= " ORDER BY p.payroll_year DESC, p.payroll_month DESC, e.employee_code";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $payrolls = $stmt->fetchAll();
    
    Response::success($payrolls);
}

// GET single payroll
if ($method === 'GET' && preg_match('/\/payroll\.php\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::authenticate();
    $payrollId = $matches[1];
    
    $stmt = $db->prepare("
        SELECT p.*,
               e.employee_code, e.full_name, e.phone, e.email,
               d.department_name,
               pos.position_name
        FROM payroll p
        INNER JOIN employees e ON p.employee_id = e.employee_id
        LEFT JOIN departments d ON e.department_id = d.department_id
        LEFT JOIN positions pos ON e.position_id = pos.position_id
        WHERE p.payroll_id = ?
    ");
    $stmt->execute([$payrollId]);
    $payroll = $stmt->fetch();
    
    if (!$payroll) {
        Response::notFound('Payroll record not found');
    }
    
    // Check permission
    if ($user['role'] === 'employee' && $payroll['employee_id'] != $user['employee_id']) {
        Response::forbidden('You can only view your own payroll');
    }
    
    // Get allowances detail
    $stmt = $db->prepare("
        SELECT a.allowance_name, ea.amount
        FROM employee_allowances ea
        INNER JOIN allowances a ON ea.allowance_id = a.allowance_id
        WHERE ea.employee_id = ? AND ea.is_active = 1
    ");
    $stmt->execute([$payroll['employee_id']]);
    $allowances = $stmt->fetchAll();
    
    // Get deductions detail (from deductions master table)
    $stmt = $db->prepare("
        SELECT deduction_name as deduction_type, rate, description
        FROM deductions
        WHERE is_active = 1
    ");
    $stmt->execute();
    $deductions = $stmt->fetchAll();
    
    $payroll['allowances_detail'] = $allowances;
    $payroll['deductions_detail'] = $deductions;
    
    Response::success($payroll);
}

// CALCULATE payroll for employee(s)
if ($method === 'POST' && strpos($uri, '/calculate')) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    
    // Validate month and year
    if (!isset($data['month']) || !is_numeric($data['month'])) {
        Response::validationError(['month' => ['Month is required and must be a number']]);
    }
    if (!isset($data['year']) || !is_numeric($data['year'])) {
        Response::validationError(['year' => ['Year is required and must be a number']]);
    }
    if ($data['month'] < 1 || $data['month'] > 12) {
        Response::validationError(['month' => ['Month must be between 1 and 12']]);
    }
    if ($data['year'] < 2000 || $data['year'] > 2100) {
        Response::validationError(['year' => ['Year must be between 2000 and 2100']]);
    }
    
    $month = $data['month'];
    $year = $data['year'];
    $employeeId = $data['employee_id'] ?? null;
    
    try {
        $db->beginTransaction();
        
        // Get employees to calculate
        $query = "SELECT * FROM employees WHERE status = 'active'";
        $params = [];
        
        if ($employeeId) {
            $query .= " AND employee_id = ?";
            $params[] = $employeeId;
        }
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $employees = $stmt->fetchAll();
        
        $calculated = [];
        
        foreach ($employees as $employee) {
            $empId = $employee['employee_id'];
            
            // Check if already exists
            $stmt = $db->prepare("
                SELECT payroll_id FROM payroll 
                WHERE employee_id = ? AND payroll_month = ? AND payroll_year = ?
            ");
            $stmt->execute([$empId, $month, $year]);
            
            if ($stmt->fetch()) {
                continue; // Skip if already calculated
            }
            
            // Get base salary from employees table
            $baseSalary = $employee['salary'] ?? 0;
            
            // Calculate total allowances
            $stmt = $db->prepare("
                SELECT SUM(amount) as total
                FROM employee_allowances
                WHERE employee_id = ? AND is_active = 1
            ");
            $stmt->execute([$empId]);
            $allowances = $stmt->fetch()['total'] ?? 0;
            
            // Calculate attendance-based deductions
            $workDays = 26; // Standard work days per month
            
            $stmt = $db->prepare("
                SELECT 
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
                    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                    SUM(overtime_hours) as total_overtime
                FROM attendance
                WHERE employee_id = ? AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ?
            ");
            $stmt->execute([$empId, $month, $year]);
            $attendance = $stmt->fetch();
            
            $presentDays = $attendance['present_days'] ?? 0;
            $absentDays = $attendance['absent_days'] ?? 0;
            $overtimeHours = $attendance['total_overtime'] ?? 0;
            
            // Calculate overtime pay (1.5x hourly rate)
            $hourlyRate = $baseSalary / $workDays / 8;
            $overtimePay = $overtimeHours * $hourlyRate * 1.5;
            
            // Calculate deductions for absences
            $dailyRate = $baseSalary / $workDays;
            $absenceDeduction = $absentDays * $dailyRate;
            
            // Calculate insurance and tax deductions based on rates
            // Get deduction rates
            $stmt = $db->prepare("
                SELECT SUM(rate) as total_rate
                FROM deductions
                WHERE deduction_type IN ('insurance', 'tax') AND is_active = 1
            ");
            $stmt->execute();
            $totalRate = $stmt->fetch()['total_rate'] ?? 0;
            
            // Calculate deductions based on base salary
            $insuranceTaxDeduction = ($baseSalary * $totalRate) / 100;
            
            $totalDeductions = $absenceDeduction + $insuranceTaxDeduction;
            
            // Calculate net salary
            $grossSalary = $baseSalary + $allowances + $overtimePay;
            $netSalary = $grossSalary - $totalDeductions;
            
            // Insert payroll record
            $stmt = $db->prepare("
                INSERT INTO payroll (
                    employee_id, payroll_month, payroll_year, base_salary, total_allowances, overtime_pay,
                    net_salary, total_deductions, work_days, actual_work_days, gross_salary, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
            ");
            
            $stmt->execute([
                $empId,
                $month,
                $year,
                $baseSalary,
                $allowances,
                $overtimePay,
                $netSalary,
                $totalDeductions,
                $workDays,
                $presentDays,
                $grossSalary
            ]);
            
            $calculated[] = [
                'employee_id' => $empId,
                'employee_name' => $employee['full_name'],
                'payroll_id' => $db->lastInsertId(),
                'net_salary' => $netSalary
            ];
        }
        
        $db->commit();
        
        // Notify all employees that payroll is ready
        if (!$employeeId && count($calculated) > 0) {
            $notificationHelper->notifyAllEmployeesPayrollGenerated($month, $year);
        }
        
        Response::created($calculated, 'Payroll calculated for ' . count($calculated) . ' employee(s)');
        
    } catch (PDOException $e) {
        $db->rollBack();
        Response::error('Failed to calculate payroll: ' . $e->getMessage());
    }
}

// CREATE payroll manually (admin only)
if ($method === 'POST' && !strpos($uri, '/calculate') && !strpos($uri, '/approve') && !strpos($uri, '/reject') && !strpos($uri, '/pay')) {
    $user = AuthMiddleware::checkRole(['admin']);
    
    try {
        // Calculate net salary
        $baseSalary = $data['base_salary'] ?? 0;
        $allowances = $data['total_allowances'] ?? 0;
        $overtimePay = $data['overtime_pay'] ?? 0;
        $deductions = $data['total_deductions'] ?? 0;
        $netSalary = $baseSalary + $allowances + $overtimePay - $deductions;
        
        $stmt = $db->prepare("
            INSERT INTO payroll (
                employee_id, payroll_month, payroll_year, base_salary, total_allowances, 
                overtime_pay, total_deductions, net_salary, work_days, status, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $data['employee_id'],
            $data['payroll_month'],
            $data['payroll_year'],
            $baseSalary,
            $allowances,
            $overtimePay,
            $deductions,
            $netSalary,
            $data['work_days'] ?? 26,
            $data['status'] ?? 'pending',
            $data['notes'] ?? null
        ]);
        
        Response::created([
            'payroll_id' => $db->lastInsertId()
        ], 'Tạo bảng lương thành công');
        
    } catch (PDOException $e) {
        Response::error('Tạo bảng lương thất bại: ' . $e->getMessage());
    }
}

// UPDATE payroll (admin edit)
if ($method === 'PUT' && preg_match('/\/payroll\.php\/(\d+)/', $uri, $matches) && !strpos($uri, '/approve') && !strpos($uri, '/reject')) {
    $user = AuthMiddleware::checkRole(['admin']);
    $payrollId = $matches[1];
    
    try {
        // Build dynamic update query
        $fields = [];
        $params = [];
        
        if (isset($data['base_salary'])) {
            $fields[] = "base_salary = ?";
            $params[] = $data['base_salary'];
        }
        
        if (isset($data['total_allowances'])) {
            $fields[] = "total_allowances = ?";
            $params[] = $data['total_allowances'];
        }
        
        if (isset($data['overtime_pay'])) {
            $fields[] = "overtime_pay = ?";
            $params[] = $data['overtime_pay'];
        }
        
        if (isset($data['total_deductions'])) {
            $fields[] = "total_deductions = ?";
            $params[] = $data['total_deductions'];
        }
        
        if (isset($data['work_days'])) {
            $fields[] = "work_days = ?";
            $params[] = $data['work_days'];
        }
        
        if (isset($data['notes'])) {
            $fields[] = "notes = ?";
            $params[] = $data['notes'];
        }
        
        if (isset($data['admin_notes'])) {
            $fields[] = "admin_notes = ?";
            $params[] = $data['admin_notes'];
        }
        
        // Recalculate net salary
        $stmt = $db->prepare("SELECT base_salary, total_allowances, overtime_pay, total_deductions FROM payroll WHERE payroll_id = ?");
        $stmt->execute([$payrollId]);
        $current = $stmt->fetch();
        
        $baseSalary = $data['base_salary'] ?? $current['base_salary'];
        $allowances = $data['total_allowances'] ?? $current['total_allowances'];
        $overtimePay = $data['overtime_pay'] ?? $current['overtime_pay'];
        $deductions = $data['total_deductions'] ?? $current['total_deductions'];
        
        $netSalary = $baseSalary + $allowances + $overtimePay - $deductions;
        
        $fields[] = "net_salary = ?";
        $params[] = $netSalary;
        
        // If editing after review rejection, set status to revised
        $stmt = $db->prepare("SELECT status FROM payroll WHERE payroll_id = ?");
        $stmt->execute([$payrollId]);
        $currentStatus = $stmt->fetchColumn();
        
        if ($currentStatus === 'need_review') {
            $fields[] = "status = ?";
            $params[] = 'revised';
        }
        
        if (empty($fields)) {
            Response::error('Không có trường nào để cập nhật');
        }
        
        $params[] = $payrollId;
        $sql = "UPDATE payroll SET " . implode(", ", $fields) . " WHERE payroll_id = ?";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->rowCount() > 0 || true) { // Always return success even if no changes
            // Get updated record with employee info
            $stmt = $db->prepare("
                SELECT p.*, e.user_id, e.full_name
                FROM payroll p
                JOIN employees e ON p.employee_id = e.employee_id
                WHERE p.payroll_id = ?
            ");
            $stmt->execute([$payrollId]);
            $updated = $stmt->fetch();
            
            // Notify employee about payroll revision
            if ($updated && $updated['user_id']) {
                $notificationHelper->notifyPayroll(
                    $updated['user_id'],
                    $updated['payroll_month'],
                    $updated['payroll_year'],
                    $updated['net_salary'],
                    'revised'
                );
            }
            
            Response::success($updated, 'Cập nhật lương thành công');
        } else {
            Response::error('Không tìm thấy bản ghi lương');
        }
        
    } catch (PDOException $e) {
        Response::error('Cập nhật lương thất bại: ' . $e->getMessage());
    }
}

// EMPLOYEE APPROVE payroll
if ($method === 'POST' && preg_match('/\/payroll\.php\/(\d+)\/approve/', $uri, $matches)) {
    $user = AuthMiddleware::authenticate();
    $payrollId = $matches[1];
    
    try {
        // Check if employee owns this payroll
        $stmt = $db->prepare("SELECT employee_id, status FROM payroll WHERE payroll_id = ?");
        $stmt->execute([$payrollId]);
        $payroll = $stmt->fetch();
        
        if (!$payroll) {
            Response::notFound('Không tìm thấy bảng lương');
        }
        
        if ($payroll['employee_id'] != $user['employee_id'] && $user['role'] !== 'admin') {
            Response::forbidden('Bạn chỉ có thể duyệt bảng lương của mình');
        }
        
        if (!in_array($payroll['status'], ['pending', 'revised'])) {
            Response::error('Chỉ có thể duyệt bảng lương đang chờ duyệt hoặc đã chỉnh sửa');
        }
        
        // Update status to approved
        $stmt = $db->prepare("UPDATE payroll SET status = 'approved', approved_at = NOW() WHERE payroll_id = ?");
        $stmt->execute([$payrollId]);
        
        // Get employee info for notification to admin
        $empStmt = $db->prepare("
            SELECT e.full_name, p.payroll_month, p.payroll_year, p.net_salary
            FROM payroll p
            JOIN employees e ON p.employee_id = e.employee_id
            WHERE p.payroll_id = ?
        ");
        $empStmt->execute([$payrollId]);
        $payrollInfo = $empStmt->fetch();
        
        // Notify admins that employee approved payroll
        if ($payrollInfo) {
            $message = $payrollInfo['full_name'] . ' đã xác nhận lương tháng ' . $payrollInfo['payroll_month'] . '/' . $payrollInfo['payroll_year'];
            $link = '/admin/payroll';
            
            // Get all admin users
            $adminStmt = $db->prepare("SELECT user_id FROM users WHERE role = 'admin'");
            $adminStmt->execute();
            $admins = $adminStmt->fetchAll();
            
            foreach ($admins as $admin) {
                $notificationHelper->createNotification(
                    $admin['user_id'],
                    'payroll_approved',
                    $message,
                    $link
                );
            }
        }
        
        Response::success(null, 'Đã duyệt bảng lương');
        
    } catch (PDOException $e) {
        Response::error('Duyệt bảng lương thất bại: ' . $e->getMessage());
    }
}

// EMPLOYEE REJECT payroll (need review)
if ($method === 'POST' && preg_match('/\/payroll\.php\/(\d+)\/reject/', $uri, $matches)) {
    $user = AuthMiddleware::authenticate();
    $payrollId = $matches[1];
    
    try {
        // Check if employee owns this payroll
        $stmt = $db->prepare("SELECT employee_id, status FROM payroll WHERE payroll_id = ?");
        $stmt->execute([$payrollId]);
        $payroll = $stmt->fetch();
        
        if (!$payroll) {
            Response::notFound('Không tìm thấy bảng lương');
        }
        
        if ($payroll['employee_id'] != $user['employee_id'] && $user['role'] !== 'admin') {
            Response::forbidden('Bạn chỉ có thể yêu cầu xem lại bảng lương của mình');
        }
        
        if (!in_array($payroll['status'], ['pending', 'revised'])) {
            Response::error('Chỉ có thể yêu cầu xem lại bảng lương đang chờ duyệt hoặc đã chỉnh sửa');
        }
        
        $notes = $data['notes'] ?? 'Nhân viên yêu cầu xem lại';
        
        // Update status to need_review with notes
        $stmt = $db->prepare("UPDATE payroll SET status = 'need_review', notes = ? WHERE payroll_id = ?");
        $stmt->execute([$notes, $payrollId]);
        
        // Get employee info for notification
        $empStmt = $db->prepare("
            SELECT e.full_name, p.payroll_month, p.payroll_year
            FROM payroll p
            JOIN employees e ON p.employee_id = e.employee_id
            WHERE p.payroll_id = ?
        ");
        $empStmt->execute([$payrollId]);
        $payrollInfo = $empStmt->fetch();
        
        // Notify admins
        if ($payrollInfo) {
            $notificationHelper->notifyPayrollNeedReview(
                $payrollInfo['full_name'],
                $payrollInfo['payroll_month'],
                $payrollInfo['payroll_year']
            );
        }
        
        Response::success(null, 'Đã gửi yêu cầu xem lại bảng lương');
        
    } catch (PDOException $e) {
        Response::error('Gửi yêu cầu thất bại: ' . $e->getMessage());
    }
}

// ADMIN MARK AS PAID
if ($method === 'POST' && preg_match('/\/payroll\.php\/(\d+)\/pay/', $uri, $matches)) {
    error_log("Pay endpoint matched! URI: $uri, Method: $method");
    $user = AuthMiddleware::checkRole(['admin']);
    $payrollId = $matches[1];
    error_log("Payroll ID: $payrollId, User role: " . $user['role']);
    
    try {
        // First check current status
        $stmt = $db->prepare("SELECT status FROM payroll WHERE payroll_id = ?");
        $stmt->execute([$payrollId]);
        $payroll = $stmt->fetch();
        
        error_log("Payroll found: " . ($payroll ? "Yes, status: " . $payroll['status'] : "No"));
        
        if (!$payroll) {
            Response::notFound('Không tìm thấy bảng lương');
        }
        
        if ($payroll['status'] !== 'approved') {
            error_log("Status check failed: " . $payroll['status']);
            Response::error('Chỉ có thể trả lương cho bảng lương đã được duyệt. Trạng thái hiện tại: ' . $payroll['status']);
        }
        
        $stmt = $db->prepare("
            UPDATE payroll SET status = 'paid', paid_at = NOW() 
            WHERE payroll_id = ?
        ");
        $stmt->execute([$payrollId]);
        
        // Get employee info for notification
        $empStmt = $db->prepare("
            SELECT e.user_id, p.payroll_month, p.payroll_year, p.net_salary
            FROM payroll p
            JOIN employees e ON p.employee_id = e.employee_id
            WHERE p.payroll_id = ?
        ");
        $empStmt->execute([$payrollId]);
        $payrollInfo = $empStmt->fetch();
        
        // Notify employee
        if ($payrollInfo && $payrollInfo['user_id']) {
            $notificationHelper->notifyPayroll(
                $payrollInfo['user_id'],
                $payrollInfo['payroll_month'],
                $payrollInfo['payroll_year'],
                $payrollInfo['net_salary'],
                'paid'
            );
        }
        
        error_log("Payment updated successfully");
        Response::success(null, 'Đã đánh dấu đã trả lương');
        
    } catch (PDOException $e) {
        error_log("Payment error: " . $e->getMessage());
        Response::error('Cập nhật thất bại: ' . $e->getMessage());
    }
}

// DELETE payroll (admin only, for pending or need_review status)
if ($method === 'DELETE' && preg_match('/\/payroll\.php\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin']);
    $payrollId = $matches[1];
    
    $stmt = $db->prepare("DELETE FROM payroll WHERE payroll_id = ? AND status IN ('pending', 'need_review')");
    $stmt->execute([$payrollId]);
    
    if ($stmt->rowCount() > 0) {
        Response::success(null, 'Đã xóa bảng lương');
    } else {
        Response::notFound('Không tìm thấy hoặc không thể xóa (chỉ xóa được bảng lương chờ duyệt hoặc cần xem lại)');
    }
}

Response::error('Endpoint not found', 404);
