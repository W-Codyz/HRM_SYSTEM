<?php
/**
 * Departments Management API
 */

// Set timezone to Vietnam (UTC+7)
date_default_timezone_set('Asia/Ho_Chi_Minh');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$data = json_decode(file_get_contents("php://input"), true);

// GET all departments
if ($method === 'GET' && !preg_match('/\/departments\/\d+/', $uri)) {
    $user = AuthMiddleware::authenticate();
    
    $stmt = $db->prepare("
        SELECT d.*, 
               e.full_name as manager_name,
               COUNT(DISTINCT emp.employee_id) as employee_count
        FROM departments d
        LEFT JOIN employees e ON d.manager_id = e.employee_id
        LEFT JOIN employees emp ON d.department_id = emp.department_id AND emp.status = 'active'
        GROUP BY d.department_id
        ORDER BY d.department_name
    ");
    $stmt->execute();
    $departments = $stmt->fetchAll();
    
    Response::success($departments);
}

// GET single department
if ($method === 'GET' && preg_match('/\/departments\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::authenticate();
    $deptId = $matches[1];
    
    $stmt = $db->prepare("
        SELECT d.*, 
               e.full_name as manager_name,
               e.employee_code as manager_code
        FROM departments d
        LEFT JOIN employees e ON d.manager_id = e.employee_id
        WHERE d.department_id = ?
    ");
    $stmt->execute([$deptId]);
    $department = $stmt->fetch();
    
    if (!$department) {
        Response::notFound('Department not found');
    }
    
    // Get employees in this department
    $stmt = $db->prepare("
        SELECT employee_id, employee_code, full_name, position_id
        FROM employees
        WHERE department_id = ? AND status = 'active'
        ORDER BY full_name
    ");
    $stmt->execute([$deptId]);
    $department['employees'] = $stmt->fetchAll();
    
    Response::success($department);
}

// CREATE department
if ($method === 'POST') {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    
    // Log received data for debugging
    error_log('Received department data: ' . print_r($data, true));
    
    $errors = Validator::validate([
        'department_name' => [
            'required' => ['value' => $data['department_name'] ?? '', 'name' => 'Department name'],
        ],
        'department_code' => [
            'required' => ['value' => $data['department_code'] ?? '', 'name' => 'Department code'],
        ],
    ]);
    
    if (!empty($errors)) {
        error_log('Validation errors: ' . print_r($errors, true));
        Response::validationError($errors);
    }
    
    // Check duplicate code
    $stmt = $db->prepare("SELECT department_id FROM departments WHERE department_code = ?");
    $stmt->execute([$data['department_code']]);
    if ($stmt->rowCount() > 0) {
        Response::error('Department code already exists');
    }
    
    try {
        // Convert empty string to null for manager_id
        $managerId = !empty($data['manager_id']) ? $data['manager_id'] : null;
        
        $stmt = $db->prepare("
            INSERT INTO departments (department_name, department_code, manager_id, description)
            VALUES (?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['department_name'],
            $data['department_code'],
            $managerId,
            $data['description'] ?? null
        ]);
        
        Response::created([
            'department_id' => $db->lastInsertId()
        ], 'Department created successfully');
        
    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        Response::error('Failed to create department: ' . $e->getMessage());
    }
}

// UPDATE department
if ($method === 'PUT' && preg_match('/\/departments\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    $deptId = $matches[1];
    
    try {
        // Convert empty string to null for manager_id
        $managerId = !empty($data['manager_id']) ? $data['manager_id'] : null;
        
        $stmt = $db->prepare("
            UPDATE departments SET
                department_name = ?,
                manager_id = ?,
                description = ?
            WHERE department_id = ?
        ");
        
        $stmt->execute([
            $data['department_name'],
            $managerId,
            $data['description'] ?? null,
            $deptId
        ]);
        
        if ($stmt->rowCount() > 0 || true) {
            Response::success(['department_id' => $deptId], 'Department updated successfully');
        } else {
            Response::error('Department not found');
        }
        
    } catch (PDOException $e) {
        Response::error('Failed to update department: ' . $e->getMessage());
    }
}

// DELETE department
if ($method === 'DELETE' && preg_match('/\/departments\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin']);
    $deptId = $matches[1];
    
    // Check if department has employees
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM employees WHERE department_id = ?");
    $stmt->execute([$deptId]);
    $result = $stmt->fetch();
    
    if ($result['count'] > 0) {
        Response::error('Cannot delete department with employees. Please reassign employees first.');
    }
    
    $stmt = $db->prepare("DELETE FROM departments WHERE department_id = ?");
    $stmt->execute([$deptId]);
    
    if ($stmt->rowCount() > 0) {
        Response::success(null, 'Department deleted successfully');
    } else {
        Response::notFound('Department not found');
    }
}

Response::error('Endpoint not found', 404);
