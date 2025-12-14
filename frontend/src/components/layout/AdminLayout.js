import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationsPanel from '../NotificationsPanel';
import api from '../../services/api';
import {
  FaHome,
  FaUsers,
  FaUserTie,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaFileAlt,
  FaBars,
  FaTimes,
  FaBell,
  FaUser,
  FaSignOutAlt,
  FaCog,
  FaGift,
  FaMinusCircle,
} from 'react-icons/fa';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [canSwitchToEmployee, setCanSwitchToEmployee] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Kiểm tra xem admin có employee_id không (admin cũng có thể là nhân viên)
    if (user?.employee_id) {
      setCanSwitchToEmployee(true);
    }
  }, [user]);

  const switchToEmployeeMode = () => {
    navigate('/employee/dashboard');
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications.php/unread-count');
      setUnreadCount(response.data.data?.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: FaHome, label: 'Bảng điều khiển' },
    { path: '/admin/users', icon: FaUsers, label: 'Người dùng' },
    { path: '/admin/employees', icon: FaUserTie, label: 'Nhân viên' },
    { path: '/admin/departments', icon: FaUsers, label: 'Phòng ban' },
    { path: '/admin/positions', icon: FaUserTie, label: 'Chức vụ' },
    { path: '/admin/attendance', icon: FaCalendarCheck, label: 'Chấm công' },
    { path: '/admin/leave-requests', icon: FaFileAlt, label: 'Nghỉ phép' },
    { path: '/admin/payroll', icon: FaMoneyBillWave, label: 'Lương' },
    { path: '/admin/allowances', icon: FaGift, label: 'Phụ cấp' },
    { path: '/admin/deductions', icon: FaMinusCircle, label: 'Khấu trừ' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <FaUserTie className="text-white text-xl" />
              </div>
              <span className="ml-3 font-bold text-lg text-gray-800">HRM</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="mt-6 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className="text-xl" />
                {sidebarOpen && <span className="ml-4 font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Switch to Employee Mode Button */}
        {canSwitchToEmployee && (
          <div className="px-3 py-4 border-t border-gray-200 mt-4">
            <button
              onClick={switchToEmployeeMode}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span className="text-xl mr-2">👤</span>
              {sidebarOpen && <span>Chế độ Nhân viên</span>}
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              {menuItems.find((item) => item.path === location.pathname)?.label || 'Hệ Thống HRM'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaBell className="text-xl text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center">
                  <FaUser className="text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">{user?.full_name || user?.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </button>

              {/* Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                  <Link
                    to="/admin/profile"
                    className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <FaUser className="text-gray-600 mr-3" />
                    <span className="text-gray-800">Thông tin cá nhân</span>
                  </Link>
                  {/* <Link
                    to="/admin/settings"
                    className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <FaCog className="text-gray-600 mr-3" />
                    <span className="text-gray-800">Cài đặt</span>
                  </Link> */}
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 hover:bg-red-50 transition-colors text-red-600"
                  >
                    <FaSignOutAlt className="mr-3" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>

      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

export default AdminLayout;
