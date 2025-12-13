<?php
/**
 * Authentication API
 * Login, Register, Logout endpoints
 */

// Set timezone to Vietnam (UTC+7)
date_default_timezone_set('Asia/Ho_Chi_Minh');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../vendor/autoload.php';

use \Firebase\JWT\JWT;

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

// Parse request
$data = json_decode(file_get_contents("php://input"), true);

// REGISTER
if ($method === 'POST' && strpos($uri, '/register') !== false) {
    
    // Validation
    $errors = Validator::validate([
        'username' => [
            'required' => ['value' => $data['username'] ?? '', 'name' => 'Username'],
            'min' => ['value' => $data['username'] ?? '', 'length' => 3, 'name' => 'Username'],
        ],
        'email' => [
            'required' => ['value' => $data['email'] ?? '', 'name' => 'Email'],
            'email' => ['value' => $data['email'] ?? ''],
        ],
        'password' => [
            'required' => ['value' => $data['password'] ?? '', 'name' => 'Password'],
            'min' => ['value' => $data['password'] ?? '', 'length' => 6, 'name' => 'Password'],
        ],
    ]);

    if (!empty($errors)) {
        Response::validationError($errors);
    }

    // Check if username or email exists
    $stmt = $db->prepare("SELECT user_id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$data['username'], $data['email']]);
    
    if ($stmt->rowCount() > 0) {
        Response::error('Username or email already exists');
    }

    // Hash password
    $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);

    // Insert user
    $stmt = $db->prepare("INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, 'employee', 'pending')");
    
    try {
        $stmt->execute([
            $data['username'],
            $data['email'],
            $passwordHash
        ]);

        Response::created([
            'user_id' => $db->lastInsertId(),
            'username' => $data['username'],
            'email' => $data['email'],
            'status' => 'pending'
        ], 'Registration successful. Waiting for admin approval.');

    } catch (PDOException $e) {
        Response::error('Registration failed: ' . $e->getMessage());
    }
}

// LOGIN
if ($method === 'POST' && strpos($uri, '/login') !== false) {
    
    // Validation
    $errors = Validator::validate([
        'username' => [
            'required' => ['value' => $data['username'] ?? '', 'name' => 'Username'],
        ],
        'password' => [
            'required' => ['value' => $data['password'] ?? '', 'name' => 'Password'],
        ],
    ]);

    if (!empty($errors)) {
        Response::validationError($errors);
    }

    // Get user
    $stmt = $db->prepare("
        SELECT u.*, e.employee_id, e.full_name, e.avatar, e.department_id, e.position_id
        FROM users u
        LEFT JOIN employees e ON u.user_id = e.user_id
        WHERE u.username = ? OR u.email = ?
        LIMIT 1
    ");
    $stmt->execute([$data['username'], $data['username']]);
    $user = $stmt->fetch();

    if (!$user) {
        Response::error('Invalid credentials', 401);
    }

    // Check password
    if (!password_verify($data['password'], $user['password_hash'])) {
        Response::error('Invalid credentials', 401);
    }

    // Check status
    if ($user['status'] !== 'active') {
        $message = $user['status'] === 'pending' 
            ? 'Your account is pending approval' 
            : 'Your account is ' . $user['status'];
        Response::error($message, 403);
    }

    // Generate JWT
    $issuedAt = time();
    $expirationTime = $issuedAt + JWT_EXPIRATION_TIME;
    $payload = [
        'iat' => $issuedAt,
        'exp' => $expirationTime,
        'iss' => JWT_ISSUER,
        'data' => [
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'employee_id' => $user['employee_id'],
            'department_id' => $user['department_id'],
            'position_id' => $user['position_id']
        ]
    ];

    $jwt = JWT::encode($payload, JWT_SECRET_KEY, JWT_ALGORITHM);

    // Update last login
    $stmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE user_id = ?");
    $stmt->execute([$user['user_id']]);

    Response::success([
        'token' => $jwt,
        'expires_in' => JWT_EXPIRATION_TIME,
        'user' => [
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'employee_id' => $user['employee_id'],
            'full_name' => $user['full_name'],
            'avatar' => $user['avatar'],
            'department_id' => $user['department_id'],
            'position_id' => $user['position_id']
        ]
    ], 'Login successful');
}

// CHANGE PASSWORD
if ($method === 'PUT' && strpos($uri, '/change-password') !== false) {
    $user = AuthMiddleware::authenticate();
    
    // Validation
    $errors = Validator::validate([
        'current_password' => [
            'required' => ['value' => $data['current_password'] ?? '', 'name' => 'Current password'],
        ],
        'new_password' => [
            'required' => ['value' => $data['new_password'] ?? '', 'name' => 'New password'],
            'min' => ['value' => $data['new_password'] ?? '', 'length' => 6, 'name' => 'New password'],
        ],
    ]);

    if (!empty($errors)) {
        Response::validationError($errors);
    }

    // Get current user password
    $stmt = $db->prepare("SELECT password_hash FROM users WHERE user_id = ?");
    $stmt->execute([$user->user_id]);
    $userData = $stmt->fetch();

    if (!$userData) {
        Response::error('User not found', 404);
    }

    // Verify current password
    if (!password_verify($data['current_password'], $userData['password_hash'])) {
        Response::error('Current password is incorrect', 401);
    }

    // Hash new password
    $newPasswordHash = password_hash($data['new_password'], PASSWORD_BCRYPT);

    // Update password
    $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
    
    try {
        $stmt->execute([$newPasswordHash, $user->user_id]);
        Response::success(null, 'Password changed successfully');
    } catch (PDOException $e) {
        Response::error('Failed to change password: ' . $e->getMessage());
    }
}

// If no route matched
Response::error('Endpoint not found', 404);
