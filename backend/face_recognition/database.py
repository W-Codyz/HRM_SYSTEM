"""
Database connection and utilities
"""
import mysql.connector
from mysql.connector import Error
from datetime import datetime, date, timedelta
import config

class Database:
    def __init__(self):
        self.connection = None
        
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(
                host=config.DATABASE_HOST.split(':')[0],
                port=int(config.DATABASE_HOST.split(':')[1]) if ':' in config.DATABASE_HOST else 3306,
                database=config.DATABASE_NAME,
                user=config.DATABASE_USER,
                password=config.DATABASE_PASSWORD
            )
            return self.connection
        except Error as e:
            print(f"Database connection error: {e}")
            return None
    
    def disconnect(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
    
    def execute_query(self, query, params=None):
        """Execute a query (INSERT, UPDATE, DELETE)"""
        if not self.connection or not self.connection.is_connected():
            print("Database connection is not established")
            return None
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params or ())
            self.connection.commit()
            return cursor.lastrowid
        except Error as e:
            print(f"Query execution error: {e}")
            self.connection.rollback()
            return None
    
    def fetch_one(self, query, params=None):
        """Fetch single record"""
        if not self.connection or not self.connection.is_connected():
            print("Database connection is not established")
            return None
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params or ())
            result = cursor.fetchone()
            return result
        except Error as e:
            print(f"Fetch error: {e}")
            return None
    
    def fetch_all(self, query, params=None):
        """Fetch multiple records"""
        if not self.connection or not self.connection.is_connected():
            print("Database connection is not established")
            return []
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params or ())
            results = cursor.fetchall()
            return results
        except Error as e:
            print(f"Fetch error: {e}")
            return []
    
    def get_employee_by_code(self, employee_code):
        """Get employee information by code"""
        query = """
            SELECT e.*, d.department_name, p.position_name
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN positions p ON e.position_id = p.position_id
            WHERE e.employee_code = %s AND e.status = 'active'
        """
        return self.fetch_one(query, (employee_code,))
    
    def get_employee_by_id(self, employee_id):
        """Get employee information by ID"""
        query = """
            SELECT e.*, d.department_name, p.position_name
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN positions p ON e.position_id = p.position_id
            WHERE e.employee_id = %s AND e.status = 'active'
        """
        return self.fetch_one(query, (employee_id,))
    
    def get_today_attendance(self, employee_id):
        """Check if employee already checked in today"""
        today = date.today()
        query = """
            SELECT * FROM attendance
            WHERE employee_id = %s AND attendance_date = %s
        """
        return self.fetch_one(query, (employee_id, today))
    
    def create_attendance_record(self, employee_id, check_in_photo=None, shift_id=1):
        """Create new attendance record with check-in time and photo"""
        now = datetime.now()
        today = date.today()
        current_time = now.time()
        
        # Calculate late minutes
        shift_start = datetime.strptime(config.DEFAULT_SHIFT_START, "%H:%M:%S").time()
        late_minutes = 0
        status = 'present'
        
        if current_time > shift_start:
            time_diff = datetime.combine(today, current_time) - datetime.combine(today, shift_start)
            late_minutes = int(time_diff.total_seconds() / 60)
            if late_minutes > config.LATE_THRESHOLD_MINUTES:
                status = 'late'
        
        query = """
            INSERT INTO attendance 
            (employee_id, shift_id, attendance_date, check_in, late_minutes, status, check_in_photo, check_in_method, check_out_method)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'face_recognition', NULL)
        """
        return self.execute_query(
            query, 
            (employee_id, shift_id, today, current_time, late_minutes, status, check_in_photo)
        )
    
    def update_checkout_time(self, attendance_id, check_out_photo=None):
        """Update check-out time, calculate hours, and save photo"""
        now = datetime.now()
        current_time = now.time()
        
        # Get the attendance record
        attendance = self.fetch_one(
            "SELECT * FROM attendance WHERE attendance_id = %s", 
            (attendance_id,)
        )
        
        if not attendance or not attendance['check_in']:
            return None
        
        # Calculate actual hours
        check_in = attendance['check_in']
        
        # Convert check_in to time object if needed
        if isinstance(check_in, str):
            check_in = datetime.strptime(check_in, "%H:%M:%S").time()
        elif isinstance(check_in, timedelta):
            # Convert timedelta to time
            total_seconds = int(check_in.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            check_in = datetime(1900, 1, 1, hours, minutes, seconds).time()
        elif not isinstance(check_in, datetime.time):
            # If it's already a time object, use it directly
            check_in = check_in
        
        today = date.today()
        time_diff = datetime.combine(today, current_time) - datetime.combine(today, check_in)
        actual_hours = time_diff.total_seconds() / 3600
        
        # Calculate overtime (if worked more than 8 hours)
        overtime_hours = max(0, actual_hours - 8)
        
        query = """
            UPDATE attendance 
            SET check_out = %s, actual_hours = %s, overtime_hours = %s, check_out_photo = %s, check_out_method = 'face_recognition'
            WHERE attendance_id = %s
        """
        self.execute_query(
            query, 
            (current_time, round(actual_hours, 2), round(overtime_hours, 2), check_out_photo, attendance_id)
        )
        return attendance_id
    
    def update_employee_face_photo(self, employee_id, photo_path):
        """Update employee's face photo path"""
        query = "UPDATE employees SET face_photo = %s WHERE employee_id = %s"
        return self.execute_query(query, (photo_path, employee_id))
    
    def get_all_active_employees_with_photos(self):
        """Get all active employees who have face photos"""
        query = """
            SELECT employee_id, employee_code, full_name, face_photo
            FROM employees
            WHERE status = 'active' AND face_photo IS NOT NULL AND face_photo != ''
        """
        return self.fetch_all(query)
