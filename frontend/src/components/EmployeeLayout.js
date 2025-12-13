import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const EmployeeLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isManagerMode, setIsManagerMode] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [managedDepartment, setManagedDepartment] = useState(null);
  const [employeePhoto, setEmployeePhoto] = useState(null);

  useEffect(() => {
    const checkIfManager = async () => {
      try {
        // Kiểm tra xem employee này có phải là manager không
        const res = await api.get('/departments');
        const departments = res.data.data || [];
        const managedDept = departments.find(d => d.manager_id === user?.employee_id);
        
        if (managedDept) {
          setIsManager(true);
          setManagedDepartment(managedDept);
        }
        
        // Fetch employee data để lấy face_photo
        if (user?.employee_id) {
          const empRes = await api.get(`/employees/${user.employee_id}`);
          const empData = empRes.data.data;
          if (empData?.face_photo) {
            setEmployeePhoto(empData.face_photo);
          }
        }
      } catch (error) {
        console.error('Error checking manager status:', error);
      }
    };
    
    if (user?.employee_id) {
      checkIfManager();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleManagerMode = () => {
    setIsManagerMode(!isManagerMode);
  };

  const switchToAdminMode = () => {
    navigate('/admin/dashboard');
  };

  const employeeMenuItems = [
    { path: '/employee/dashboard', icon: '📊', label: 'Bảng điều khiển' },
    { path: '/employee/attendance', icon: '⏰', label: 'Chấm công của tôi' },
    { path: '/employee/face-attendance', icon: '📸', label: 'Chấm công khuôn mặt' },
    { path: '/employee/leave-requests', icon: '📝', label: 'Nghỉ phép' },
    { path: '/employee/payroll', icon: '💰', label: 'Lương của tôi' },
    { path: '/employee/profile', icon: '👤', label: 'Hồ sơ của tôi' },
  ];

  const managerMenuItems = [
    { path: '/employee/dashboard', icon: '📊', label: 'Bảng điều khiển' },
    { path: '/employee/attendance', icon: '⏰', label: 'Chấm công của tôi' },
    { path: '/employee/face-attendance', icon: '📸', label: 'Chấm công khuôn mặt' },
    { path: '/employee/leave-requests', icon: '📝', label: 'Nghỉ phép của tôi' },
    { path: '/employee/payroll', icon: '💰', label: 'Lương của tôi' },
    { path: '/employee/team-management', icon: '👥', label: 'Quản lý nhóm' },
    { path: '/employee/team-attendance', icon: '⏱️', label: 'Chấm công nhóm' },
    { path: '/employee/leave-approvals', icon: '✅', label: 'Duyệt nghỉ phép' },
    { path: '/employee/profile', icon: '👤', label: 'Hồ sơ của tôi' },
  ];

  const menuItems = isManagerMode ? managerMenuItems : employeeMenuItems;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Hệ Thống HRM</h1>
          <p className="text-sm text-gray-500 mt-1">Cổng thông tin Nhân viên</p>
        </div>

        {/* Manager Mode Toggle */}
        {isManager && (
          <div className="px-3 py-4">
            <button
              onClick={toggleManagerMode}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all ${
                isManagerMode 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center">
                <span className="text-xl mr-3">{isManagerMode ? '👔' : '👤'}</span>
                <span>{isManagerMode ? 'Chế độ Quản lý' : 'Chế độ Nhân viên'}</span>
              </span>
              <span className="text-sm">{isManagerMode ? '⬇️' : '⬆️'}</span>
            </button>
            {isManagerMode && managedDepartment && (
              <div className="mt-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-600 font-medium">Đang quản lý:</p>
                <p className="text-sm text-purple-800 font-semibold">{managedDepartment.department_name}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 mb-1 rounded-lg transition-colors ${
                location.pathname === item.path 
                  ? (isManagerMode ? 'bg-purple-600 text-white shadow-sm' : 'bg-blue-600 text-white shadow-sm')
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Switch to Admin Mode (if user is admin) */}
        {user?.role === 'admin' && (
          <div className="px-3 py-4 border-t border-gray-200">
            <button
              onClick={switchToAdminMode}
              className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <span className="text-xl mr-2">⚙️</span>
              <span>Chế độ Quản trị</span>
            </button>
          </div>
        )}

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center mb-3 p-2 bg-gray-50 rounded-lg">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden ${
              isManagerMode ? 'bg-purple-500' : 'bg-blue-500'
            }`}>
              {employeePhoto ? (
                <img 
                  src={`http://localhost/Nhom9/backend/face_recognition/employee_photos/${employeePhoto}`}
                  alt={user?.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.username?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{user?.username}</p>
              <p className="text-xs text-gray-500">
                {isManager && isManagerMode ? 'Quản lý' : 'Nhân viên'}
              </p>
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

export default EmployeeLayout;
