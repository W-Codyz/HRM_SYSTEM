import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [latestPayroll, setLatestPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  // Refresh khi component mount lại (quay lại từ face-attendance)
  useEffect(() => {
    const handleFocus = () => {
      fetchDashboardData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendanceRes = await api.get('/attendance', { params: { date: today } });
      const attendanceData = attendanceRes.data.data || [];
      setTodayAttendance(attendanceData[0] || null);
      
      // Fetch recent leave requests
      const leavesRes = await api.get('/leave_requests');
      const leavesData = leavesRes.data.data || [];
      setRecentLeaves(leavesData.slice(0, 5));
      
      // Fetch latest payroll
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const payrollRes = await api.get('/payroll', { params: { month: currentMonth, year: currentYear } });
      const payrollData = payrollRes.data.data || [];
      setLatestPayroll(payrollData[0] || null);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    navigate('/employee/face-attendance');
  };

  const handleCheckOut = async () => {
    navigate('/employee/face-attendance');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner border-blue-600 border-t-transparent w-12 h-12"></div>
      </div>
    );
  }

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date('1970-01-01T' + timeString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Chào mừng trở lại! 👋
        </h1>
        <p className="text-gray-600 mt-1">Tổng quan công việc của bạn hôm nay</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Today's Attendance Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Chấm công hôm nay</h2>
              <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-3xl">⏰</span>
            </div>
          </div>
          
          {todayAttendance && todayAttendance.check_in ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700 font-medium">Giờ vào</span>
                </div>
                <span className="font-semibold text-green-600">
                  {formatTime(todayAttendance.check_in)}
                </span>
              </div>
              
              <div className={`flex justify-between items-center p-3 rounded-lg ${todayAttendance.check_out ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <span className={todayAttendance.check_out ? 'text-blue-600' : 'text-gray-400'}>✓</span>
                  <span className="text-gray-700 font-medium">Giờ ra</span>
                </div>
                <span className={`font-semibold ${todayAttendance.check_out ? 'text-blue-600' : 'text-gray-400'}`}>
                  {todayAttendance.check_out ? formatTime(todayAttendance.check_out) : 'Đang chờ'}
                </span>
              </div>
              
              {todayAttendance.late_minutes > 0 && (
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Đi muộn</span>
                  <span className="font-semibold text-orange-600">
                    {todayAttendance.late_minutes} phút
                  </span>
                </div>
              )}
              
              {todayAttendance.overtime_hours > 0 && (
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Làm thêm</span>
                  <span className="font-semibold text-purple-600">
                    {todayAttendance.overtime_hours} giờ
                  </span>
                </div>
              )}
              
              {!todayAttendance.check_out && (
                <button
                  onClick={handleCheckOut}
                  className="w-full mt-3 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Chấm công
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleCheckIn}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium text-lg"
            >
              Chấm công
            </button>
          )}
        </div>

        {/* Latest Payroll Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Bảng lương gần nhất</h2>
              <p className="text-sm text-gray-500 mt-1">Chi tiết lương của bạn</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <span className="text-3xl">💰</span>
            </div>
          </div>
          {latestPayroll ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded">
                <span className="text-gray-600 text-sm">Kỳ lương</span>
                <span className="font-semibold text-gray-800">
                  {latestPayroll.month}/{latestPayroll.year}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded">
                <span className="text-gray-600 text-sm">Lương cơ bản</span>
                <span className="font-semibold text-gray-800">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(latestPayroll.base_salary)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-green-50 rounded">
                <span className="text-gray-600 text-sm">Phụ cấp</span>
                <span className="font-semibold text-green-600">
                  +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(latestPayroll.allowances || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-red-50 rounded">
                <span className="text-gray-600 text-sm">Khấu trừ</span>
                <span className="font-semibold text-red-600">
                  -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(latestPayroll.total_deductions || 0)}
                </span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center p-3 bg-blue-600 rounded-lg">
                  <span className="text-white font-semibold">Lương thực nhận</span>
                  <span className="text-white text-xl font-bold">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(latestPayroll.net_salary)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded mt-2">
                <span className="text-gray-600 text-sm">Trạng thái</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(latestPayroll.status)}`}>
                  {latestPayroll.status.toUpperCase()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-gray-500">Không có dữ liệu lương</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Đơn nghỉ phép gần đây</h2>
            <p className="text-sm text-gray-500 mt-1">Theo dõi các đơn xin nghỉ</p>
          </div>
          <div className="bg-pink-100 p-3 rounded-lg">
            <span className="text-3xl">📝</span>
          </div>
        </div>
        {recentLeaves.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Loại nghỉ</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày bắt đầu</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày kết thúc</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Số ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentLeaves.map((leave) => (
                  <tr key={leave.leave_request_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{leave.leave_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(leave.start_date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(leave.end_date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                        {leave.total_days} ngày
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(leave.status)}`}>
                        {leave.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500">Chưa có đơn xin nghỉ nào</p>
            <p className="text-gray-400 text-sm mt-1">Các đơn xin nghỉ của bạn sẽ hiển thị ở đây</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
