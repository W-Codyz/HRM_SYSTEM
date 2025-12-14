<?php
/**
 * Face Recognition API Proxy
 * PHP endpoints to communicate with Python Face Recognition service
 */

// Set timezone to Vietnam (UTC+7)
date_default_timezone_set('Asia/Ho_Chi_Minh');

// Load CORS config first
require_once __DIR__ . '/../config/cors.php';

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$data = json_decode(file_get_contents("php://input"), true);

// Python service URL
define('PYTHON_API_URL', 'http://localhost:5000/api');

/**
 * Call Python Face Recognition API
 */
function callPythonAPI($endpoint, $method = 'GET', $data = null, $files = null) {
    $url = PYTHON_API_URL . $endpoint;
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        
        if ($files) {
            // Handle file upload
            curl_setopt($ch, CURLOPT_POSTFIELDS, $files);
        } elseif ($data) {
            // Handle JSON data
            $json = json_encode($data);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Content-Length: ' . strlen($json)
            ]);
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($error) {
        return [
            'success' => false,
            'message' => 'Lỗi kết nối đến dịch vụ nhận diện: ' . $error,
            'http_code' => 0
        ];
    }
    
    $result = json_decode($response, true);
    $result['http_code'] = $httpCode;
    
    return $result;
}

/**
 * Log face recognition activity
 */
function logFaceRecognition($db, $employeeId, $employeeCode, $action, $success, $confidence = null, $errorMessage = null) {
    try {
        $stmt = $db->prepare("
            INSERT INTO face_recognition_logs 
            (employee_id, employee_code, action, success, confidence, error_message, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        
        $stmt->execute([
            $employeeId,
            $employeeCode,
            $action,
            $success ? 1 : 0,
            $confidence,
            $errorMessage,
            $ipAddress
        ]);
    } catch (Exception $e) {
        error_log("Failed to log face recognition: " . $e->getMessage());
    }
}

// GET: Check Python service health
if ($method === 'GET' && strpos($uri, '/face-recognition/health') !== false) {
    $result = callPythonAPI('/health');
    Response::json($result);
}

// POST: Upload employee photo
if ($method === 'POST' && strpos($uri, '/face-recognition/upload-photo') !== false) {
    $user = AuthMiddleware::authenticate();
    
    // Check if file is uploaded
    if (!isset($_FILES['photo'])) {
        Response::error('Không tìm thấy file ảnh', 400);
    }
    
    $photo = $_FILES['photo'];
    
    // Validate file
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!in_array($photo['type'], $allowedTypes)) {
        Response::error('Chỉ chấp nhận file ảnh (JPG, PNG)', 400);
    }
    
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($photo['size'] > $maxSize) {
        Response::error('File ảnh quá lớn (tối đa 5MB)', 400);
    }
    
    // Get employee code from request or use current user's employee
    $employeeCode = $_POST['employee_code'] ?? null;
    
    // Debug logging
    error_log("Upload photo - User ID: " . $user['user_id']);
    error_log("Upload photo - Employee code from POST: " . ($employeeCode ?? 'null'));
    
    if (!$employeeCode) {
        // Get from current user
        $stmt = $db->prepare("SELECT employee_code FROM employees WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        $employee = $stmt->fetch(PDO::FETCH_ASSOC); // Fetch as array
        
        error_log("Upload photo - Employee found: " . ($employee ? 'yes' : 'no'));
        
        if (!$employee) {
            Response::error('Không tìm thấy thông tin nhân viên. Vui lòng liên hệ admin để tạo hồ sơ nhân viên.', 404);
        }
        
        $employeeCode = $employee['employee_code'];
    } else {
        // Verify employee code exists and user has permission
        if ($user['role'] !== 'admin') {
            $stmt = $db->prepare("SELECT employee_code FROM employees WHERE user_id = ? AND employee_code = ?");
            $stmt->execute([$user['user_id'], $employeeCode]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC); // Fetch as array
            if (!$result) {
                Response::error('Không có quyền upload ảnh cho nhân viên này', 403);
            }
        }
    }
    
    // Prepare file for Python API
    $cfile = new CURLFile($photo['tmp_name'], $photo['type'], $photo['name']);
    $postData = [
        'photo' => $cfile,
        'employee_code' => $employeeCode
    ];
    
    // Call Python API
    $result = callPythonAPI('/upload-photo', 'POST', null, $postData);
    
    // Log activity
    logFaceRecognition(
        $db,
        null,
        $employeeCode,
        'upload_photo',
        $result['success'] ?? false,
        null,
        $result['message'] ?? null
    );
    
    if ($result['success']) {
        Response::success($result);
    } else {
        Response::error($result['message'] ?? 'Upload ảnh thất bại', $result['http_code'] ?? 400);
    }
}

// POST: Verify photo contains valid face
if ($method === 'POST' && strpos($uri, '/face-recognition/verify-photo') !== false) {
    $user = AuthMiddleware::authenticate();
    
    if (!isset($_FILES['photo'])) {
        Response::error('Không tìm thấy file ảnh', 400);
    }
    
    $photo = $_FILES['photo'];
    
    $cfile = new CURLFile($photo['tmp_name'], $photo['type'], $photo['name']);
    $postData = ['photo' => $cfile];
    
    $result = callPythonAPI('/verify-photo', 'POST', null, $postData);
    Response::json($result);
}

// POST: Recognize face
if ($method === 'POST' && strpos($uri, '/face-recognition/recognize') !== false) {
    $user = AuthMiddleware::authenticate();
    
    if (!isset($_FILES['photo'])) {
        Response::error('Không tìm thấy file ảnh', 400);
    }
    
    $photo = $_FILES['photo'];
    
    $cfile = new CURLFile($photo['tmp_name'], $photo['type'], $photo['name']);
    $postData = ['photo' => $cfile];
    
    $result = callPythonAPI('/recognize', 'POST', null, $postData);
    
    // Log recognition attempt
    logFaceRecognition(
        $db,
        null,
        $result['employee']['employee_code'] ?? null,
        'recognition_attempt',
        $result['success'] ?? false,
        $result['confidence'] ?? null,
        $result['message'] ?? null
    );
    
    Response::json($result);
}

// POST: Attendance check (check-in/out with face recognition)
if ($method === 'POST' && strpos($uri, '/face-recognition/attendance-check') !== false) {
    $user = AuthMiddleware::authenticate();
    
    if (!isset($_FILES['photo'])) {
        Response::error('Không tìm thấy file ảnh', 400);
    }
    
    $photo = $_FILES['photo'];
    
    // Get employee code from current user
    $stmt = $db->prepare("SELECT employee_code FROM employees WHERE user_id = ?");
    $stmt->execute([$user['user_id']]);
    $employee = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$employee) {
        Response::error('Không tìm thấy thông tin nhân viên', 404);
    }
    
    $cfile = new CURLFile($photo['tmp_name'], $photo['type'], $photo['name']);
    $postData = [
        'photo' => $cfile,
        'employee_code' => $employee['employee_code']  // Pass expected employee code
    ];
    
    $result = callPythonAPI('/attendance/check', 'POST', null, $postData);
    
    // Log attendance check
    if (isset($result['employee'])) {
        logFaceRecognition(
            $db,
            $result['employee']['employee_id'] ?? null,
            $result['employee']['employee_code'] ?? null,
            $result['action'] ?? 'attendance_check',
            $result['success'] ?? false,
            $result['confidence'] ?? null,
            $result['message'] ?? null
        );
    }
    
    Response::json($result);
}

// GET: Get employees with photos
if ($method === 'GET' && strpos($uri, '/face-recognition/employees-with-photos') !== false) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    
    $result = callPythonAPI('/employees/with-photos');
    Response::json($result);
}

