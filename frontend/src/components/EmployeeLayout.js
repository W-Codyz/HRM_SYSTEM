import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationsPanel from './NotificationsPanel';
import api from '../services/api';

const EmployeeLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isManager, setIsManager] = useState(false);
  const [managedDepartment, setManagedDepartment] = useState(null);
  const [employeePhoto, setEmployeePhoto] = useState(null);
  const [photoTimestamp, setPhotoTimestamp] = useState(Date.now());
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
  
  // Fetch unread notifications count
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);
  
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.data?.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };
  
  // Refresh photo when returning from profile page
  useEffect(() => {
    if (location.pathname !== '/employee/profile') {
      setPhotoTimestamp(Date.now());
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const switchToAdminMode = () => {
    navigate('/admin/dashboard');
  };

  // Menu items for all employees
  const baseMenuItems = [
    { path: '/employee/dashboard', icon: '📊', label: 'Bảng điều khiển' },
    { path: '/employee/attendance', icon: '⏰', label: 'Chấm công của tôi' },
    { path: '/employee/face-attendance', icon: '📸', label: 'Chấm công khuôn mặt' },
    { path: '/employee/leave-requests', icon: '📝', label: 'Nghỉ phép của tôi' },
    { path: '/employee/payroll', icon: '💰', label: 'Lương của tôi' },
  ];

  // Additional menu items for managers
  const managerMenuItems = [
    { path: '/employee/team-management', icon: '👥', label: 'Quản lý nhóm', divider: true },
    { path: '/employee/team-attendance', icon: '⏱️', label: 'Chấm công nhóm' },
    { path: '/employee/leave-approvals', icon: '✅', label: 'Duyệt nghỉ phép' },
  ];

  const profileMenuItem = { path: '/employee/profile', icon: '👤', label: 'Hồ sơ của tôi', divider: true };

  // Combine menu items based on manager status
  const menuItems = isManager 
    ? [...baseMenuItems, ...managerMenuItems, profileMenuItem]
    : [...baseMenuItems, profileMenuItem];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Hệ Thống HRM</h1>
          <p className="text-sm text-gray-500 mt-1">Cổng thông tin Nhân viên</p>
        </div>

        {/* Manager Department Info */}
        {isManager && managedDepartment && (
          <div className="mx-3 my-4 px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-600 font-medium mb-1">Đang quản lý phòng ban:</p>
            <p className="text-sm text-purple-800 font-bold">{managedDepartment.department_name}</p>
            <p className="text-xs text-purple-600 mt-1">
              {managedDepartment.employee_count || 0} nhân viên
            </p>
          </div>
        )}

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {menuItems.map((item) => (
            <React.Fragment key={item.path}>
              {item.divider && <div className="h-px bg-gray-200 my-2 mx-2" />}
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 mb-1 rounded-lg transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </React.Fragment>
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
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-end space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold overflow-hidden">
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
                <div className="text-left">
                  <p className="font-semibold text-gray-800 text-sm">{user?.username}</p>
                  <p className="text-xs text-gray-500">
                    {isManager ? 'Quản lý' : 'Nhân viên'}
                  </p>
                </div>
                <span className="text-gray-400">▼</span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link
                    to="/employee/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    👤 Hồ sơ của tôi
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-100">
          <Outlet />
        </main>
      </div>

      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => {
          setShowNotifications(false);
          fetchUnreadCount();
        }} 
      />
    </div>
  );
};

export default EmployeeLayout;
