import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { FaCheck, FaTimes } from 'react-icons/fa';

const LeaveApprovals = () => {
  const { user } = useAuth();
  const [allLeaveRequests, setAllLeaveRequests] = useState([]);
  const [managedDepartment, setManagedDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // pending, approved, rejected, all

  useEffect(() => {
    if (user && user.employee_id) {
      fetchLeaveRequests();
    }
  }, [user]);

  const fetchLeaveRequests = async () => {
    if (!user || !user.employee_id) {
      console.log('User not ready yet');
      return;
    }
    
    try {
      setLoading(true);
      
      // Lấy thông tin phòng ban
      const deptRes = await api.get('/departments');
      const departments = deptRes.data.data || [];
      const myDept = departments.find(d => d.manager_id === user.employee_id);
      
      if (!myDept) {
        console.log('No department found for employee_id:', user.employee_id);
        setManagedDepartment(null);
        setLoading(false);
        return;
      }
      
      setManagedDepartment(myDept);
      
      // Lấy tất cả leave requests của phòng ban (gửi department_id để backend lọc)
      const leavesRes = await api.get('/leave_requests', {
        params: { department_id: myDept.department_id }
      });
      const departmentLeaves = leavesRes.data.data || [];
      
      setAllLeaveRequests(departmentLeaves);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast.error('Không thể tải dữ liệu nghỉ phép');
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    try {
      await api.put(`/leave_requests/${leaveId}/approve`);
      toast.success('Đã phê duyệt đơn nghỉ phép!');
      fetchLeaveRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể phê duyệt đơn');
    }
  };

  const handleReject = async (leaveId) => {
    try {
      await api.put(`/leave_requests/${leaveId}/reject`);
      toast.success('Đã từ chối đơn nghỉ phép');
      fetchLeaveRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể từ chối đơn');
    }
  };

  // Filter requests based on selected filter
  const filteredRequests = filter === 'all' 
    ? allLeaveRequests 
    : allLeaveRequests.filter((r) => r.status === filter);

  // Calculate counts from all requests
  const statusCounts = {
    all: allLeaveRequests.length,
    pending: allLeaveRequests.filter((r) => r.status === 'pending').length,
    approved: allLeaveRequests.filter((r) => r.status === 'approved').length,
    rejected: allLeaveRequests.filter((r) => r.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner border-purple-600 border-t-transparent w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.employee_id) {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đang tải thông tin người dùng</h2>
          <p className="text-gray-600">Vui lòng đợi...</p>
        </div>
      </div>
    );
  }

  if (!managedDepartment) {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn không quản lý phòng ban nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Duyệt Nghỉ phép</h2>
          <p className="text-gray-600 mt-1">
            Phê duyệt đơn nghỉ phép - <span className="font-semibold text-purple-600">{managedDepartment.department_name}</span>
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="card">
          <div className="flex space-x-4">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'pending', label: 'Chờ duyệt' },
              { key: 'approved', label: 'Đã duyệt' },
              { key: 'rejected', label: 'Từ chối' },
            ].map((tab) => {
              const isActive = filter === tab.key;
              
              // Define explicit colors for each tab
              let activeClass = '';
              let hoverClass = '';
              let badgeClass = '';
              
              if (tab.key === 'all') {
                activeClass = 'bg-blue-600 text-white shadow-lg';
                hoverClass = 'hover:bg-blue-50 hover:border-blue-300';
                badgeClass = 'bg-blue-100 text-blue-700';
              } else if (tab.key === 'pending') {
                activeClass = 'bg-yellow-600 text-white shadow-lg';
                hoverClass = 'hover:bg-yellow-50 hover:border-yellow-300';
                badgeClass = 'bg-yellow-100 text-yellow-700';
              } else if (tab.key === 'approved') {
                activeClass = 'bg-green-600 text-white shadow-lg';
                hoverClass = 'hover:bg-green-50 hover:border-green-300';
                badgeClass = 'bg-green-100 text-green-700';
              } else {
                activeClass = 'bg-red-600 text-white shadow-lg';
                hoverClass = 'hover:bg-red-50 hover:border-red-300';
                badgeClass = 'bg-red-100 text-red-700';
              }
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    isActive
                      ? activeClass
                      : `bg-white border border-gray-300 text-gray-700 ${hoverClass}`
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                    isActive ? 'bg-white/20' : badgeClass
                  }`}>
                    {statusCounts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div key={request.leave_request_id} className="card hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                      <span className="font-bold text-purple-600">
                        {request.employee_name?.charAt(0) || request.full_name?.charAt(0) || 'N'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {request.employee_name || request.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">{request.employee_code}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Loại phép</p>
                      <p className="font-medium text-gray-800">{request.leave_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Từ ngày</p>
                      <p className="font-medium text-gray-800">
                        {new Date(request.start_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Đến ngày</p>
                      <p className="font-medium text-gray-800">
                        {new Date(request.end_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Số ngày</p>
                      <p className="font-medium text-gray-800">{request.total_days} ngày</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Lý do</p>
                    <p className="text-gray-700">{request.reason || 'Không có lý do'}</p>
                  </div>

                  <p className="text-xs text-gray-500">
                    Gửi lúc: {new Date(request.request_date || request.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>

                <div className="flex flex-col items-end space-y-3 mt-4 md:mt-0 md:ml-6">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      request.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : request.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {request.status === 'pending'
                      ? 'Chờ duyệt'
                      : request.status === 'approved'
                      ? 'Đã duyệt'
                      : 'Từ chối'}
                  </span>

                  {request.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(request.leave_request_id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center"
                      >
                        <FaCheck className="mr-2" />
                        Duyệt
                      </button>
                      <button
                        onClick={() => handleReject(request.leave_request_id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center"
                      >
                        <FaTimes className="mr-2" />
                        Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredRequests.length === 0 && (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg">Không có yêu cầu nghỉ phép nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveApprovals;
