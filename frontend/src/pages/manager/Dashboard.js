import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
    lateToday: 0
  });
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch department employees
      const empRes = await api.get('/employees');
      const employees = empRes.data.data || [];
      setDepartmentEmployees(employees);
      
      // Fetch pending leave requests
      const leavesRes = await api.get('/leave_requests', { params: { status: 'pending' } });
      const leaves = leavesRes.data.data || [];
      setPendingLeaves(leaves);
      
      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attRes = await api.get('/attendance', { params: { date: today } });
      const attendance = attRes.data.data || [];
      setTodayAttendance(attendance);
      
      // Calculate stats
      const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
      const late = attendance.filter(a => a.status === 'late').length;
      
      setStats({
        totalEmployees: employees.length,
        presentToday: present,
        absentToday: employees.length - present,
        pendingLeaves: leaves.length,
        lateToday: late
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      await api.put(`/leave_requests/${leaveId}/approve`);
      toast.success('Leave request approved!');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve leave');
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      await api.put(`/leave_requests/${leaveId}/reject`);
      toast.success('Leave request rejected');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject leave');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner border-blue-600 border-t-transparent w-12 h-12"></div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'approved': 'bg-green-100 text-green-800 border-green-300',
      'rejected': 'bg-red-100 text-red-800 border-red-300',
      'present': 'bg-green-100 text-green-800 border-green-300',
      'late': 'bg-orange-100 text-orange-800 border-orange-300',
      'absent': 'bg-red-100 text-red-800 border-red-300'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Manager Dashboard 👔
        </h1>
        <p className="text-gray-600 mt-1">Manage your team and track performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Total Team</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalEmployees}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-3xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Present Today</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.presentToday}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="text-3xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Absent Today</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.absentToday}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <span className="text-3xl">❌</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Late Today</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.lateToday}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <span className="text-3xl">⚠️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Pending Leaves</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingLeaves}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <span className="text-3xl">📝</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pending Leave Approvals */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Pending Leave Requests</h2>
              <p className="text-sm text-gray-500 mt-1">Approve or reject team leave requests</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <span className="text-3xl">⏳</span>
            </div>
          </div>
          {pendingLeaves.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingLeaves.map((leave) => (
                <div key={leave.leave_request_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{leave.employee_name}</h3>
                      <p className="text-sm text-gray-500">{leave.leave_name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(leave.status)}`}>
                      {leave.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-gray-600 text-xs">Start Date</p>
                      <p className="font-medium text-gray-800">
                        {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-gray-600 text-xs">End Date</p>
                      <p className="font-medium text-gray-800">
                        {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded">
                    <span className="font-medium">Reason:</span> {leave.reason}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveLeave(leave.leave_request_id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium text-sm"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleRejectLeave(leave.leave_request_id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 font-medium text-sm"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">✨</div>
              <p className="text-gray-500">No pending leave requests</p>
              <p className="text-gray-400 text-sm mt-1">All caught up!</p>
            </div>
          )}
        </div>

        {/* Today's Attendance */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Today's Attendance</h2>
              <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-3xl">📊</span>
            </div>
          </div>
          {todayAttendance.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {todayAttendance.map((att) => (
                <div key={att.attendance_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      att.status === 'present' ? 'bg-green-500' : 
                      att.status === 'late' ? 'bg-orange-500' : 
                      'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{att.employee_name}</p>
                      <p className="text-xs text-gray-500">{att.position_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(att.status)}`}>
                      {att.status.toUpperCase()}
                    </span>
                    {att.check_in_time && (
                      <p className="text-xs text-gray-600 mt-1">
                        In: {new Date('1970-01-01T' + att.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500">No attendance records yet</p>
              <p className="text-gray-400 text-sm mt-1">Records will appear as employees check in</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Team Members</h2>
            <p className="text-sm text-gray-500 mt-1">Your department employees</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-lg">
            <span className="text-3xl">👥</span>
          </div>
        </div>
        {departmentEmployees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentEmployees.map((emp) => (
              <div key={emp.employee_id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {emp.full_name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{emp.full_name}</h3>
                    <p className="text-xs text-gray-500">{emp.employee_code}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>💼</span>
                    <span>{emp.position_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📧</span>
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <span>{emp.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">👤</div>
            <p className="text-gray-500">No team members found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
