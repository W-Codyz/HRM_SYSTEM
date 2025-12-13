import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    department_name: '',
    department_code: '',
    manager_id: '',
    description: '',
  });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments');
      setDepartments(response.data.data || []);
      setLoading(false);
    } catch (error) {
      toast.error('Không thể tải danh sách phòng ban');
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/departments/${editingId}`, formData);
        toast.success('Cập nhật phòng ban thành công');
      } else {
        await api.post('/departments', formData);
        toast.success('Tạo phòng ban thành công');
      }
      resetForm();
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleEdit = (department) => {
    setEditingId(department.department_id);
    setFormData({
      department_name: department.department_name,
      department_code: department.department_code,
      manager_id: department.manager_id || '',
      description: department.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng ban này không?')) {
      try {
        await api.delete(`/departments/${id}`);
        toast.success('Xóa phòng ban thành công');
        fetchDepartments();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Xóa thất bại');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      department_name: '',
      department_code: '',
      manager_id: '',
      description: '',
    });
    setEditingId(null);
    setShowModal(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Phòng ban</h1>
          <p className="text-gray-600">Quản lý các phòng ban trong công ty</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          + Thêm phòng ban
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tổng số phòng ban</p>
              <p className="text-2xl font-bold text-gray-800">{departments.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-3xl">🏢</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Có quản lý</p>
              <p className="text-2xl font-bold text-gray-800">
                {departments.filter(d => d.manager_id).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-3xl">👨‍💼</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tổng nhân viên</p>
              <p className="text-2xl font-bold text-gray-800">
                {departments.reduce((sum, d) => sum + (d.employee_count || 0), 0)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <span className="text-3xl">👥</span>
            </div>
          </div>
        </div>
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phòng ban</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quản lý</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhân viên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {departments.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  Không có phòng ban nào. Hãy tạo phòng ban đầu tiên!
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.department_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <span className="text-xl">🏢</span>
                      </div>
                      <div className="font-medium text-gray-900">{dept.department_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {dept.manager_name || <span className="text-gray-400">Chưa chỉ định</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {dept.employee_count || 0} employees
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {dept.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleEdit(dept)}
                      className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(dept.department_id)}
                      className="text-red-600 hover:text-red-800 px-3 py-1 rounded"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingId ? 'Edit Department' : 'Add New Department'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Name *
                </label>
                <input
                  type="text"
                  name="department_name"
                  value={formData.department_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="VD: Phòng Kỹ Thuật"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Code *
                </label>
                <input
                  type="text"
                  name="department_code"
                  value={formData.department_code}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="VD: IT"
                  required
                  disabled={editingId ? true : false}
                />
                {editingId && (
                  <p className="text-xs text-gray-500 mt-1">Mã phòng ban không thể thay đổi</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager
                </label>
                <select
                  name="manager_id"
                  value={formData.manager_id}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">Select Manager</option>
                  {employees
                    .filter((emp) => emp.status === 'active')
                    .map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.full_name} - {emp.employee_code}
                      </option>
                    ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows="3"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Departments;
