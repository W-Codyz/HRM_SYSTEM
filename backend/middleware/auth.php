<?php
/**
 * Authentication Middleware
 * Verify JWT token and user permissions
 */

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/jwt.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

class AuthMiddleware {
    
    private static function sendError($message, $code = 401) {
        // Set CORS headers
        header("Access-Control-Allow-Origin: http://localhost:3000");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
        header("Content-Type: application/json; charset=UTF-8");
        
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message
        ]);
        exit();
    }
    
    public static function authenticate() {
        $headers = getallheaders();
        
        if (!isset($headers['Authorization'])) {
            self::sendError('No authorization token provided', 401);
        }

        $authHeader = $headers['Authorization'];
        $arr = explode(' ', $authHeader);

        if (count($arr) !== 2 || $arr[0] !== 'Bearer') {
            self::sendError('Invalid authorization format', 401);
        }

        $jwt = $arr[1];

        try {
            $decoded = JWT::decode($jwt, new Key(JWT_SECRET_KEY, JWT_ALGORITHM));
            // Convert object to array
            return json_decode(json_encode($decoded->data), true);
        } catch (Exception $e) {
            self::sendError('Access denied: ' . $e->getMessage(), 401);
        }
    }

    public static function checkRole($allowedRoles = []) {
        $user = self::authenticate();
        
        if (!in_array($user['role'], $allowedRoles)) {
            self::sendError('You do not have permission to access this resource', 403);
        }

        return $user;
    }
}
