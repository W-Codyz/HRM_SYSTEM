"""
Flask API Server for Face Recognition Attendance System
"""
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import base64
from pathlib import Path
from datetime import datetime
import config
from face_recognition_system import FaceRecognitionSystem
from database import Database

app = Flask(__name__)
CORS(app)

# Initialize system
face_system = FaceRecognitionSystem()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Face Recognition API is running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/upload-photo', methods=['POST'])
def upload_employee_photo():
    """
    Upload employee photo for face recognition
    Expected: multipart/form-data with 'photo' file and 'employee_code'
    """
    try:
        # Get employee code
        employee_code = request.form.get('employee_code')
        if not employee_code:
            return jsonify({
                'success': False,
                'message': 'Thiếu mã nhân viên'
            }), 400
        
        # Get photo file
        if 'photo' not in request.files:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy file ảnh'
            }), 400
        
        photo = request.files['photo']
        if photo.filename == '':
            return jsonify({
                'success': False,
                'message': 'Chưa chọn file'
            }), 400
        
        # Check file size
        photo.seek(0, os.SEEK_END)
        file_size_mb = photo.tell() / (1024 * 1024)
        photo.seek(0)
        
        if file_size_mb > config.MAX_PHOTO_SIZE_MB:
            return jsonify({
                'success': False,
                'message': f'File quá lớn. Kích thước tối đa: {config.MAX_PHOTO_SIZE_MB}MB'
            }), 400
        
        # Save temporary file
        temp_path = face_system.save_temp_image(photo)
        
        # Process and save photo
        success, message, saved_path = face_system.save_employee_photo(employee_code, temp_path)
        
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'photo_path': saved_path
            })
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi server: {str(e)}'
        }), 500

@app.route('/api/upload-photo-base64', methods=['POST'])
def upload_photo_base64():
    """
    Upload employee photo as base64
    Expected JSON: {'employee_code': 'EMP001', 'photo': 'data:image/jpeg;base64,...'}
    """
    try:
        data = request.get_json()
        
        employee_code = data.get('employee_code')
        photo_base64 = data.get('photo')
        
        if not employee_code or not photo_base64:
            return jsonify({
                'success': False,
                'message': 'Thiếu mã nhân viên hoặc ảnh'
            }), 400
        
        # Save base64 to temp file
        temp_path = face_system.save_temp_image(photo_base64)
        
        # Process and save photo
        success, message, saved_path = face_system.save_employee_photo(employee_code, temp_path)
        
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'photo_path': saved_path
            })
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi server: {str(e)}'
        }), 500

@app.route('/api/recognize', methods=['POST'])
def recognize_face():
    """
    Recognize face from uploaded image
    Expected: multipart/form-data with 'photo' file
    """
    try:
        if 'photo' not in request.files:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy file ảnh'
            }), 400
        
        photo = request.files['photo']
        if photo.filename == '':
            return jsonify({
                'success': False,
                'message': 'Chưa chọn file'
            }), 400
        
        # Save temporary file
        temp_path = face_system.save_temp_image(photo)
        
        # Find face in database
        found, employee_code, confidence, message = face_system.find_face_in_database(temp_path)
        
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        if found:
            # Get employee info
            db = Database()
            db.connect()
            employee = db.get_employee_by_code(employee_code)
            db.disconnect()
            
            return jsonify({
                'success': True,
                'message': message,
                'employee': {
                    'employee_code': employee_code,
                    'full_name': employee.get('full_name'),
                    'department': employee.get('department_name'),
                    'position': employee.get('position_name')
                },
                'confidence': float(confidence)
            })
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi server: {str(e)}'
        }), 500

@app.route('/api/recognize-base64', methods=['POST'])
def recognize_face_base64():
    """
    Recognize face from base64 image
    Expected JSON: {'photo': 'data:image/jpeg;base64,...'}
    """
    try:
        data = request.get_json()
        photo_base64 = data.get('photo')
        
        if not photo_base64:
            return jsonify({
                'success': False,
                'message': 'Thiếu dữ liệu ảnh'
            }), 400
        
        # Save base64 to temp file
        temp_path = face_system.save_temp_image(photo_base64)
        
        # Find face in database
        found, employee_code, confidence, message = face_system.find_face_in_database(temp_path)
        
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        if found:
            # Get employee info
            db = Database()
            db.connect()
            employee = db.get_employee_by_code(employee_code)
            db.disconnect()
            
            return jsonify({
                'success': True,
                'message': message,
                'employee': {
                    'employee_code': employee_code,
                    'full_name': employee.get('full_name'),
                    'department': employee.get('department_name'),
                    'position': employee.get('position_name')
                },
                'confidence': float(confidence)
            })
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi server: {str(e)}'
        }), 500

