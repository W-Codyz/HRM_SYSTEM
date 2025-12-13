import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

function Positions() {
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    position_name: '',
    department_id: '',
    base_salary: '',
    description: '',
  });

  useEffect(() => {
    fetchPositions();
    fetchDepartments();
  }, []);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/positions');
      setPositions(response.data.data || []);
      setLoading(false);
    } catch (error) {
      toast.error('Không thể tải danh sách chức vụ');
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải danh sách phòng ban:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert empty strings to null for optional fields
      const payload = {
        ...formData,
        department_id: formData.department_id === '' ? null : formData.department_id,
        base_salary: formData.base_salary === '' ? 0 : formData.base_salary,
        description: formData.description === '' ? null : formData.description,
      };

      if (editingId) {
        await api.put(`/positions/${editingId}`, payload);
        toast.success('Cập nhật chức vụ thành công');
      } else {
        await api.post('/positions', payload);
        toast.success('Tạo chức vụ thành công');
      }
      resetForm();
      fetchPositions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleEdit = (position) => {
    setEditingId(position.position_id);
    setFormData({
      position_name: position.position_name,
      department_id: position.department_id || '',
      base_salary: position.base_salary || '',
      description: position.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chức vụ này không?')) {
      try {
        await api.delete(`/positions/${id}`);
        toast.success('Xóa chức vụ thành công');
        fetchPositions();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Xóa thất bại');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      position_name: '',
      department_id: '',
      base_salary: '',
      description: '',
    });
    setEditingId(null);
    setShowModal(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
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
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Chức vụ</h1>
          <p className="text-gray-600">Quản lý các chức vụ và mức lương</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          + Thêm chức vụ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tổng chức vụ</p>
              <p className="text-2xl font-bold text-gray-800">{positions.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-3xl">💼</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg Base Salary</p>
              <p className="text-2xl font-bold text-gray-800">
                {positions.length > 0
                  ? formatCurrency(
                      positions.reduce((sum, p) => sum + parseFloat(p.base_salary || 0), 0) /
                        positions.length
                    )
                  : '0 ₫'}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Departments</p>
              <p className="text-2xl font-bold text-gray-800">{departments.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <span className="text-3xl">🏢</span>
            </div>
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {positions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No positions found. Create your first position!
                </td>
              </tr>
            ) : (
              positions.map((pos) => (
                <tr key={pos.position_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <span className="text-xl">💼</span>
                      </div>
                      <div className="font-medium text-gray-900">{pos.position_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {pos.department_name || <span className="text-gray-400">No department</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-green-600 font-semibold">
                      {formatCurrency(pos.base_salary)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {pos.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleEdit(pos)}
                      className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pos.position_id)}
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
              {editingId ? 'Edit Position' : 'Add New Position'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position Name *
                </label>
                <input
                  type="text"
                  name="position_name"
                  value={formData.position_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Salary *
                </label>
                <input
                  type="number"
                  name="base_salary"
                  value={formData.base_salary}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                  min="0"
                  step="100000"
                />
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

export default Positions;
