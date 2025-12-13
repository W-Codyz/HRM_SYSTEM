import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FaCheck, FaTimes, FaEye, FaFilter } from 'react-icons/fa';

const LeaveRequests = () => {
  const [filter, setFilter] = useState('all');
  const [allLeaveRequests, setAllLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      // Always fetch all requests to maintain accurate counts
      const response = await api.get('/leave_requests');
      setAllLeaveRequests(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast.error('Failed to load leave requests');
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/leave_requests/${id}/approve`, {});
      toast.success('Đã phê duyệt yêu cầu nghỉ phép');
      fetchLeaveRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/leave_requests/${id}/reject`, {});
      toast.success('Đã từ chối yêu cầu nghỉ phép');
      fetchLeaveRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
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
        <div className="spinner border-blue-600 border-t-transparent w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">Quản lý Nghỉ phép</h2>
          <p className="text-secondary-600 mt-1">Xem và phê duyệt yêu cầu nghỉ phép</p>
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
            <div key={request.leave_request_id || request.id} className="card hover:shadow-soft-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                      <span className="font-bold text-primary-600">
                        {request.full_name?.charAt(0) || 'N'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900 text-lg">
                        {request.full_name}
                      </h3>
                      <p className="text-sm text-secondary-500">{request.employee_code}</p>
                      {request.department_name && (
                        <p className="text-xs text-secondary-400">{request.department_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-secondary-500 mb-1">Loại phép</p>
                      <p className="font-medium text-secondary-800">{request.leave_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-500 mb-1">Từ ngày</p>
                      <p className="font-medium text-secondary-800">
                        {new Date(request.start_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-500 mb-1">Đến ngày</p>
                      <p className="font-medium text-secondary-800">
                        {new Date(request.end_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-500 mb-1">Số ngày</p>
                      <p className="font-medium text-secondary-800">{request.total_days} ngày</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-secondary-500 mb-1">Lý do</p>
                    <p className="text-secondary-700">{request.reason || 'Không có lý do'}</p>
                  </div>

                  <p className="text-xs text-secondary-500">
                    Gửi lúc: {new Date(request.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>

                <div className="flex flex-col items-end space-y-3 mt-4 md:mt-0 md:ml-6">
                  <span
                    className={`badge ${
                      request.status === 'pending'
                        ? 'badge-warning'
                        : request.status === 'approved'
                        ? 'badge-success'
                        : 'badge-danger'
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
                        className="btn btn-success flex items-center"
                      >
                        <FaCheck className="mr-2" />
                        Duyệt
                      </button>
                      <button
                        onClick={() => handleReject(request.leave_request_id)}
                        className="btn btn-danger flex items-center"
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
              <p className="text-secondary-500">Không có yêu cầu nghỉ phép nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveRequests;
