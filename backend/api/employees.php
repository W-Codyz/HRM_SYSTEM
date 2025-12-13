<?php
/**
 * Employees Management API
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

// GET all employees
if ($method === 'GET' && !preg_match('/\/employees\/\d+/', $uri)) {
    $user = AuthMiddleware::authenticate();
    
    $query = "
        SELECT e.*, 
               d.department_name, 
               p.position_name,
               u.username,
               u.email as user_email,
               u.status as account_status
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.department_id
        LEFT JOIN positions p ON e.position_id = p.position_id
        LEFT JOIN users u ON e.user_id = u.user_id
        WHERE 1=1
    ";    $params = [];
    
    // Filter by department
    if (isset($_GET['department_id'])) {
        $query .= " AND e.department_id = ?";
        $params[] = $_GET['department_id'];
    }
    
    // Filter by status
    if (isset($_GET['status'])) {
        $query .= " AND e.status = ?";
        $params[] = $_GET['status'];
    }
    
    // Search by name or code
    if (isset($_GET['search'])) {
        $query .= " AND (e.full_name LIKE ? OR e.employee_code LIKE ?)";
        $searchTerm = '%' . $_GET['search'] . '%';
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    $query .= " ORDER BY e.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $employees = $stmt->fetchAll();
    
    Response::success($employees);
}

// GET single employee
if ($method === 'GET' && preg_match('/\/employees\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::authenticate();
    $employeeId = $matches[1];
    
    $stmt = $db->prepare("
        SELECT e.*,
               d.department_name,
               p.position_name,
               u.username,
               u.email as user_email,
               u.role,
               u.status as account_status
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.department_id
        LEFT JOIN positions p ON e.position_id = p.position_id
        LEFT JOIN users u ON e.user_id = u.user_id
        WHERE e.employee_id = ?
    ");
    $stmt->execute([$employeeId]);
    $employee = $stmt->fetch();
    
    if (!$employee) {
        Response::notFound('Employee not found');
    }
    
    Response::success($employee);
}

// CREATE employee
if ($method === 'POST') {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    
    // Debug log
    error_log('Received employee data: ' . print_r($data, true));
    
    // Validation
    $errors = Validator::validate([
        'employee_code' => [
            'required' => ['value' => $data['employee_code'] ?? '', 'name' => 'Employee code'],
        ],
        'full_name' => [
            'required' => ['value' => $data['full_name'] ?? '', 'name' => 'Full name'],
        ],
        'hire_date' => [
            'required' => ['value' => $data['hire_date'] ?? '', 'name' => 'Hire date'],
            'date' => ['value' => $data['hire_date'] ?? ''],
        ],
    ]);
    
    if (!empty($errors)) {
        Response::validationError($errors);
    }
    
    // Check if employee code exists
    $stmt = $db->prepare("SELECT employee_id FROM employees WHERE employee_code = ?");
    $stmt->execute([$data['employee_code']]);
    if ($stmt->rowCount() > 0) {
        Response::error('Employee code already exists');
    }
    
    try {
        // Prepare values - convert empty strings to null
        $dateOfBirth = !empty($data['date_of_birth']) ? $data['date_of_birth'] : null;
        $salary = !empty($data['salary']) && $data['salary'] !== '' ? $data['salary'] : null;
        $departmentId = !empty($data['department_id']) ? $data['department_id'] : null;
        $positionId = !empty($data['position_id']) ? $data['position_id'] : null;
        $email = !empty($data['email']) ? $data['email'] : null;
        $username = !empty($data['username']) ? $data['username'] : null;
        
        // Start transaction
        $db->beginTransaction();
        
        // Check if position is "Trưởng phòng" (Manager) and department already has a manager
        if ($positionId && $departmentId) {
            // Get position name to check if it's manager role
            $stmt = $db->prepare("SELECT position_name FROM positions WHERE position_id = ?");
            $stmt->execute([$positionId]);
            $position = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($position && (stripos($position['position_name'], 'trưởng phòng') !== false || 
                              stripos($position['position_name'], 'manager') !== false)) {
                // Check if department already has a manager
                $stmt = $db->prepare("SELECT manager_id, department_name FROM departments WHERE department_id = ?");
                $stmt->execute([$departmentId]);
                $department = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($department && $department['manager_id']) {
                    $db->rollBack();
                    Response::error("Phòng ban '{$department['department_name']}' đã có trưởng phòng. Vui lòng chọn chức vụ khác hoặc phòng ban khác.");
                }
            }
        }
        
        $userId = null;
        
        // Create user account if username is provided
        if ($username && $email) {
            // Check if username exists
            $stmt = $db->prepare("SELECT user_id FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->rowCount() > 0) {
                $db->rollBack();
                Response::error('Username already exists');
            }
            
            // Check if email exists in users table
            $stmt = $db->prepare("SELECT user_id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->rowCount() > 0) {
                $db->rollBack();
                Response::error('Email already exists in users table');
            }
            
            // Generate password: username + date_of_birth (format: ddmmyyyy)
            // Example: teo + 16-09-2005 = teo16092005
            $password = $username;
            if ($dateOfBirth) {
                // Convert date from yyyy-mm-dd to ddmmyyyy
                $dateParts = explode('-', $dateOfBirth);
                if (count($dateParts) === 3) {
                    $password = $username . $dateParts[2] . $dateParts[1] . $dateParts[0];
                }
            }
            
            // Hash password
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            
            // Insert user
            $stmt = $db->prepare("
                INSERT INTO users (username, email, password_hash, role, status)
                VALUES (?, ?, ?, 'employee', 'active')
            ");
            $stmt->execute([$username, $email, $passwordHash]);
            $userId = $db->lastInsertId();
            
            error_log('Created user account - Username: ' . $username . ', Password: ' . $password . ', UserID: ' . $userId);
        }
        
        $sql = "
            INSERT INTO employees (
                employee_code, full_name, gender, date_of_birth, phone, email, address,
                department_id, position_id, hire_date, contract_type, contract_start,
                contract_end, salary, bank_account, bank_name, tax_code, insurance_number,
                education_level, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";
        
        $values = [
            $data['employee_code'],
            $data['full_name'],
            $data['gender'] ?? null,
            $dateOfBirth,
            $data['phone'] ?? null,
            $email,
            $data['address'] ?? null,
            $departmentId,
            $positionId,
            $data['hire_date'],
            $data['contract_type'] ?? 'fulltime',
            $data['contract_start'] ?? null,
            $data['contract_end'] ?? null,
            $salary,
            $data['bank_account'] ?? null,
            $data['bank_name'] ?? null,
            $data['tax_code'] ?? null,
            $data['insurance_number'] ?? null,
            $data['education_level'] ?? null,
            $userId
        ];
        
        // Log SQL and values
        error_log('SQL: ' . $sql);
        error_log('Values: ' . print_r($values, true));
        
        $stmt = $db->prepare($sql);
        $stmt->execute($values);
        
        $employeeId = $db->lastInsertId();
        
        // If position is "Trưởng phòng", update department's manager_id
        if ($positionId && $departmentId) {
            $stmt = $db->prepare("SELECT position_name FROM positions WHERE position_id = ?");
            $stmt->execute([$positionId]);
            $position = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($position && (stripos($position['position_name'], 'trưởng phòng') !== false || 
                              stripos($position['position_name'], 'manager') !== false)) {
                // Update department's manager_id
                $stmt = $db->prepare("UPDATE departments SET manager_id = ? WHERE department_id = ?");
                $stmt->execute([$employeeId, $departmentId]);
                
                error_log("Updated department {$departmentId} manager_id to employee {$employeeId}");
            }
        }
        
        // Commit transaction
        $db->commit();
        
        // Log created employee
        error_log('Created employee ID: ' . $employeeId . ' with data: ' . print_r($data, true));
        
        Response::created(['employee_id' => $employeeId], 'Employee created successfully');
        
    } catch (PDOException $e) {
        // Rollback on error
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        Response::error('Failed to create employee: ' . $e->getMessage());
    }
}

// UPDATE employee
if ($method === 'PUT' && preg_match('/\/employees\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin', 'manager']);
    $employeeId = $matches[1];
    
    try {
        // Start transaction
        $db->beginTransaction();
        
        // Get current employee info to check if they have a user_id
        $stmt = $db->prepare("SELECT user_id, email, department_id, position_id FROM employees WHERE employee_id = ?");
        $stmt->execute([$employeeId]);
        $currentEmployee = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$currentEmployee) {
            $db->rollBack();
            Response::notFound('Employee not found');
        }
        
        $newPositionId = $data['position_id'] ?? null;
        $newDepartmentId = $data['department_id'] ?? null;
        
        // Check if new position is "Trưởng phòng" and department already has a manager
        if ($newPositionId && $newDepartmentId) {
            $stmt = $db->prepare("SELECT position_name FROM positions WHERE position_id = ?");
            $stmt->execute([$newPositionId]);
            $position = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($position && (stripos($position['position_name'], 'trưởng phòng') !== false || 
                              stripos($position['position_name'], 'manager') !== false)) {
                // Check if department already has a different manager
                $stmt = $db->prepare("SELECT manager_id, department_name FROM departments WHERE department_id = ?");
                $stmt->execute([$newDepartmentId]);
                $department = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($department && $department['manager_id'] && $department['manager_id'] != $employeeId) {
                    $db->rollBack();
                    Response::error("Phòng ban '{$department['department_name']}' đã có trưởng phòng khác. Vui lòng chọn chức vụ khác hoặc phòng ban khác.");
                }
            }
        }
        
        // Update employee table
        $stmt = $db->prepare("
            UPDATE employees SET
                full_name = ?, gender = ?, date_of_birth = ?, phone = ?, email = ?, address = ?,
                department_id = ?, position_id = ?, contract_type = ?, contract_start = ?,
                contract_end = ?, salary = ?, bank_account = ?, bank_name = ?, tax_code = ?,
                insurance_number = ?, education_level = ?, status = ?
            WHERE employee_id = ?
        ");
        
        $stmt->execute([
            $data['full_name'],
            $data['gender'] ?? null,
            $data['date_of_birth'] ?? null,
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['address'] ?? null,
            $data['department_id'] ?? null,
            $data['position_id'] ?? null,
            $data['contract_type'] ?? 'fulltime',
            $data['contract_start'] ?? null,
            $data['contract_end'] ?? null,
            $data['salary'] ?? 0,
            $data['bank_account'] ?? null,
            $data['bank_name'] ?? null,
            $data['tax_code'] ?? null,
            $data['insurance_number'] ?? null,
            $data['education_level'] ?? null,
            $data['status'] ?? 'active',
            $employeeId
        ]);
        
        // If employee has a user account AND email has changed, update users table too
        if ($currentEmployee['user_id'] && isset($data['email'])) {
            $newEmail = $data['email'];
            $oldEmail = $currentEmployee['email'];
            
            // Only update if email actually changed
            if ($newEmail !== $oldEmail && !empty($newEmail)) {
                // Check if new email already exists in users table (for other users)
                $stmt = $db->prepare("SELECT user_id FROM users WHERE email = ? AND user_id != ?");
                $stmt->execute([$newEmail, $currentEmployee['user_id']]);
                
                if ($stmt->rowCount() > 0) {
                    $db->rollBack();
                    Response::error('Email already exists for another user');
                }
                
                // Update email in users table
                $stmt = $db->prepare("UPDATE users SET email = ? WHERE user_id = ?");
                $stmt->execute([$newEmail, $currentEmployee['user_id']]);
                
                error_log("Updated email in users table for user_id: {$currentEmployee['user_id']} from {$oldEmail} to {$newEmail}");
            }
        }
        
        // Handle manager_id updates in departments table
        $oldPositionId = $currentEmployee['position_id'];
        $oldDepartmentId = $currentEmployee['department_id'];
        
        // Check if old position was manager - need to remove from department
        if ($oldPositionId) {
            $stmt = $db->prepare("SELECT position_name FROM positions WHERE position_id = ?");
            $stmt->execute([$oldPositionId]);
            $oldPosition = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $wasManager = $oldPosition && (stripos($oldPosition['position_name'], 'trưởng phòng') !== false || 
                                          stripos($oldPosition['position_name'], 'manager') !== false);
            
            // If was manager and (position changed OR department changed), remove from old department
            if ($wasManager && ($oldPositionId != $newPositionId || $oldDepartmentId != $newDepartmentId)) {
                if ($oldDepartmentId) {
                    $stmt = $db->prepare("UPDATE departments SET manager_id = NULL WHERE department_id = ? AND manager_id = ?");
                    $stmt->execute([$oldDepartmentId, $employeeId]);
                    error_log("Removed employee {$employeeId} as manager from department {$oldDepartmentId}");
                }
            }
        }
        
        // Check if new position is manager - need to add to department
        if ($newPositionId && $newDepartmentId) {
            $stmt = $db->prepare("SELECT position_name FROM positions WHERE position_id = ?");
            $stmt->execute([$newPositionId]);
            $newPosition = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $isManager = $newPosition && (stripos($newPosition['position_name'], 'trưởng phòng') !== false || 
                                         stripos($newPosition['position_name'], 'manager') !== false);
            
            if ($isManager) {
                // Update department's manager_id
                $stmt = $db->prepare("UPDATE departments SET manager_id = ? WHERE department_id = ?");
                $stmt->execute([$employeeId, $newDepartmentId]);
                error_log("Updated department {$newDepartmentId} manager_id to employee {$employeeId}");
            }
        }
        
        // Commit transaction
        $db->commit();
        
        Response::success(['employee_id' => $employeeId], 'Employee updated successfully');
        
    } catch (PDOException $e) {
        // Rollback on error
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        Response::error('Failed to update employee: ' . $e->getMessage());
    }
}

// DELETE employee
if ($method === 'DELETE' && preg_match('/\/employees\/(\d+)/', $uri, $matches)) {
    $user = AuthMiddleware::checkRole(['admin']);
    $employeeId = $matches[1];
    
    try {
        // Start transaction
        $db->beginTransaction();
        
        // Get employee info to check user_id
        $stmt = $db->prepare("SELECT user_id FROM employees WHERE employee_id = ?");
        $stmt->execute([$employeeId]);
        $employee = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$employee) {
            $db->rollBack();
            Response::notFound('Employee not found');
        }
        
        // Check if employee is a department manager
        $stmt = $db->prepare("SELECT department_id FROM departments WHERE manager_id = ?");
        $stmt->execute([$employeeId]);
        $managedDepartments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Remove manager_id from departments before deleting employee
        if (!empty($managedDepartments)) {
            foreach ($managedDepartments as $dept) {
                $stmt = $db->prepare("UPDATE departments SET manager_id = NULL WHERE department_id = ?");
                $stmt->execute([$dept['department_id']]);
                error_log("Removed manager from department {$dept['department_id']} before deleting employee {$employeeId}");
            }
        }
        
        // Delete employee from employees table
        $stmt = $db->prepare("DELETE FROM employees WHERE employee_id = ?");
        $stmt->execute([$employeeId]);
        
        // If employee has a user account, delete from users table too
        if ($employee['user_id']) {
            $stmt = $db->prepare("DELETE FROM users WHERE user_id = ?");
            $stmt->execute([$employee['user_id']]);
            error_log("Deleted user account {$employee['user_id']} for employee {$employeeId}");
        }
        
        $db->commit();
        Response::success(null, 'Employee deleted successfully');
        
    } catch (PDOException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        Response::error('Failed to delete employee: ' . $e->getMessage());
    }
}

Response::error('Endpoint not found', 404);
