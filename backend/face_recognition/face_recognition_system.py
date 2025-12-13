"""
Face Recognition Attendance System
Advanced facial recognition for employee attendance tracking
"""
from deepface import DeepFace
import cv2
import os
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd
from typing import Tuple, Optional, Dict
import config
from database import Database

class FaceRecognitionSystem:
    def __init__(self):
        self.db = Database()
        self.db.connect()
        self.last_recognition = {}  # Track last recognition time per employee
        
    def __del__(self):
        """Cleanup database connection"""
        if hasattr(self, 'db'):
            self.db.disconnect()
    
    def verify_face_in_image(self, image_path: str) -> Tuple[bool, str]:
        """
        Verify if image contains a clear face
        Returns: (success, message)
        """
        try:
            # Detect faces in image
            faces = DeepFace.extract_faces(
                img_path=image_path,
                detector_backend=config.DETECTOR_BACKEND,
                enforce_detection=True
            )
            
            if len(faces) == 0:
                return False, "Không phát hiện khuôn mặt trong ảnh"
            
            if len(faces) > 1:
                return False, "Phát hiện nhiều hơn 1 khuôn mặt. Vui lòng chỉ có 1 người trong ảnh"
            
            # Check face confidence
            face = faces[0]
            if face.get('confidence', 0) < 0.9:
                return False, "Khuôn mặt không đủ rõ ràng. Vui lòng chụp lại với ánh sáng tốt hơn"
            
            # Check image quality
            img = cv2.imread(image_path)
            height, width = img.shape[:2]
            
            if width < config.PHOTO_QUALITY_MIN_WIDTH or height < config.PHOTO_QUALITY_MIN_HEIGHT:
                return False, f"Ảnh quá nhỏ. Kích thước tối thiểu: {config.PHOTO_QUALITY_MIN_WIDTH}x{config.PHOTO_QUALITY_MIN_HEIGHT}px"
            
            return True, "Ảnh hợp lệ"
            
        except Exception as e:
            return False, f"Lỗi xác thực ảnh: {str(e)}"
    
    def save_employee_photo(self, employee_code: str, image_path: str) -> Tuple[bool, str, Optional[str]]:
        """
        Save employee photo to database directory
        Overwrites old photo if exists
        No validation - accepts any image
        Returns: (success, message, saved_path)
        """
        try:
            # Get employee info
            employee = self.db.get_employee_by_code(employee_code)
            if not employee:
                return False, "Không tìm thấy nhân viên", None
            
            # Create employee directory if not exists
            employee_dir = config.EMPLOYEE_PHOTOS_DIR / employee_code
            employee_dir.mkdir(exist_ok=True)
            
            # Delete old photos in employee directory to overwrite
            for old_photo in employee_dir.glob("*.jpg"):
                try:
                    old_photo.unlink()
                except:
                    pass
            
            # Save photo with fixed name (no timestamp) to always overwrite
            photo_filename = f"{employee_code}.jpg"
            photo_path = employee_dir / photo_filename
            
            # Copy and optimize image
            img = cv2.imread(image_path)
            if img is None:
                return False, "Không thể đọc file ảnh", None
                
            # Resize if too large (max 800px width)
            height, width = img.shape[:2]
            if width > 800:
                ratio = 800 / width
                new_size = (800, int(height * ratio))
                img = cv2.resize(img, new_size)
            
            # Save optimized image
            cv2.imwrite(str(photo_path), img, [cv2.IMWRITE_JPEG_QUALITY, 95])
            
            # Update database with relative path
            relative_path = f"{employee_code}/{photo_filename}"
            self.db.update_employee_face_photo(employee['employee_id'], relative_path)
            
            return True, "Lưu ảnh thành công", str(photo_path)
            
        except Exception as e:
            return False, f"Lỗi lưu ảnh: {str(e)}", None
    
    def find_face_in_database(self, image_path: str) -> Tuple[bool, Optional[str], Optional[float], Optional[str]]:
        """
        Search for matching face in employee database
        Returns: (found, employee_code, confidence, message)
        """
        try:
            # Verify image has a face
            is_valid, msg = self.verify_face_in_image(image_path)
            if not is_valid:
                return False, None, None, msg
            
            # Check if database has any photos
            if not any(config.EMPLOYEE_PHOTOS_DIR.iterdir()):
                return False, None, None, "Chưa có ảnh nhân viên trong hệ thống"
            
            # Search in database
            results = DeepFace.find(
                img_path=image_path,
                db_path=str(config.EMPLOYEE_PHOTOS_DIR),
                model_name=config.FACE_RECOGNITION_MODEL,
                detector_backend=config.DETECTOR_BACKEND,
                distance_metric=config.DISTANCE_METRIC,
                enforce_detection=False,
                silent=True
            )
            
            # Process results
            if len(results) > 0 and len(results[0]) > 0:
                # Get best match
                best_match = results[0].iloc[0]
                matched_path = best_match['identity']
                distance = best_match['distance']
                
                # Check if distance is within threshold
                if distance > config.SIMILARITY_THRESHOLD:
                    return False, None, None, f"Khuôn mặt không khớp với bất kỳ nhân viên nào (độ tin cậy: {(1-distance)*100:.1f}%)"
                
                # Extract employee code from path
                # Path format: employee_photos/EMPXXX/EMPXXX_timestamp.jpg
                employee_code = Path(matched_path).parent.name
                confidence = 1 - distance  # Convert distance to confidence (0-1)
                
                return True, employee_code, confidence, "Nhận diện thành công"
            
            return False, None, None, "Không tìm thấy khuôn mặt khớp"
            
        except Exception as e:
            error_msg = str(e)
            if "No item found in" in error_msg:
                return False, None, None, "Chưa có ảnh nhân viên trong hệ thống. Vui lòng upload ảnh trước"
            return False, None, None, f"Lỗi nhận diện: {error_msg}"
    
    def check_cooldown(self, employee_code: str) -> Tuple[bool, str]:
        """
        Check if employee is in cooldown period
        Returns: (can_proceed, message)
        """
        if employee_code in self.last_recognition:
            last_time = self.last_recognition[employee_code]
            time_diff = datetime.now() - last_time
            
            if time_diff.total_seconds() < config.COOLDOWN_SECONDS:
                remaining = config.COOLDOWN_SECONDS - int(time_diff.total_seconds())
                return False, f"Vui lòng đợi {remaining} giây trước khi thử lại"
        
        return True, ""
    
    def save_attendance_photo(self, employee_code: str, image_path: str, action: str) -> Optional[str]:
        """
        Save attendance check-in/check-out photo
        Returns: relative path to saved photo or None
        """
        try:
            # Create attendance_photos directory
            attendance_dir = config.EMPLOYEE_PHOTOS_DIR.parent / "attendance_photos" / employee_code
            attendance_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            photo_filename = f"{employee_code}_{action}_{timestamp}.jpg"
            photo_path = attendance_dir / photo_filename
            
            # Load and resize image
            img = cv2.imread(image_path)
            if img is None:
                return None
            
            # Resize to smaller size (max 400px width for attendance photos)
            height, width = img.shape[:2]
            if width > 400:
                ratio = 400 / width
                new_size = (400, int(height * ratio))
                img = cv2.resize(img, new_size)
            
            # Save resized image
            cv2.imwrite(str(photo_path), img, [cv2.IMWRITE_JPEG_QUALITY, 85])
            
            # Return relative path
            return f"{employee_code}/{photo_filename}"
            
        except Exception as e:
            print(f"Error saving attendance photo: {e}")
            return None
    
    def process_attendance(self, image_path: str, expected_employee_code: str = None) -> Dict:
        """
        Process attendance check-in/out from image
        If expected_employee_code is provided, only allow that employee to check in/out
        Returns: result dictionary
        """
        result = {
            'success': False,
            'message': '',
            'employee': None,
            'attendance': None,
            'action': None,  # 'check_in' or 'check_out'
            'confidence': None,
            'recognized_employee': None  # Employee code from face recognition
        }
        
        try:
            # Find face in database
            found, employee_code, confidence, msg = self.find_face_in_database(image_path)
            
            if not found:
                result['message'] = msg
                return result
            
            result['confidence'] = confidence
            result['recognized_employee'] = employee_code
            
            # If expected_employee_code is provided, verify it matches
            if expected_employee_code and employee_code != expected_employee_code:
                result['message'] = f"❌ Chấm công thất bại!\n\nKhuôn mặt không khớp với tài khoản đăng nhập.\n\nNhận diện: {employee_code}\nTài khoản: {expected_employee_code}\n\nVui lòng chỉ chấm công cho chính mình!"
                return result
            
            # Check cooldown
            can_proceed, cooldown_msg = self.check_cooldown(employee_code)
            if not can_proceed:
                result['message'] = cooldown_msg
                return result
            
            # Get employee info
            employee = self.db.get_employee_by_code(employee_code)
            if not employee:
                result['message'] = f"Không tìm thấy thông tin nhân viên {employee_code}"
                return result
            
            result['employee'] = {
                'employee_id': employee['employee_id'],
                'employee_code': employee['employee_code'],
                'full_name': employee['full_name'],
                'department': employee.get('department_name'),
                'position': employee.get('position_name')
            }
            
            # Check today's attendance
            today_attendance = self.db.get_today_attendance(employee['employee_id'])
            
            if not today_attendance:
                # Check in
                # Save check-in photo
                photo_path = self.save_attendance_photo(employee_code, image_path, "checkin")
                
                attendance_id = self.db.create_attendance_record(employee['employee_id'], photo_path)
                if attendance_id:
                    result['success'] = True
                    result['action'] = 'check_in'
                    result['message'] = f"✓ Chấm công VÀO thành công!\nNhân viên: {employee['full_name']}\nMã NV: {employee_code}\nĐộ tin cậy: {confidence*100:.1f}%"
                    result['attendance'] = {'attendance_id': attendance_id}
                    
                    # Update last recognition time
                    self.last_recognition[employee_code] = datetime.now()
                else:
                    result['message'] = "Lỗi tạo bản ghi chấm công"
            
            elif not today_attendance.get('check_out'):
                # Check out
                # Save check-out photo
                photo_path = self.save_attendance_photo(employee_code, image_path, "checkout")
                
                attendance_id = self.db.update_checkout_time(today_attendance['attendance_id'], photo_path)
                if attendance_id:
                    result['success'] = True
                    result['action'] = 'check_out'
                    
                    # Get updated attendance info
                    updated_attendance = self.db.fetch_one(
                        "SELECT * FROM attendance WHERE attendance_id = %s",
                        (attendance_id,)
                    )
                    
                    result['message'] = f"✓ Chấm công RA thành công!\nNhân viên: {employee['full_name']}\nGiờ làm: {updated_attendance.get('actual_hours', 0):.1f}h"
                    result['attendance'] = {
                        'attendance_id': attendance_id,
                        'actual_hours': float(updated_attendance.get('actual_hours', 0))
                    }
                    
                    # Update last recognition time
                    self.last_recognition[employee_code] = datetime.now()
                else:
                    result['message'] = "Lỗi cập nhật giờ ra"
            
            else:
                result['message'] = f"Nhân viên {employee['full_name']} đã chấm công đủ hôm nay"
            
            return result
            
        except Exception as e:
            result['message'] = f"Lỗi xử lý: {str(e)}"
            return result
    
    def get_attendance_stats(self, employee_code: str, month: int = None, year: int = None) -> Dict:
        """Get attendance statistics for employee"""
        employee = self.db.get_employee_by_code(employee_code)
        if not employee:
            return None
        
        now = datetime.now()
        month = month or now.month
        year = year or now.year
        
        query = """
            SELECT 
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(actual_hours) as total_hours,
                SUM(overtime_hours) as total_overtime
            FROM attendance
            WHERE employee_id = %s 
            AND MONTH(attendance_date) = %s 
            AND YEAR(attendance_date) = %s
        """
        
        stats = self.db.fetch_one(query, (employee['employee_id'], month, year))
        return stats
    
    def save_temp_image(self, image_data) -> str:
        """Save temporary image from upload"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_path = config.TEMP_DIR / f"temp_{timestamp}.jpg"
        
        if isinstance(image_data, str):
            # If base64 string
            import base64
            img_data = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
            with open(temp_path, 'wb') as f:
                f.write(img_data)
        else:
            # If file object
            image_data.save(str(temp_path))
        
        return str(temp_path)
    
    def cleanup_temp_files(self, max_age_hours: int = 24):
        """Clean up old temporary files"""
        try:
            now = datetime.now()
            for temp_file in config.TEMP_DIR.glob("temp_*.jpg"):
                file_time = datetime.fromtimestamp(temp_file.stat().st_mtime)
                if (now - file_time).total_seconds() > max_age_hours * 3600:
                    temp_file.unlink()
        except Exception as e:
            print(f"Error cleaning temp files: {e}")
