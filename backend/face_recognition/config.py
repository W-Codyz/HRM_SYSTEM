"""
Configuration for Face Recognition System
"""
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Database configuration
DATABASE_HOST = "localhost:3307"
DATABASE_NAME = "hrm_system"
DATABASE_USER = "root"
DATABASE_PASSWORD = ""

# Paths
EMPLOYEE_PHOTOS_DIR = BASE_DIR / "employee_photos"
TEMP_DIR = BASE_DIR / "temp"
LOGS_DIR = BASE_DIR / "logs"

# Create directories if they don't exist
EMPLOYEE_PHOTOS_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# Face Recognition settings
FACE_RECOGNITION_MODEL = "Facenet512"  # Options: VGG-Face, Facenet, Facenet512, ArcFace
DETECTOR_BACKEND = "opencv"  # Options: opencv, ssd, dlib, mtcnn, retinaface
DISTANCE_METRIC = "cosine"  # Options: cosine, euclidean, euclidean_l2
SIMILARITY_THRESHOLD = 0.4  # Lower is stricter (0.0 - 1.0)

# Attendance settings
COOLDOWN_SECONDS = 30  # Prevent duplicate check-ins within this time
PHOTO_QUALITY_MIN_WIDTH = 200
PHOTO_QUALITY_MIN_HEIGHT = 200
MAX_PHOTO_SIZE_MB = 5

# Flask settings
FLASK_HOST = "0.0.0.0"
FLASK_PORT = 5000
FLASK_DEBUG = True

# Shift settings (Vietnam timezone UTC+7)
DEFAULT_SHIFT_START = "08:00:00"
DEFAULT_SHIFT_END = "17:00:00"
LATE_THRESHOLD_MINUTES = 15