// GET: Get face recognition logs
if ($method === 'GET' && strpos($uri, '/face-recognition/logs') !== false) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    
    $query = "
        SELECT l.*, e.full_name, e.employee_code
        FROM face_recognition_logs l
        LEFT JOIN employees e ON l.employee_id = e.employee_id
        ORDER BY l.created_at DESC
        LIMIT 100
    ";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $logs = $stmt->fetchAll();
    
    Response::success($logs);
}

// GET: Check if employee has photo
if ($method === 'GET' && preg_match('/\/face-recognition\/employee\/([^\/]+)\/has-photo/', $uri, $matches)) {
    $user = AuthMiddleware::authenticate();
    $employeeCode = $matches[1];
    
    // Check permission
    if ($user['role'] !== 'admin') {
        $stmt = $db->prepare("SELECT employee_code FROM employees WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        $employee = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$employee || $employee['employee_code'] !== $employeeCode) {
            Response::error('Không có quyền xem thông tin này', 403);
        }
    }
    
    $stmt = $db->prepare("
        SELECT employee_id, employee_code, full_name, face_photo
        FROM employees
        WHERE employee_code = ?
    ");
    $stmt->execute([$employeeCode]);
    $employee = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$employee) {
        Response::notFound('Không tìm thấy nhân viên');
    }
    
    Response::success([
        'employee_code' => $employee['employee_code'],
        'full_name' => $employee['full_name'],
        'has_photo' => !empty($employee['face_photo']),
        'face_photo' => $employee['face_photo']
    ]);
}

Response::error('Endpoint không tồn tại', 404);
