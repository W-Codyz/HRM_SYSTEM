import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const FaceRecognitionAttendance = () => {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(null);

  useEffect(() => {
    fetchTodayAttendance();
    
    return () => {
      // Cleanup: stop camera when component unmounts or user leaves page
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]); // Add stream dependency

  useEffect(() => {
    // Cooldown timer
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/attendance?date=${today}`);
      const data = response.data.data || [];
      setTodayAttendance(data[0] || null);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraOn(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Không thể truy cập camera. Vui lòng cấp quyền truy cập.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOn(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing || cooldown > 0) {
      return;
    }

    setIsProcessing(true);
    setLastResult(null);

    try {
      // Capture image from video
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // Convert canvas to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      // Create form data
      const formData = new FormData();
      formData.append('photo', blob, 'capture.jpg');

      // Send to API
      const response = await api.post('/face-recognition/attendance-check', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const result = response.data;
      setLastResult(result);

      if (result.success) {
        toast.success(result.message);
        setCooldown(30); // 30 seconds cooldown
        
        // Refresh attendance data
        setTimeout(() => {
          fetchTodayAttendance();
        }, 1000);
      } else {
        toast.error(result.message);
        setCooldown(5); // 5 seconds cooldown on error
      }
    } catch (error) {
      console.error('Error processing attendance:', error);
      const errorMsg = error.response?.data?.message || 'Lỗi xử lý chấm công. Vui lòng thử lại.';
      toast.error(errorMsg);
      setLastResult({
        success: false,
        message: errorMsg
      });
      setCooldown(5);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date('1970-01-01T' + timeString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Chấm công bằng nhận diện khuôn mặt</h1>
        <p className="text-gray-600 mt-2">Sử dụng camera để chấm công tự động</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📹 Camera</h2>

          {/* Video Preview */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ display: isCameraOn ? 'block' : 'none' }}
            />
            
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">📷</div>
                  <p>Camera chưa được bật</p>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="spinner border-white border-t-transparent w-12 h-12 mx-auto mb-3"></div>
                  <p>Đang nhận diện...</p>
                </div>
              </div>
            )}

            {cooldown > 0 && (
              <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Đợi {cooldown}s
              </div>
            )}
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Camera Controls */}
          <div className="space-y-3">
            {!isCameraOn ? (
              <button
                onClick={startCamera}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                🎥 Bật Camera
              </button>
            ) : (
              <>
                <button
                  onClick={captureAndRecognize}
                  disabled={isProcessing || cooldown > 0 || (todayAttendance?.check_in && todayAttendance?.check_out)}
                  className={`w-full px-6 py-3 rounded-lg font-semibold transition ${
                    isProcessing || cooldown > 0 || (todayAttendance?.check_in && todayAttendance?.check_out)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isProcessing 
                    ? '⏳ Đang xử lý...' 
                    : cooldown > 0 
                    ? `⏰ Đợi ${cooldown}s` 
                    : todayAttendance?.check_in && todayAttendance?.check_out
                    ? '✅ Đã chấm công đủ'
                    : todayAttendance?.check_in 
                    ? '🕐 Chấm công' 
                    : '🕐 Chấm công'}
                </button>
                
                <button
                  onClick={stopCamera}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  ⏹️ Tắt Camera
                </button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Hướng dẫn:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Bật camera và đảm bảo khuôn mặt rõ ràng</li>
              <li>2. Nhìn thẳng vào camera với ánh sáng tốt</li>
              <li>3. Nhấn "Chấm công ngay" để thực hiện</li>
              <li>4. Hệ thống sẽ tự động nhận diện và ghi nhận</li>
            </ul>
          </div>
        </div>

        {/* Status Section */}
        <div className="space-y-6">
          {/* Today's Attendance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Chấm công hôm nay</h2>
            
            {todayAttendance ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Giờ vào</p>
                    <p className="text-2xl font-bold text-green-600">{formatTime(todayAttendance.check_in)}</p>
                    {todayAttendance.late_minutes > 0 && (
                      <p className="text-xs text-orange-600 mt-1">⚠️ Muộn {todayAttendance.late_minutes} phút</p>
                    )}
                  </div>
                  <div className="text-4xl">✓</div>
                </div>

                {todayAttendance.check_out ? (
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Giờ ra</p>
                      <p className="text-2xl font-bold text-blue-600">{formatTime(todayAttendance.check_out)}</p>
                      {todayAttendance.actual_hours && (
                        <p className="text-xs text-blue-600 mt-1">⏱️ Tổng: {todayAttendance.actual_hours}h</p>
                      )}
                    </div>
                    <div className="text-4xl">✓</div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <p className="text-yellow-700">Chưa chấm công ra</p>
                    <p className="text-sm text-yellow-600 mt-1">Nhớ chấm công khi về nhé!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-3">📅</div>
                <p className="text-gray-500">Chưa chấm công hôm nay</p>
                <p className="text-sm text-gray-400 mt-1">Hãy sử dụng camera để chấm công</p>
              </div>
            )}
          </div>

          {/* Last Result */}
          {lastResult && (
            <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
              lastResult.success ? 'border-green-500' : 'border-red-500'
            }`}>
              <h2 className="text-xl font-semibold mb-4">
                {lastResult.success ? '✅ Thành công' : '❌ Thất bại'}
              </h2>
              
              <div className="space-y-3">
                <p className={`${lastResult.success ? 'text-green-700' : 'text-red-700'} whitespace-pre-line`}>
                  {lastResult.message}
                </p>

                {lastResult.employee && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Nhân viên:</p>
                    <p className="font-semibold">{lastResult.employee.full_name}</p>
                    <p className="text-sm text-gray-600">{lastResult.employee.employee_code}</p>
                    {lastResult.employee.department && (
                      <p className="text-sm text-gray-500">{lastResult.employee.department}</p>
                    )}
                  </div>
                )}

                {lastResult.confidence && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Độ tin cậy:</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${lastResult.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{(lastResult.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Lưu ý:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Đảm bảo đã upload ảnh trong trang Profile trước</li>
              <li>• Khuôn mặt phải rõ ràng, không bị che khuất</li>
              <li>• Ánh sáng đầy đủ, tránh ngược sáng</li>
              <li>• Không đeo khẩu trang hoặc kính đen</li>
              <li>• Mỗi lần chấm công cần đợi 30 giây</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRecognitionAttendance;
