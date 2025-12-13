<?php
/**
 * Users Management API
 * Manage user accounts and approval
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
$data = json_decode(file_get_contents("php://input"), true);

// GET all pending users (Admin only)
if ($method === 'GET' && strpos($uri, '/pending') !== false) {
    $user = AuthMiddleware::checkRole(['admin']);
    
    $stmt = $db->prepare("
        SELECT user_id, username, email, role, status, created_at
        FROM users
        WHERE status = 'pending'
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    Response::success($users);
}

// GET all users (Admin/Manager)
if ($method === 'GET' && !strpos($uri, '/pending')) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    
    $stmt = $db->prepare("
        SELECT u.user_id, u.username, u.email, u.role, u.status, u.created_at, u.last_login,
               e.employee_id, e.full_name, e.department_id, e.position_id
        FROM users u
        LEFT JOIN employees e ON u.user_id = e.user_id
        ORDER BY u.created_at DESC
    ");
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    Response::success($users);
}

// APPROVE/REJECT user (Admin only)
if ($method === 'PUT' && strpos($uri, '/approve') !== false) {
    $user = AuthMiddleware::checkRole(['admin']);
    
    preg_match('/\/users\/(\d+)\/approve/', $uri, $matches);
    $userId = $matches[1] ?? null;
    
    if (!$userId) {
        Response::error('User ID is required');
    }
    
    $action = $data['action'] ?? 'approve'; // approve or reject
    $newStatus = $action === 'approve' ? 'active' : 'rejected';
    
    $stmt = $db->prepare("UPDATE users SET status = ? WHERE user_id = ? AND status = 'pending'");
    $stmt->execute([$newStatus, $userId]);
    
    if ($stmt->rowCount() > 0) {
        Response::success(['user_id' => $userId, 'status' => $newStatus], 
            "User has been $action" . "d successfully");
    } else {
        Response::error('User not found or already processed');
    }
}

// REJECT user (Admin only)
if ($method === 'PUT' && strpos($uri, '/reject') !== false) {
    $user = AuthMiddleware::checkRole(['admin']);
    
    preg_match('/\/users\/(\d+)\/reject/', $uri, $matches);
    $userId = $matches[1] ?? null;
    
    if (!$userId) {
        Response::error('User ID is required');
    }
    
    $stmt = $db->prepare("UPDATE users SET status = 'rejected' WHERE user_id = ?");
    $stmt->execute([$userId]);
    
    if ($stmt->rowCount() > 0) {
        Response::success(['user_id' => $userId, 'status' => 'rejected'], 
            'User has been rejected successfully');
    } else {
        Response::error('User not found');
    }
}

// UPDATE user (Admin only) - General update for role, etc.
if ($method === 'PUT' && !strpos($uri, '/approve') && !strpos($uri, '/reject') && !strpos($uri, '/role')) {
    $user = AuthMiddleware::checkRole(['admin']);
    
    preg_match('/\/users\/(\d+)/', $uri, $matches);
    $userId = $matches[1] ?? null;
    
    if (!$userId) {
        Response::error('User ID is required');
    }
    
    // Build update query dynamically
    $updates = [];
    $params = [];
    
    if (isset($data['email'])) {
        $updates[] = "email = ?";
        $params[] = $data['email'];
    }
    
    if (isset($data['role'])) {
        $allowedRoles = ['admin', 'manager', 'employee'];
        if (!in_array($data['role'], $allowedRoles)) {
            Response::error('Invalid role');
        }
        $updates[] = "role = ?";
        $params[] = $data['role'];
    }
    
    if (isset($data['status'])) {
        $allowedStatuses = ['pending', 'active', 'inactive', 'rejected'];
        if (!in_array($data['status'], $allowedStatuses)) {
            Response::error('Invalid status');
        }
        $updates[] = "status = ?";
        $params[] = $data['status'];
    }
    
    if (empty($updates)) {
        Response::error('No valid fields to update');
    }
    
    $params[] = $userId;
    $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE user_id = ?";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() > 0 || true) { // Return success even if no rows changed
        Response::success(['user_id' => $userId], 'User updated successfully');
    } else {
        Response::error('User not found');
    }
}

// UPDATE user role (Admin only)
if ($method === 'PUT' && strpos($uri, '/role') !== false) {
    $user = AuthMiddleware::checkRole(['admin']);
    
    preg_match('/\/users\/(\d+)\/role/', $uri, $matches);
    $userId = $matches[1] ?? null;
    
    if (!$userId || !isset($data['role'])) {
        Response::error('User ID and role are required');
    }
    
    $allowedRoles = ['admin', 'manager', 'employee'];
    if (!in_array($data['role'], $allowedRoles)) {
        Response::error('Invalid role');
    }
    
    $stmt = $db->prepare("UPDATE users SET role = ? WHERE user_id = ?");
    $stmt->execute([$data['role'], $userId]);
    
    if ($stmt->rowCount() > 0) {
        Response::success(['user_id' => $userId, 'role' => $data['role']], 
            'User role updated successfully');
    } else {
        Response::error('User not found');
    }
}

// DELETE user (Admin only)
if ($method === 'DELETE') {
    $user = AuthMiddleware::checkRole(['admin']);
    
    preg_match('/\/users\/(\d+)/', $uri, $matches);
    $userId = $matches[1] ?? null;
    
    if (!$userId) {
        Response::error('User ID is required');
    }
    
    // Don't allow deleting yourself
    if ($userId == $user->user_id) {
        Response::error('You cannot delete your own account');
    }
    
    $stmt = $db->prepare("DELETE FROM users WHERE user_id = ?");
    $stmt->execute([$userId]);
    
    if ($stmt->rowCount() > 0) {
        Response::success(null, 'User deleted successfully');
    } else {
        Response::error('User not found');
    }
}

Response::error('Endpoint not found', 404);