@app.route('/api/attendance/check', methods=['POST'])
def check_attendance():
    """
    Process attendance check-in/out with face recognition
    Expected: multipart/form-data with 'photo' file and optional 'employee_code'
    """
    try:
        if 'photo' not in request.files:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy file ảnh'
            }), 400
        
        photo = request.files['photo']
        if photo.filename == '':
            return jsonify({
                'success': False,
                'message': 'Chưa chọn file'
            }), 400
        
        # Get expected employee code from request (for validation)
        expected_employee_code = request.form.get('employee_code')
        
        # Save temporary file
        temp_path = face_system.save_temp_image(photo)
        
        # Process attendance with expected employee code
        result = face_system.process_attendance(temp_path, expected_employee_code)
        
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi server: {str(e)}'
        }), 500

@app.route('/api/attendance/check-base64', methods=['POST'])
def check_attendance_base64():
    """
    Process attendance check-in/out with face recognition (base64)
    Expected JSON: {'photo': 'data:image/jpeg;base64,...'}
    """
    try:
        data = request.get_json()
        photo_base64 = data.get('photo')
        
        if not photo_base64:
            return jsonify({
                'success': False,
                'message': 'Thiếu dữ liệu ảnh'
            }), 400
        
        # Save base64 to temp file
        temp_path = face_system.save_temp_image(photo_base64)
        
        # Process attendance
        result = face_system.process_attendance(temp_path)
        
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi server: {str(e)}'
        }), 500

@app.route('/api/attendance/stats/<employee_code>', methods=['GET'])
def get_attendance_stats(employee_code):
    """Get attendance statistics for employee"""
    try:
        month = request.args.get('month', type=int)
        year = request.args.get('year', type=int)
        
        stats = face_system.get_attendance_stats(employee_code, month, year)
        
        if stats:
            return jsonify({
                'success': True,
                'data': stats
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy nhân viên'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi server: {str(e)}'
        }), 500

@app.route('/api/verify-photo', methods=['POST'])
def verify_photo():
    """
    Verify if photo contains a valid face
    Expected: multipart/form-data with 'photo' file
    """
    try:
        if 'photo' not in request.files:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy file ảnh'
            }), 400
        
        photo = request.files['photo']
        if photo.filename == '':
            return jsonify({
                'success': False,
                'message': 'Chưa chọn file'
            }), 400
        
        # Save temporary file
        temp_path = face_system.save_temp_image(photo)
        
        # Verify face
        is_valid, message = face_system.verify_face_in_image(temp_path)
        
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify({
            'success': is_valid,
            'message': message
        })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi server: {str(e)}'
        }), 500

@app.route('/api/employees/with-photos', methods=['GET'])
def get_employees_with_photos():
    """Get list of employees who have uploaded photos"""
    try:
        db = Database()
        db.connect()
        employees = db.get_all_active_employees_with_photos()
        db.disconnect()
        
        return jsonify({
            'success': True,
            'data': employees
        })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi server: {str(e)}'
        }), 500

# Cleanup temp files periodically
@app.before_request
def cleanup():
    """Cleanup old temp files before each request"""
    face_system.cleanup_temp_files()

if __name__ == '__main__':
    print("=" * 60)
    print("Face Recognition Attendance System API Server")
    print("=" * 60)
    print(f"Server starting on http://{config.FLASK_HOST}:{config.FLASK_PORT}")
    print(f"Model: {config.FACE_RECOGNITION_MODEL}")
    print(f"Detector: {config.DETECTOR_BACKEND}")
    print(f"Database: {config.EMPLOYEE_PHOTOS_DIR}")
    print("=" * 60)
    
    app.run(
        host=config.FLASK_HOST,
        port=config.FLASK_PORT,
        debug=config.FLASK_DEBUG
    )
