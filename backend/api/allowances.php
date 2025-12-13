<?php
/**
 * Allowances Management API
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$data = json_decode(file_get_contents("php://input"), true);

// GET all allowances
if ($method === 'GET' && !preg_match('/\/allowances\.php\/\d+/', $uri)) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    
    $query = "SELECT * FROM allowances WHERE 1=1";
    $params = [];
    
    if (isset($_GET['is_active'])) {
        $query .= " AND is_active = ?";
        $params[] = $_GET['is_active'];
    }
    
    $query .= " ORDER BY allowance_name";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $allowances = $stmt->fetchAll();
    
    Response::success($allowances);
}

// GET single allowance
if ($method === 'GET' && preg_match('/\/allowances\.php\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    $allowanceId = $matches[1];
    
    $stmt = $db->prepare("SELECT * FROM allowances WHERE allowance_id = ?");
    $stmt->execute([$allowanceId]);
    $allowance = $stmt->fetch();
    
    if (!$allowance) {
        Response::notFound('Allowance not found');
    }
    
    Response::success($allowance);
}

// CREATE allowance
if ($method === 'POST') {
    $user = AuthMiddleware::checkRole(['admin']);
    
    try {
        $stmt = $db->prepare("
            INSERT INTO allowances (allowance_name, allowance_code, amount, allowance_type, description, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['allowance_name'],
            $data['allowance_code'],
            $data['amount'] ?? 0,
            $data['allowance_type'] ?? 'fixed',
            $data['description'] ?? null,
            $data['is_active'] ?? 1
        ]);
        
        Response::created([
            'allowance_id' => $db->lastInsertId()
        ], 'Allowance created successfully');
        
    } catch (PDOException $e) {
        Response::error('Failed to create allowance: ' . $e->getMessage());
    }
}

// UPDATE allowance
if ($method === 'PUT' && preg_match('/\/allowances\.php\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin']);
    $allowanceId = $matches[1];
    
    try {
        $stmt = $db->prepare("
            UPDATE allowances SET
                allowance_name = ?,
                allowance_code = ?,
                amount = ?,
                allowance_type = ?,
                description = ?,
                is_active = ?
            WHERE allowance_id = ?
        ");
        
        $stmt->execute([
            $data['allowance_name'],
            $data['allowance_code'],
            $data['amount'],
            $data['allowance_type'],
            $data['description'],
            $data['is_active'],
            $allowanceId
        ]);
        
        Response::success(['allowance_id' => $allowanceId], 'Allowance updated successfully');
        
    } catch (PDOException $e) {
        Response::error('Failed to update allowance: ' . $e->getMessage());
    }
}

// DELETE allowance
if ($method === 'DELETE' && preg_match('/\/allowances\.php\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin']);
    $allowanceId = $matches[1];
    
    $stmt = $db->prepare("DELETE FROM allowances WHERE allowance_id = ?");
    $stmt->execute([$allowanceId]);
    
    if ($stmt->rowCount() > 0) {
        Response::success(null, 'Allowance deleted successfully');
    } else {
        Response::notFound('Allowance not found');
    }
}

Response::error('Endpoint not found', 404);
