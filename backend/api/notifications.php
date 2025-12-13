<?php
/**
 * Notifications API
 * Manage user notifications
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

// GET unread count
if ($method === 'GET' && strpos($uri, '/unread-count') !== false) {
    $user = AuthMiddleware::authenticate();
    
    $stmt = $db->prepare("
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ? AND is_read = 0
    ");
    $stmt->execute([$user->user_id]);
    $count = $stmt->fetch()['count'];
    
    Response::success(['count' => (int)$count]);
}

// GET all notifications for user
if ($method === 'GET' && strpos($uri, '/unread-count') === false) {
    $user = AuthMiddleware::authenticate();
    
    $limit = $_GET['limit'] ?? 50;
    
    $stmt = $db->prepare("
        SELECT *
        FROM notifications
        WHERE user_id = ? OR user_id IS NULL
        ORDER BY created_at DESC
        LIMIT ?
    ");
    $stmt->execute([$user->user_id, (int)$limit]);
    $notifications = $stmt->fetchAll();
    
    Response::success($notifications);
}

// Mark notification as read
if ($method === 'PUT' && strpos($uri, '/read') !== false) {
    $user = AuthMiddleware::authenticate();
    
    preg_match('/\/notifications\/(\d+)\/read/', $uri, $matches);
    $notificationId = $matches[1] ?? null;
    
    if (!$notificationId) {
        Response::error('Notification ID is required');
    }
    
    $stmt = $db->prepare("
        UPDATE notifications 
        SET is_read = 1 
        WHERE notification_id = ? AND user_id = ?
    ");
    $stmt->execute([$notificationId, $user->user_id]);
    
    Response::success(null, 'Notification marked as read');
}

// Mark all notifications as read
if ($method === 'PUT' && strpos($uri, '/mark-all-read') !== false) {
    $user = AuthMiddleware::authenticate();
    
    $stmt = $db->prepare("
        UPDATE notifications 
        SET is_read = 1 
        WHERE user_id = ? AND is_read = 0
    ");
    $stmt->execute([$user->user_id]);
    
    Response::success(null, 'All notifications marked as read');
}

// Create notification (Admin only)
if ($method === 'POST') {
    $user = AuthMiddleware::checkRole(['admin']);
    
    if (!isset($data['title']) || !isset($data['message'])) {
        Response::error('Title and message are required');
    }
    
    $stmt = $db->prepare("
        INSERT INTO notifications (user_id, title, message, type, is_read)
        VALUES (?, ?, ?, ?, 0)
    ");
    
    $userId = $data['user_id'] ?? null;
    $type = $data['type'] ?? 'info';
    
    $stmt->execute([
        $userId,
        $data['title'],
        $data['message'],
        $type
    ]);
    
    Response::success(['notification_id' => $db->lastInsertId()], 'Notification created');
}

Response::error('Endpoint not found', 404);
