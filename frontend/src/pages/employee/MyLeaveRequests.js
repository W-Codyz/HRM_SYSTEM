import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const MyLeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveTypes();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leave_requests');
      setLeaveRequests(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi tải danh sách nghỉ phép:', error);
      toast.error('Không thể tải danh sách nghỉ phép');
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      // Simulated leave types - you may need to create an API endpoint for this
      setLeaveTypes([
        { leave_type_id: 1, leave_name: 'Nghỉ phép năm', max_days: 12 },
        { leave_type_id: 2, leave_name: 'Nghỉ ốm', max_days: 30 },
        { leave_type_id: 3, leave_name: 'Nghỉ cá nhân', max_days: 5 },
        { leave_type_id: 4, leave_name: 'Nghỉ thai sản', max_days: 90 }
      ]);
    } catch (error) {
      console.error('Lỗi tải loại nghỉ:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leave_requests', formData);
      toast.success('Gửi đơn xin nghỉ thành công!');
      setShowModal(false);
      setFormData({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
      fetchLeaveRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gửi đơn thất bại');
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đơn xin nghỉ này không?')) {
      try {
        await api.put(`/leave_requests/${id}/cancel`);
        toast.success('Hủy đơn xin nghỉ thành công');
        fetchLeaveRequests();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Hủy đơn thất bại');
      }
    }
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

  const stats = leaveRequests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    if (req.status === 'approved') {
      acc.totalDays += parseInt(req.total_days) || 0;
    }
    return acc;
  }, { pending: 0, approved: 0, rejected: 0, totalDays: 0 });

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Yêu cầu nghỉ phép của tôi</h1>
          <p className="text-gray-600 mt-2">Quản lý các đơn xin nghỉ phép</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
        >
          + Tạo đơn mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-yellow-50 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Chờ duyệt</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Đã duyệt</div>
          <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Từ chối</div>
          <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Tổng ngày đã nghỉ</div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalDays}</div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại nghỉ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày bắt đầu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày kết thúc</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số ngày</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý do</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Đang tải...</td>
                </tr>
              ) : leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Chưa có đơn xin nghỉ nào</td>
                </tr>
              ) : (
                leaveRequests.map((request) => (
                  <tr key={request.leave_request_id}>
                    <td className="px-6 py-4 whitespace-nowrap">{request.leave_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(request.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(request.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{request.total_days}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate">{request.reason || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(request.leave_request_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">New Leave Request</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                <select
                  value={formData.leave_type_id}
                  onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map(type => (
                    <option key={type.leave_type_id} value={type.leave_type_id}>
                      {type.leave_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows="3"
                  placeholder="Enter reason for leave..."
                ></textarea>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeaveRequests;
