import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

function AllowancesManagement() {
  const [allowances, setAllowances] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState(null);
  const [formData, setFormData] = useState({
    allowance_name: '',
    allowance_code: '',
    amount: '',
    allowance_type: 'fixed',
    description: '',
    is_active: 1
  });

  useEffect(() => {
    fetchAllowances();
  }, []);

  const fetchAllowances = async () => {
    try {
      const response = await api.get('/allowances.php');
      setAllowances(response.data.data || []);
    } catch (error) {
      console.error('Error fetching allowances:', error);
      toast.error('Không thể tải danh sách phụ cấp');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAllowance) {
        await api.put(`/allowances.php/${editingAllowance.allowance_id}`, formData);
        toast.success('Cập nhật phụ cấp thành công');
      } else {
        await api.post('/allowances.php', formData);
        toast.success('Thêm phụ cấp thành công');
      }
      setShowModal(false);
      setEditingAllowance(null);
      resetForm();
      fetchAllowances();
    } catch (error) {
      console.error('Error saving allowance:', error);
      toast.error('Lưu phụ cấp thất bại');
    }
  };

  const handleEdit = (allowance) => {
    setEditingAllowance(allowance);
    setFormData({
      allowance_name: allowance.allowance_name,
      allowance_code: allowance.allowance_code,
      amount: allowance.amount,
      allowance_type: allowance.allowance_type,
      description: allowance.description || '',
      is_active: allowance.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (allowanceId) => {
    if (!window.confirm('Bạn có chắc muốn xóa phụ cấp này?')) return;
    
    try {
      await api.delete(`/allowances.php/${allowanceId}`);
      toast.success('Xóa phụ cấp thành công');
      fetchAllowances();
    } catch (error) {
      console.error('Error deleting allowance:', error);
      toast.error('Xóa phụ cấp thất bại');
    }
  };

  const resetForm = () => {
    setFormData({
      allowance_name: '',
      allowance_code: '',
      amount: '',
      allowance_type: 'fixed',
      description: '',
      is_active: 1
    });
  };

  const handleAdd = () => {
    setEditingAllowance(null);
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Phụ cấp</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Thêm Phụ cấp
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên phụ cấp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allowances.map((allowance) => (
              <tr key={allowance.allowance_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{allowance.allowance_code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{allowance.allowance_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {allowance.allowance_type === 'fixed' ? 'Cố định' : 'Phần trăm'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {Number(allowance.amount).toLocaleString('vi-VN')} VNĐ
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    allowance.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {allowance.is_active ? 'Đang sử dụng' : 'Ngừng sử dụng'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleEdit(allowance)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(allowance.allowance_id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingAllowance ? 'Sửa phụ cấp' : 'Thêm phụ cấp mới'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Mã phụ cấp</label>
                <input
                  type="text"
                  value={formData.allowance_code}
                  onChange={(e) => setFormData({...formData, allowance_code: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Tên phụ cấp</label>
                <input
                  type="text"
                  value={formData.allowance_name}
                  onChange={(e) => setFormData({...formData, allowance_name: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Loại</label>
                <select
                  value={formData.allowance_type}
                  onChange={(e) => setFormData({...formData, allowance_type: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="fixed">Cố định</option>
                  <option value="percentage">Phần trăm</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Số tiền</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows="3"
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active === 1}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked ? 1 : 0})}
                    className="mr-2"
                  />
                  <span className="text-sm">Đang sử dụng</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAllowance(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingAllowance ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllowancesManagement;
