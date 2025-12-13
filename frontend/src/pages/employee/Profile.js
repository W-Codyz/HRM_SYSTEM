import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const EmployeeProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  // Face recognition states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.employee_id) {
      fetchEmployeeProfile();
    }
  }, [user]);
  
  useEffect(() => {
    if (employeeData) {
      checkHasPhoto();
    }
  }, [employeeData]);

  const fetchEmployeeProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/employees/${user.employee_id}`);
      setEmployeeData(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const checkHasPhoto = async () => {
    try {
      // Lấy employee code từ employeeData nếu user không có
      if (!employeeData) return;
      
      const empCode = employeeData.employee_code || user?.employee_code;
      if (!empCode) {
        console.log('No employee code available');
        return;
      }
      
      const response = await api.get(`/face-recognition/employee/${empCode}/has-photo`);
      if (response.data.success) {
        setHasPhoto(response.data.data.has_photo);
      }
    } catch (error) {
      console.error('Error checking photo:', error);
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload trực tiếp (không cần verify)
    await uploadPhoto(file);
  };

  const uploadPhoto = async (file) => {
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('employee_code', employeeData.employee_code);

      const response = await api.post('/face-recognition/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Upload ảnh thành công! Bạn có thể sử dụng nhận diện khuôn mặt để chấm công.');
        setHasPhoto(true);
        fetchEmployeeProfile();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(error.response?.data?.message || 'Lỗi upload ảnh');
    } finally {
      setUploadingPhoto(false);
      setPhotoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await api.put('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      toast.success('Password changed successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('Change password error:', error.response?.data);
      const errorMessage = error.response?.data?.errors 
        ? Object.values(error.response.data.errors).join(', ')
        : error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
    }
  };

  if (authLoading || loading || !user || !employeeData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner border-blue-600 border-t-transparent w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4 relative overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : employeeData.face_photo ? (
                <img 
                  src={`http://localhost/Nhom9/backend/face_recognition/employee_photos/${employeeData.face_photo}`} 
                  alt={employeeData.full_name}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-6xl">👤</span>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="spinner border-white border-t-transparent w-8 h-8"></div>
                </div>
              )}
            </div>
            
            {/* Upload Photo Section */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className={`inline-block px-4 py-2 rounded-lg cursor-pointer transition ${
                  uploadingPhoto 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : hasPhoto 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white text-sm`}
              >
                {uploadingPhoto ? 'Đang upload...' : hasPhoto ? 'Cập nhật ảnh' : '📷 Upload ảnh'}
              </label>
              
              {hasPhoto && (
                <div className="mt-2 text-xs text-green-600">
                  ✓ Đã có ảnh nhận diện
                </div>
              )}
              
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>📋 Yêu cầu ảnh:</p>
                <ul className="list-disc list-inside text-left">
                  <li>Chỉ có 1 người trong ảnh</li>
                  <li>Khuôn mặt rõ ràng, ánh sáng tốt</li>
                  <li>Nhìn thẳng vào camera</li>
                  <li>Không đeo khẩu trang/kính đen</li>
                  <li>Kích thước tối đa: 5MB</li>
                </ul>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-800">{employeeData.full_name}</h2>
            <p className="text-gray-600">{employeeData.employee_code}</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  employeeData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {employeeData.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Full Name</label>
                <p className="font-medium text-gray-900">{employeeData.full_name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Employee Code</label>
                <p className="font-medium text-gray-900">{employeeData.employee_code}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="font-medium text-gray-900">{employeeData.email || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="font-medium text-gray-900">{employeeData.phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Date of Birth</label>
                <p className="font-medium text-gray-900">
                  {employeeData.date_of_birth ? new Date(employeeData.date_of_birth).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Gender</label>
                <p className="font-medium text-gray-900 capitalize">{employeeData.gender || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Address</label>
                <p className="font-medium text-gray-900">{employeeData.address || '-'}</p>
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Work Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Department</label>
                <p className="font-medium text-gray-900">{employeeData.department_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Position</label>
                <p className="font-medium text-gray-900">{employeeData.position_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Hire Date</label>
                <p className="font-medium text-gray-900">
                  {employeeData.hire_date ? new Date(employeeData.hire_date).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Salary</label>
                <p className="font-medium text-gray-900">
                  {employeeData.salary ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(employeeData.salary) : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Change Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
