import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ManagerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [employeePhoto, setEmployeePhoto] = useState(null);
  const [photoTimestamp, setPhotoTimestamp] = useState(Date.now());

  useEffect(() => {
    const fetchEmployeePhoto = async () => {
      if (user?.employee_id) {
        try {
          const res = await api.get(`/employees/${user.employee_id}`);
          const empData = res.data.data;
          if (empData?.face_photo) {
            setEmployeePhoto(empData.face_photo);
          }
        } catch (error) {
          console.error('Error fetching employee photo:', error);
        }
      }
    };
    fetchEmployeePhoto();
  }, [user]);
  
  // Refresh photo when returning from profile page
  useEffect(() => {
    if (location.pathname !== '/manager/profile') {
      setPhotoTimestamp(Date.now());
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/manager/dashboard', icon: '📊', label: 'Bảng điều khiển' },
    { path: '/manager/employees', icon: '👥', label: 'Nhóm của tôi' },
    { path: '/manager/attendance', icon: '⏰', label: 'Chấm công nhóm' },
    { path: '/manager/leave-requests', icon: '📝', label: 'Duyệt nghỉ phép' },
    { path: '/manager/my-attendance', icon: '⏱️', label: 'Chấm công của tôi' },
    { path: '/manager/my-leave', icon: '📋', label: 'Nghỉ phép của tôi' },
    { path: '/manager/payroll', icon: '💰', label: 'Lương' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Hệ Thống HRM</h1>
          <p className="text-sm text-gray-500 mt-1">Cổng thông tin Quản lý</p>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-3">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 mb-1 rounded-lg transition-colors ${
                location.pathname === item.path 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center mb-3 p-2 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
              {employeePhoto ? (
                <img 
                  key={photoTimestamp}
                  src={`http://localhost/Nhom9/backend/face_recognition/employee_photos/${employeePhoto}?v=${photoTimestamp}`}
                  alt={user?.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.username?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{user?.username}</p>
              <p className="text-xs text-gray-500">Quản lý</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 rounded-lg font-medium transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default ManagerLayout;
