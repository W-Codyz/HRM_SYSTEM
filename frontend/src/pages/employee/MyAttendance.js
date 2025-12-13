import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

const MyAttendance = () => {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, totalHours: 0 });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth, selectedYear]);
  
  // Refresh khi quay lại từ face-attendance
  useEffect(() => {
    const handleFocus = () => {
      fetchAttendance();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedMonth, selectedYear]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      
      // Fetch month attendance
      const response = await api.get(`/attendance?month=${selectedMonth}&year=${selectedYear}`);
      const data = response.data.data || [];
      setAttendance(data);
      
      // Find today's record from month data (avoid timezone issues)
      const today = new Date();
      const todayRecord = data.find(record => {
        const recordDate = new Date(record.attendance_date + 'T00:00:00');
        return recordDate.getDate() === today.getDate() && 
               recordDate.getMonth() === today.getMonth() && 
               recordDate.getFullYear() === today.getFullYear();
      });
      
      console.log('Today attendance found:', todayRecord);
      setTodayAttendance(todayRecord || null);
      
      // Calculate stats
      const stats = data.reduce((acc, record) => {
        if (record.status === 'present') acc.present++;
        if (record.status === 'late') acc.late++;
        if (record.status === 'absent') acc.absent++;
        acc.totalHours += parseFloat(record.actual_hours || 0);
        return acc;
      }, { present: 0, late: 0, absent: 0, totalHours: 0 });
      
      setStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi tải dữ liệu chấm công:', error);
      toast.error('Không thể tải dữ liệu chấm công');
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    // Navigate to Face Attendance page for face recognition check-in
    navigate('/employee/face-attendance');
  };

  const handleCheckOut = async () => {
    // Navigate to Face Attendance page for face recognition check-out
    navigate('/employee/face-attendance');
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date('1970-01-01T' + timeString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'present': 'bg-green-100 text-green-800',
      'late': 'bg-yellow-100 text-yellow-800',
      'absent': 'bg-red-100 text-red-800',
      'half-day': 'bg-blue-100 text-blue-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Chấm công của tôi</h1>
        <p className="text-gray-600 mt-2">Theo dõi chấm công hàng ngày của bạn</p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Chấm công hôm nay</h2>
        <div className="flex gap-4">
          {!todayAttendance || !todayAttendance.check_in ? (
            <button
              onClick={handleCheckIn}
              className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 text-lg font-semibold"
            >
              Chấm công
            </button>
          ) : (
            <>
              <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Giờ vào</p>
                <p className="text-2xl font-bold text-green-600">{formatTime(todayAttendance.check_in)}</p>
                {todayAttendance.late_minutes > 0 && (
                  <p className="text-xs text-orange-600 mt-1">Muộn {todayAttendance.late_minutes} phút</p>
                )}
              </div>
              {todayAttendance.check_out ? (
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Giờ ra</p>
                  <p className="text-2xl font-bold text-blue-600">{formatTime(todayAttendance.check_out)}</p>
                  {todayAttendance.actual_hours && (
                    <p className="text-xs text-blue-600 mt-1">Tổng: {todayAttendance.actual_hours}h</p>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleCheckOut}
                  className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 text-lg font-semibold"
                >
                  Chấm công
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-green-50 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Ngày có mặt</div>
          <div className="text-3xl font-bold text-green-600">{stats.present}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Ngày đi muộn</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.late}</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Ngày vắng</div>
          <div className="text-3xl font-bold text-red-600">{stats.absent}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Tổng giờ làm</div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalHours.toFixed(1)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tháng</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Năm</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giờ vào</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giờ ra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng giờ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đi muộn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tăng ca</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Đang tải...</td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Không có dữ liệu chấm công</td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.attendance_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {new Date(record.attendance_date).toLocaleDateString('vi-VN', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: '2-digit' 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-green-600 font-semibold">{formatTime(record.check_in)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-blue-600 font-semibold">{formatTime(record.check_out)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.actual_hours ? (
                        <span className="font-semibold text-gray-900">{record.actual_hours}h</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.late_minutes > 0 ? (
                        <span className="text-red-600 font-semibold">{record.late_minutes} phút</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.overtime_hours > 0 ? (
                        <span className="text-purple-600 font-semibold">{record.overtime_hours}h</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(record.status)}`}>
                        {record.status === 'present' ? 'Có mặt' : 
                         record.status === 'late' ? 'Đi muộn' : 
                         record.status === 'absent' ? 'Vắng' : record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyAttendance;
