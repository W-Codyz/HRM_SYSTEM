<?php
/**
 * Positions Management API
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

// GET all positions
if ($method === 'GET' && !preg_match('/\/positions\/\d+/', $uri)) {
    $user = AuthMiddleware::authenticate();
    
    $query = "
        SELECT p.*, 
               d.department_name,
               COUNT(DISTINCT e.employee_id) as employee_count
        FROM positions p
        LEFT JOIN departments d ON p.department_id = d.department_id
        LEFT JOIN employees e ON p.position_id = e.position_id AND e.status = 'active'
        WHERE 1=1
    ";
    
    $params = [];
    
    if (isset($_GET['department_id'])) {
        $query .= " AND p.department_id = ?";
        $params[] = $_GET['department_id'];
    }
    
    $query .= " GROUP BY p.position_id ORDER BY p.position_name";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $positions = $stmt->fetchAll();
    
    Response::success($positions);
}

// GET single position
if ($method === 'GET' && preg_match('/\/positions\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::authenticate();
    $posId = $matches[1];
    
    $stmt = $db->prepare("
        SELECT p.*, d.department_name
        FROM positions p
        LEFT JOIN departments d ON p.department_id = d.department_id
        WHERE p.position_id = ?
    ");
    $stmt->execute([$posId]);
    $position = $stmt->fetch();
    
    if (!$position) {
        Response::notFound('Position not found');
    }
    
    Response::success($position);
}

// CREATE position
if ($method === 'POST') {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    
    $errors = Validator::validate([
        'position_name' => [
            'required' => ['value' => $data['position_name'] ?? '', 'name' => 'Position name'],
        ],
    ]);
    
    if (!empty($errors)) {
        Response::validationError($errors);
    }
    
    try {
        $stmt = $db->prepare("
            INSERT INTO positions (position_name, department_id, base_salary, description)
            VALUES (?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['position_name'],
            $data['department_id'] ?? null,
            $data['base_salary'] ?? 0,
            $data['description'] ?? null
        ]);
        
        Response::created([
            'position_id' => $db->lastInsertId()
        ], 'Position created successfully');
        
    } catch (PDOException $e) {
        Response::error('Failed to create position: ' . $e->getMessage());
    }
}

// UPDATE position
if ($method === 'PUT' && preg_match('/\/positions\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    $posId = $matches[1];
    
    try {
        $stmt = $db->prepare("
            UPDATE positions SET
                position_name = ?,
                department_id = ?,
                base_salary = ?,
                description = ?
            WHERE position_id = ?
        ");
        
        $stmt->execute([
            $data['position_name'],
            $data['department_id'] ?? null,
            $data['base_salary'] ?? 0,
            $data['description'] ?? null,
            $posId
        ]);
        
        Response::success(['position_id' => $posId], 'Position updated successfully');
        
    } catch (PDOException $e) {
        Response::error('Failed to update position: ' . $e->getMessage());
    }
}

// DELETE position
if ($method === 'DELETE' && preg_match('/\/positions\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin']);
    $posId = $matches[1];
    
    // Check if position has employees
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM employees WHERE position_id = ?");
    $stmt->execute([$posId]);
    $result = $stmt->fetch();
    
    if ($result['count'] > 0) {
        Response::error('Cannot delete position with employees. Please reassign employees first.');
    }
    
    $stmt = $db->prepare("DELETE FROM positions WHERE position_id = ?");
    $stmt->execute([$posId]);
    
    if ($stmt->rowCount() > 0) {
        Response::success(null, 'Position deleted successfully');
    } else {
        Response::notFound('Position not found');
    }
}

Response::error('Endpoint not found', 404);
