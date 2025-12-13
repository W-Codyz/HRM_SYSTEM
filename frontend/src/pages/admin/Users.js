import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all users
      const usersRes = await api.get('/users');
      const allUsers = usersRes.data.data || [];
      
      // Fetch pending users
      const pendingRes = await api.get('/users/pending');
      const pending = pendingRes.data.data || [];
      
      setUsers(allUsers.filter(u => u.status !== 'pending'));
      setPendingUsers(pending);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể tải danh sách người dùng');
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await api.put(`/users/${userId}/approve`);
      toast.success('Phê duyệt người dùng thành công');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể phê duyệt người dùng');
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.put(`/users/${userId}/reject`);
      toast.success('Từ chối người dùng thành công');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể từ chối người dùng');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      toast.success('Cập nhật vai trò thành công');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật vai trò');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) {
      try {
        await api.delete(`/users/${userId}`);
        toast.success('Xóa người dùng thành công');
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể xóa người dùng');
      }
    }
  };

  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Người dùng</h2>
          <p className="text-gray-600 mt-1">
            Phê duyệt và quản lý tài khoản người dùng
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex space-x-4 border-b border-gray-200 px-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-3 font-medium transition-all ${
                activeTab === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Tất cả người dùng ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-3 font-medium transition-all ${
                activeTab === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Chờ phê duyệt ({pendingUsers.length})
              {pendingUsers.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                  {pendingUsers.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">Đang tải...</p>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">Không có người dùng chờ duyệt</p>
              </div>
            ) : (
              pendingUsers.map((user) => (
                <div key={user.user_id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-2xl">👤</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.username}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Đăng ký: {new Date(user.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleApprove(user.user_id)}
                        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
                      >
                        <span>✓</span>
                        Phê duyệt
                      </button>
                      <button
                        onClick={() => handleReject(user.user_id)}
                        className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2"
                      >
                        <span>✗</span>
                        Từ chối
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên đăng nhập</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Đang tải...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Không tìm thấy người dùng</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.user_id}>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(user.user_id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
