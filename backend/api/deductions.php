<?php
/**
 * Deductions Management API
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

// GET all deductions
if ($method === 'GET' && !preg_match('/\/deductions\.php\/\d+/', $uri)) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    
    $query = "SELECT * FROM deductions WHERE 1=1";
    $params = [];
    
    if (isset($_GET['is_active'])) {
        $query .= " AND is_active = ?";
        $params[] = $_GET['is_active'];
    }
    
    if (isset($_GET['deduction_type'])) {
        $query .= " AND deduction_type = ?";
        $params[] = $_GET['deduction_type'];
    }
    
    $query .= " ORDER BY deduction_name";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $deductions = $stmt->fetchAll();
    
    Response::success($deductions);
}

// GET single deduction
if ($method === 'GET' && preg_match('/\/deductions\.php\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    $deductionId = $matches[1];
    
    $stmt = $db->prepare("SELECT * FROM deductions WHERE deduction_id = ?");
    $stmt->execute([$deductionId]);
    $deduction = $stmt->fetch();
    
    if (!$deduction) {
        Response::notFound('Deduction not found');
    }
    
    Response::success($deduction);
}

// CREATE deduction
if ($method === 'POST') {
    $user = AuthMiddleware::checkRole(['admin']);
    
    try {
        $stmt = $db->prepare("
            INSERT INTO deductions (deduction_name, deduction_code, deduction_type, rate, description, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['deduction_name'],
            $data['deduction_code'],
            $data['deduction_type'] ?? 'other',
            $data['rate'] ?? 0,
            $data['description'] ?? null,
            $data['is_active'] ?? 1
        ]);
        
        Response::created([
            'deduction_id' => $db->lastInsertId()
        ], 'Deduction created successfully');
        
    } catch (PDOException $e) {
        Response::error('Failed to create deduction: ' . $e->getMessage());
    }
}

// UPDATE deduction
if ($method === 'PUT' && preg_match('/\/deductions\.php\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin']);
    $deductionId = $matches[1];
    
    try {
        $stmt = $db->prepare("
            UPDATE deductions SET
                deduction_name = ?,
                deduction_code = ?,
                deduction_type = ?,
                rate = ?,
                description = ?,
                is_active = ?
            WHERE deduction_id = ?
        ");
        
        $stmt->execute([
            $data['deduction_name'],
            $data['deduction_code'],
            $data['deduction_type'],
            $data['rate'],
            $data['description'],
            $data['is_active'],
            $deductionId
        ]);
        
        Response::success(['deduction_id' => $deductionId], 'Deduction updated successfully');
        
    } catch (PDOException $e) {
        Response::error('Failed to update deduction: ' . $e->getMessage());
    }
}

// DELETE deduction
if ($method === 'DELETE' && preg_match('/\/deductions\.php\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin']);
    $deductionId = $matches[1];
    
    $stmt = $db->prepare("DELETE FROM deductions WHERE deduction_id = ?");
    $stmt->execute([$deductionId]);
    
    if ($stmt->rowCount() > 0) {
        Response::success(null, 'Deduction deleted successfully');
    } else {
        Response::notFound('Deduction not found');
    }
}

Response::error('Endpoint not found', 404);
