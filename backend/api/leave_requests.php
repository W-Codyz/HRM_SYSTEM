<?php
/**
 * Leave Requests Management API
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

// GET leave requests
if ($method === 'GET' && !preg_match('/\/leave_requests\/\d+/', $uri)) {
    $user = AuthMiddleware::authenticate();
    
    $query = "
        SELECT lr.*,
               e.employee_code, e.full_name,
               d.department_name,
               lt.leave_name,
               u.username as reviewed_by_name
        FROM leave_requests lr
        INNER JOIN employees e ON lr.employee_id = e.employee_id
        LEFT JOIN departments d ON e.department_id = d.department_id
        INNER JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
        LEFT JOIN users u ON lr.reviewed_by = u.user_id
        WHERE 1=1
    ";
    
    $params = [];
    
    // Role-based filtering
    // Admin: sees all leave requests
    // Manager: sees department leave requests when department_id filter is present, otherwise only their own
    // Employee: only sees their own requests
    if ($user['role'] === 'employee') {
        // Employees always see only their own requests
        $query .= " AND lr.employee_id = ?";
        $params[] = $user['employee_id'];
    } elseif ($user['role'] === 'manager' && !isset($_GET['department_id'])) {
        // Managers without department filter see only their own requests
        $query .= " AND lr.employee_id = ?";
        $params[] = $user['employee_id'];
    }
    
    // Filter by department (for managers viewing team requests)
    if (isset($_GET['department_id'])) {
        $query .= " AND e.department_id = ?";
        $params[] = $_GET['department_id'];
    }
    
    // Filter by status
    if (isset($_GET['status'])) {
        $query .= " AND lr.status = ?";
        $params[] = $_GET['status'];
    }
    
    // Filter by employee
    if (isset($_GET['employee_id'])) {
        $query .= " AND lr.employee_id = ?";
        $params[] = $_GET['employee_id'];
    }
    
    // Filter by date range
    if (isset($_GET['start_date'])) {
        $query .= " AND lr.start_date >= ?";
        $params[] = $_GET['start_date'];
    }
    
    if (isset($_GET['end_date'])) {
        $query .= " AND lr.end_date <= ?";
        $params[] = $_GET['end_date'];
    }
    
    $query .= " ORDER BY lr.requested_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $requests = $stmt->fetchAll();
    
    Response::success($requests);
}

// GET single leave request
if ($method === 'GET' && preg_match('/\/leave_requests\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::authenticate();
    $requestId = $matches[1];
    
    $stmt = $db->prepare("
        SELECT lr.*,
               e.employee_code, e.full_name, e.phone,
               d.department_name,
               lt.leave_name, lt.is_paid,
               u.username as reviewed_by_name
        FROM leave_requests lr
        INNER JOIN employees e ON lr.employee_id = e.employee_id
        LEFT JOIN departments d ON e.department_id = d.department_id
        INNER JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
        LEFT JOIN users u ON lr.reviewed_by = u.user_id
        WHERE lr.leave_request_id = ?
    ");
    $stmt->execute([$requestId]);
    $request = $stmt->fetch();
    
    if (!$request) {
        Response::notFound('Leave request not found');
    }
    
    // Check permission
    if ($user['role'] === 'employee' && $request['employee_id'] != $user['employee_id']) {
        Response::forbidden('You can only view your own requests');
    }
    
    Response::success($request);
}

// CREATE leave request
if ($method === 'POST' && !strpos($uri, '/approve') && !strpos($uri, '/reject')) {
    $user = AuthMiddleware::authenticate();
    
    $employeeId = $data['employee_id'] ?? $user['employee_id'];
    
    $errors = Validator::validate([
        'leave_type_id' => [
            'required' => ['value' => $data['leave_type_id'] ?? '', 'name' => 'Leave type'],
        ],
        'start_date' => [
            'required' => ['value' => $data['start_date'] ?? '', 'name' => 'Start date'],
            'date' => ['value' => $data['start_date'] ?? ''],
        ],
        'end_date' => [
            'required' => ['value' => $data['end_date'] ?? '', 'name' => 'End date'],
            'date' => ['value' => $data['end_date'] ?? ''],
        ],
    ]);
    
    if (!empty($errors)) {
        Response::validationError($errors);
    }
    
    // Calculate total days
    $start = new DateTime($data['start_date']);
    $end = new DateTime($data['end_date']);
    $interval = $start->diff($end);
    $totalDays = $interval->days + 1;
    
    try {
        $stmt = $db->prepare("
            INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        ");
        
        $stmt->execute([
            $employeeId,
            $data['leave_type_id'],
            $data['start_date'],
            $data['end_date'],
            $totalDays,
            $data['reason'] ?? null
        ]);
        
        $leaveRequestId = $db->lastInsertId();
        
        // Get employee info and manager for notifications
        $empStmt = $db->prepare("
            SELECT e.full_name, e.user_id, e.department_id, lt.leave_name,
                   d.manager_id, m.user_id as manager_user_id
            FROM employees e
            JOIN leave_types lt ON lt.leave_type_id = ?
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN employees m ON d.manager_id = m.employee_id
            WHERE e.employee_id = ?
        ");
        $empStmt->execute([$data['leave_type_id'], $employeeId]);
        $empInfo = $empStmt->fetch();
        
        // Notify admins about new leave request
        if ($empInfo) {
            $notificationHelper->notifyNewLeaveRequest(
                $empInfo['full_name'],
                $empInfo['leave_name'],
                $data['start_date'],
                $data['end_date']
            );
            
            // Also notify manager if employee has a manager
            if ($empInfo['manager_user_id']) {
                $notificationHelper->notifyManagerNewLeaveRequest(
                    $empInfo['manager_user_id'],
                    $empInfo['full_name'],
                    $empInfo['leave_name'],
                    $data['start_date'],
                    $data['end_date']
                );
            }
        }
        
        Response::created([
            'leave_request_id' => $leaveRequestId
        ], 'Leave request submitted successfully');
        
    } catch (PDOException $e) {
        Response::error('Failed to create leave request: ' . $e->getMessage());
    }
}

// APPROVE leave request
if ($method === 'PUT' && preg_match('/\/leave_requests\/(\d+)\/approve/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    $requestId = $matches[1];
    
    try {
        $db->beginTransaction();
        
        // Update request status
        $stmt = $db->prepare("
            UPDATE leave_requests SET
                status = 'approved',
                reviewed_by = ?,
                reviewed_at = NOW(),
                review_notes = ?
            WHERE leave_request_id = ? AND status = 'pending'
        ");
        
        $stmt->execute([
            $user['user_id'],
            $data['review_notes'] ?? 'Approved',
            $requestId
        ]);
        
        if ($stmt->rowCount() === 0) {
            $db->rollBack();
            Response::error('Request not found or already processed');
        }
        
        // Get request details
        $stmt = $db->prepare("
            SELECT employee_id, leave_type_id, total_days, YEAR(start_date) as year
            FROM leave_requests WHERE leave_request_id = ?
        ");
        $stmt->execute([$requestId]);
        $request = $stmt->fetch();
        
        // Update leave balance
        $stmt = $db->prepare("
            INSERT INTO leave_balance (employee_id, leave_type_id, year, total_days, used_days, remaining_days)
            VALUES (?, ?, ?, 12, ?, ?)
            ON DUPLICATE KEY UPDATE
                used_days = used_days + VALUES(used_days),
                remaining_days = total_days - (used_days + VALUES(used_days))
        ");
        
        $stmt->execute([
            $request['employee_id'],
            $request['leave_type_id'],
            $request['year'],
            $request['total_days'],
            12 - $request['total_days']
        ]);
        
        // Get employee info for notification
        $empStmt = $db->prepare("
            SELECT e.user_id, lt.leave_name, lr.start_date, lr.end_date
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.employee_id
            JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
            WHERE lr.leave_request_id = ?
        ");
        $empStmt->execute([$requestId]);
        $leaveInfo = $empStmt->fetch();
        
        // Notify employee about approval
        if ($leaveInfo && $leaveInfo['user_id']) {
            $notificationHelper->notifyLeaveRequestStatus(
                $leaveInfo['user_id'],
                'approved',
                $leaveInfo['leave_name'],
                $leaveInfo['start_date'],
                $leaveInfo['end_date']
            );
        }
        
        $db->commit();
        
        Response::success(['leave_request_id' => $requestId], 'Leave request approved successfully');
        
    } catch (PDOException $e) {
        $db->rollBack();
        Response::error('Failed to approve leave request: ' . $e->getMessage());
    }
}

// REJECT leave request
if ($method === 'PUT' && preg_match('/\/leave_requests\/(\d+)\/reject/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    $requestId = $matches[1];
    
    try {
        $stmt = $db->prepare("
            UPDATE leave_requests SET
                status = 'rejected',
                reviewed_by = ?,
                reviewed_at = NOW(),
                review_notes = ?
            WHERE leave_request_id = ? AND status = 'pending'
        ");
        
        $stmt->execute([
            $user['user_id'],
            $data['review_notes'] ?? 'Rejected',
            $requestId
        ]);
        
        if ($stmt->rowCount() > 0) {
            // Get employee info for notification
            $empStmt = $db->prepare("
                SELECT e.user_id, lt.leave_name, lr.start_date, lr.end_date
                FROM leave_requests lr
                JOIN employees e ON lr.employee_id = e.employee_id
                JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
                WHERE lr.leave_request_id = ?
            ");
            $empStmt->execute([$requestId]);
            $leaveInfo = $empStmt->fetch();
            
            // Notify employee about rejection
            if ($leaveInfo && $leaveInfo['user_id']) {
                $notificationHelper->notifyLeaveRequestStatus(
                    $leaveInfo['user_id'],
                    'rejected',
                    $leaveInfo['leave_name'],
                    $leaveInfo['start_date'],
                    $leaveInfo['end_date']
                );
            }
            
            Response::success(['leave_request_id' => $requestId], 'Leave request rejected');
        } else {
            Response::error('Request not found or already processed');
        }
        
    } catch (PDOException $e) {
        Response::error('Failed to reject leave request: ' . $e->getMessage());
    }
}

// CANCEL leave request
if ($method === 'PUT' && preg_match('/\/leave_requests\/(\d+)\/cancel/', $uri, $matches)) {
    $user = AuthMiddleware::authenticate();
    $requestId = $matches[1];
    
    try {
        $query = "
            UPDATE leave_requests lr
            INNER JOIN employees e ON lr.employee_id = e.employee_id
            SET lr.status = 'cancelled'
            WHERE lr.leave_request_id = ? AND lr.status = 'pending'
        ";
        
        $params = [$requestId];
        
        // Employees can only cancel their own requests
        if ($user['role'] === 'employee') {
            $query .= " AND e.user_id = ?";
            $params[] = $user['user_id'];
        }
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        if ($stmt->rowCount() > 0) {
            Response::success(['leave_request_id' => $requestId], 'Leave request cancelled');
        } else {
            Response::error('Request not found, already processed, or you do not have permission');
        }
        
    } catch (PDOException $e) {
        Response::error('Failed to cancel leave request: ' . $e->getMessage());
    }
}

// DELETE leave request
if ($method === 'DELETE' && preg_match('/\/leave_requests\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin']);
    $requestId = $matches[1];
    
    $stmt = $db->prepare("DELETE FROM leave_requests WHERE leave_request_id = ?");
    $stmt->execute([$requestId]);
    
    if ($stmt->rowCount() > 0) {
        Response::success(null, 'Leave request deleted successfully');
    } else {
        Response::notFound('Leave request not found');
    }
}

Response::error('Endpoint not found', 404);
