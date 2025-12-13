import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const TeamAttendance = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [managedDepartment, setManagedDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    check_in_time: '08:00',
    check_out_time: '',
    status: 'present'
  });
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    total: 0
  });

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Lấy thông tin phòng ban
      const deptRes = await api.get('/departments');
      const departments = deptRes.data.data || [];
      const myDept = departments.find(d => d.manager_id === user?.employee_id);
      
      if (!myDept) {
        toast.error('Bạn không quản lý phòng ban nào');
        setLoading(false);
        return;
      }
      
      setManagedDepartment(myDept);
      
      // Lấy danh sách nhân viên trong phòng ban
      const empRes = await api.get('/employees', { 
        params: { department_id: myDept.department_id } 
      });
      const employees = empRes.data.data || [];
      
      // Lấy dữ liệu chấm công cho ngày đã chọn
      const attRes = await api.get('/attendance', { 
        params: { date: selectedDate } 
      });
      const allAttendance = attRes.data.data || [];
      
      // Lọc chỉ lấy attendance của nhân viên trong phòng ban
      const employeeIds = employees.map(e => e.employee_id);
      const departmentAttendance = allAttendance.filter(att => 
        employeeIds.includes(att.employee_id)
      );
      
      // Tạo map để dễ tra cứu
      const attMap = {};
      departmentAttendance.forEach(att => {
        attMap[att.employee_id] = att;
      });
      
      // Kết hợp thông tin nhân viên và attendance
      const combinedData = employees.map(emp => ({
        ...emp,
        attendance: attMap[emp.employee_id] || null
      }));
      
      setAttendanceData(combinedData);
      
      // Tính stats
      const present = departmentAttendance.filter(a => a.status === 'present').length;
      const late = departmentAttendance.filter(a => a.status === 'late').length;
      const absent = employees.length - departmentAttendance.length;
      
      setStats({
        present,
        late,
        absent,
        total: employees.length
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Không thể tải dữ liệu chấm công');
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'present': 'bg-green-100 text-green-800 border-green-300',
      'late': 'bg-orange-100 text-orange-800 border-orange-300',
      'absent': 'bg-red-100 text-red-800 border-red-300',
      'on_leave': 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusText = (status) => {
    const texts = {
      'present': 'Có mặt',
      'late': 'Đi muộn',
      'absent': 'Vắng mặt',
      'on_leave': 'Nghỉ phép'
    };
    return texts[status] || 'Chưa chấm công';
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date('1970-01-01T' + timeString).toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    try {
      // Chấm công vào thủ công
      await api.post('/attendance/checkin', {
        employee_id: formData.employee_id,
        date: selectedDate,
        time: formData.check_in_time + ':00',
        status: formData.status
      });
      
      // Nếu có giờ ra, chấm công ra luôn
      if (formData.check_out_time) {
        await api.post('/attendance/checkout', {
          employee_id: formData.employee_id,
          date: selectedDate,
          time: formData.check_out_time + ':00'
        });
      }
      
      toast.success('Chấm công thủ công thành công!');
      setShowModal(false);
      setFormData({ employee_id: '', check_in_time: '08:00', check_out_time: '', status: 'present' });
      fetchAttendanceData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Chấm công thất bại');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner border-purple-600 border-t-transparent w-12 h-12"></div>
      </div>
    );
  }

  if (!managedDepartment) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn không quản lý phòng ban nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Chấm công nhóm ⏱️
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi chấm công nhân viên phòng ban: <span className="font-semibold text-purple-600">{managedDepartment.department_name}</span>
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center"
        >
          <span className="mr-2">➕</span>
          Chấm công thủ công
        </button>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="font-medium text-gray-700">Chọn ngày:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <div className="ml-auto text-sm text-gray-600">
            📅 {new Date(selectedDate).toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Tổng số</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-3xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Có mặt</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.present}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="text-3xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Đi muộn</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.late}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <span className="text-3xl">⚠️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Vắng mặt</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.absent}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <span className="text-3xl">❌</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Chi tiết chấm công</h2>
        </div>

        {attendanceData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chức vụ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giờ vào
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giờ ra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.map((emp) => {
                  const att = emp.attendance;
                  const status = att ? att.status : 'absent';
                  
                  return (
                    <tr key={emp.employee_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                            {emp.full_name?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{emp.full_name}</div>
                            <div className="text-xs text-gray-500">{emp.employee_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{emp.position_name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(status)}`}>
                          {getStatusText(status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatTime(att?.check_in_time)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatTime(att?.check_out_time)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{att?.notes || '-'}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">Không có dữ liệu chấm công</p>
          </div>
        )}
      </div>

      {/* Modal chấm công thủ công */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Chấm công thủ công</h3>
            <form onSubmit={handleManualCheckIn}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nhân viên</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Chọn nhân viên</option>
                    {attendanceData.map(emp => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.employee_code} - {emp.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Giờ vào</label>
                  <input
                    type="time"
                    value={formData.check_in_time}
                    onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Giờ ra (tùy chọn)</label>
                  <input
                    type="time"
                    value={formData.check_out_time}
                    onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="present">Có mặt</option>
                    <option value="late">Đi muộn</option>
                    <option value="absent">Vắng mặt</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => { 
                    setShowModal(false); 
                    setFormData({ employee_id: '', check_in_time: '08:00', check_out_time: '', status: 'present' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamAttendance;
