import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FaCalendarDay, FaClock, FaCheckCircle, FaTimesCircle, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    attendance_date: new Date().toISOString().split('T')[0],
    check_in_time: '08:00',
    check_out_time: '17:00',
    status: 'present',
  });

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/attendance', {
        params: { date: selectedDate }
      });
      setAttendanceData(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi tải dữ liệu chấm công:', error);
      toast.error('Không thể tải dữ liệu chấm công');
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Lỗi tải danh sách nhân viên:', error);
    }
  };

  const handleSubmit = async (e) => {
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
      resetForm();
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Chấm công thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi chấm công này không?')) {
      try {
        await api.delete(`/attendance/${id}`);
        toast.success('Xóa chấm công thành công');
        fetchAttendance();
      } catch (error) {
        toast.error('Xóa chấm công thất bại');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      attendance_date: new Date().toISOString().split('T')[0],
      check_in_time: '08:00',
      check_out_time: '17:00',
      status: 'present',
    });
  };

  const stats = {
    total: attendanceData.length,
    present: attendanceData.filter((a) => a.status === 'present').length,
    absent: attendanceData.filter((a) => a.status === 'absent').length,
    late: attendanceData.filter((a) => a.status === 'late').length,
  };

  return (
    <div className="p-6">{/* Removed AdminLayout wrapper since it's in routing */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">Quản lý Chấm công</h2>
            <p className="text-secondary-600 mt-1">Theo dõi giờ làm việc của nhân viên</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />
            <button 
              onClick={() => setShowModal(true)}
              className="btn btn-primary flex items-center"
            >
              <FaPlus className="mr-2" />
              Chấm công thủ công
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Tổng số</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <FaCalendarDay className="text-4xl text-blue-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Có mặt</p>
                <p className="text-3xl font-bold">{stats.present}</p>
              </div>
              <FaCheckCircle className="text-4xl text-green-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm mb-1">Vắng mặt</p>
                <p className="text-3xl font-bold">{stats.absent}</p>
              </div>
              <FaTimesCircle className="text-4xl text-red-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm mb-1">Đi muộn</p>
                <p className="text-3xl font-bold">{stats.late}</p>
              </div>
              <FaClock className="text-4xl text-yellow-200" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã NV</th>
                  <th>Họ tên</th>
                  <th>Phòng ban</th>
                  <th>Ảnh vào</th>
                  <th>Giờ vào</th>
                  <th>Ảnh ra</th>
                  <th>Giờ ra</th>
                  <th>Tổng giờ</th>
                  <th>Đi muộn</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((record, index) => (
                  <tr key={record.attendance_id || index}>
                    <td className="font-semibold text-primary-600">{record.employee_code}</td>
                    <td>{record.full_name}</td>
                    <td>{record.department_name}</td>
                    <td>
                      {record.check_in_photo ? (
                        <img 
                          src={`http://localhost/Nhom9/backend/face_recognition/attendance_photos/${record.check_in_photo}`}
                          alt="Check in"
                          className="w-12 h-12 rounded object-cover cursor-pointer hover:scale-150 transition-transform"
                          title="Click để phóng to"
                        />
                      ) : (
                        <span className="text-secondary-400 text-xs">-</span>
                      )}
                    </td>
                    <td>
                      {record.check_in ? (
                        <span className="flex items-center">
                          <FaClock className="mr-2 text-green-600" />
                          {record.check_in}
                        </span>
                      ) : (
                        <span className="text-secondary-400">-</span>
                      )}
                    </td>
                    <td>
                      {record.check_out_photo ? (
                        <img 
                          src={`http://localhost/Nhom9/backend/face_recognition/attendance_photos/${record.check_out_photo}`}
                          alt="Check out"
                          className="w-12 h-12 rounded object-cover cursor-pointer hover:scale-150 transition-transform"
                          title="Click để phóng to"
                        />
                      ) : (
                        <span className="text-secondary-400 text-xs">-</span>
                      )}
                    </td>
                    <td>
                      {record.check_out ? (
                        <span className="flex items-center">
                          <FaClock className="mr-2 text-blue-600" />
                          {record.check_out}
                        </span>
                      ) : (
                        <span className="text-secondary-400">-</span>
                      )}
                    </td>
                    <td>
                      {record.check_in && record.check_out ? (
                        <span className="font-semibold">8.5h</span>
                      ) : (
                        <span className="text-secondary-400">-</span>
                      )}
                    </td>
                    <td>
                      {record.late_minutes > 0 ? (
                        <span className="badge badge-warning">{record.late_minutes} phút</span>
                      ) : (
                        <span className="text-secondary-400">-</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          record.status === 'present'
                            ? 'badge-success'
                            : record.status === 'absent'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {record.status === 'present'
                          ? 'Có mặt'
                          : record.status === 'absent'
                          ? 'Vắng'
                          : 'Nửa ngày'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Chấm công thủ công</h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nhân viên</label>
                    <select
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      required
                    >
                      <option value="">Chọn nhân viên</option>
                      {employees.map(emp => (
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
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Giờ ra (tùy chọn)</label>
                    <input
                      type="time"
                      value={formData.check_out_time}
                      onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Trạng thái</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
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
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
