<?php
/**
 * Notification Helper
 * Create notifications for various system events
 */

class NotificationHelper {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    /**
     * Create a notification
     */
    public function createNotification($userId, $title, $message, $type = 'info', $link = null) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, 0, NOW())
            ");
            $stmt->execute([$userId, $title, $message, $type, $link]);
            return $this->db->lastInsertId();
        } catch (Exception $e) {
            error_log("Error creating notification: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Notify all admins
     */
    public function notifyAdmins($title, $message, $type = 'info', $link = null) {
        try {
            $stmt = $this->db->query("SELECT user_id FROM users WHERE role = 'admin'");
            $admins = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            foreach ($admins as $adminId) {
                $this->createNotification($adminId, $title, $message, $type, $link);
            }
            return true;
        } catch (Exception $e) {
            error_log("Error notifying admins: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Notify employee when leave request is approved/rejected
     */
    public function notifyLeaveRequestStatus($employeeUserId, $status, $leaveType, $startDate, $endDate) {
        $statusText = $status === 'approved' ? 'đã được phê duyệt' : 'đã bị từ chối';
        $type = $status === 'approved' ? 'success' : 'error';
        
        $title = "Đơn nghỉ phép " . ($status === 'approved' ? '✅ Đã duyệt' : '❌ Từ chối');
        $message = "Đơn {$leaveType} từ {$startDate} đến {$endDate} {$statusText}.";
        
        $this->createNotification($employeeUserId, $title, $message, $type, '/employee/leave-requests');
    }
    
    /**
     * Notify admins when new leave request submitted
     */
    public function notifyNewLeaveRequest($employeeName, $leaveType, $startDate, $endDate) {
        $title = "📝 Đơn nghỉ phép mới";
        $message = "{$employeeName} đã gửi đơn {$leaveType} từ {$startDate} đến {$endDate}.";
        
        $this->notifyAdmins($title, $message, 'info', '/admin/leave-requests');
    }
    
    /**
     * Notify employee about payroll
     */
    public function notifyPayroll($employeeUserId, $month, $year, $netSalary, $status) {
        $statusText = [
            'pending' => 'đang chờ duyệt',
            'approved' => 'đã được duyệt',
            'paid' => 'đã thanh toán',
            'need_review' => 'cần xem lại'
        ][$status] ?? $status;
        
        $title = "💰 Bảng lương tháng {$month}/{$year}";
        $message = "Bảng lương của bạn {$statusText}. Lương net: " . number_format($netSalary, 0, ',', '.') . " VNĐ";
        $type = $status === 'paid' ? 'success' : 'info';
        
        $this->createNotification($employeeUserId, $title, $message, $type, '/employee/payroll');
    }
    
    /**
     * Notify admins when payroll needs review
     */
    public function notifyPayrollNeedReview($employeeName, $month, $year) {
        $title = "⚠️ Bảng lương cần xem lại";
        $message = "{$employeeName} yêu cầu xem lại bảng lương tháng {$month}/{$year}.";
        
        $this->notifyAdmins($title, $message, 'warning', '/admin/payroll');
    }
    
    /**
     * Notify employee when their attendance is edited
     */
    public function notifyAttendanceEdited($employeeUserId, $employeeName, $date, $editorName) {
        $title = "⏰ Chấm công được chỉnh sửa";
        $message = "{$editorName} đã chỉnh sửa chấm công của bạn ngày {$date}.";
        
        $this->createNotification($employeeUserId, $title, $message, 'warning', '/employee/attendance');
    }
    
    /**
     * Notify user when registration is approved
     */
    public function notifyRegistrationApproved($userId, $username) {
        $title = "🎉 Tài khoản đã được phê duyệt";
        $message = "Chúc mừng! Tài khoản {$username} của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay bây giờ.";
        
        $this->createNotification($userId, $title, $message, 'success', '/login');
    }
    
    /**
     * Notify admins of new registration
     */
    public function notifyNewRegistration($username, $email) {
        $title = "👤 Đăng ký mới chờ phê duyệt";
        $message = "Người dùng mới: {$username} ({$email}) đang chờ được phê duyệt.";
        
        $this->notifyAdmins($title, $message, 'info', '/admin/users');
    }
    
    /**
     * Notify employee about attendance issue
     */
    public function notifyAttendanceIssue($employeeUserId, $date, $issue) {
        $title = "⏰ Vấn đề chấm công";
        $message = "Có vấn đề với chấm công ngày {$date}: {$issue}";
        
        $this->createNotification($employeeUserId, $title, $message, 'warning', '/employee/attendance');
    }
    
    /**
     * Notify manager when employee checks in/out
     */
    public function notifyManagerAttendance($managerUserId, $employeeName, $action, $time) {
        $actionText = $action === 'checkin' ? 'vào' : 'ra';
        $icon = $action === 'checkin' ? '📥' : '📤';
        
        $title = "{$icon} Chấm công {$actionText}";
        $message = "{$employeeName} đã chấm công {$actionText} lúc {$time}.";
        
        $this->createNotification($managerUserId, $title, $message, 'info', '/employee/team-attendance');
    }
    
    /**
     * Notify all employees when payroll is generated
     */
    public function notifyAllEmployeesPayrollGenerated($month, $year) {
        try {
            // Get all active employees with user accounts
            $stmt = $this->db->query("
                SELECT DISTINCT e.user_id 
                FROM employees e
                WHERE e.status = 'active' AND e.user_id IS NOT NULL
            ");
            $employees = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $title = "💰 Bảng lương tháng {$month}/{$year} đã sẵn sàng";
            $message = "Bảng lương tháng {$month}/{$year} đã được tính toán. Vui lòng kiểm tra và xác nhận.";
            
            foreach ($employees as $userId) {
                $this->createNotification($userId, $title, $message, 'success', '/employee/payroll');
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Error notifying employees about payroll: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Notify manager when their team member submits leave request
     */
    public function notifyManagerNewLeaveRequest($managerUserId, $employeeName, $leaveType, $startDate, $endDate) {
        $title = "📝 Đơn nghỉ phép mới từ nhóm";
        $message = "{$employeeName} đã gửi đơn {$leaveType} từ {$startDate} đến {$endDate}.";
        
        $this->createNotification($managerUserId, $title, $message, 'info', '/employee/leave-approvals');
    }
}
