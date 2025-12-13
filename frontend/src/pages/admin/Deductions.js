import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

function DeductionsManagement() {
  const [deductions, setDeductions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [formData, setFormData] = useState({
    deduction_name: '',
    deduction_code: '',
    deduction_type: 'other',
    rate: '',
    description: '',
    is_active: 1
  });

  useEffect(() => {
    fetchDeductions();
  }, []);

  const fetchDeductions = async () => {
    try {
      const response = await api.get('/deductions.php');
      setDeductions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching deductions:', error);
      toast.error('Không thể tải danh sách khấu trừ');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDeduction) {
        await api.put(`/deductions.php/${editingDeduction.deduction_id}`, formData);
        toast.success('Cập nhật khấu trừ thành công');
      } else {
        await api.post('/deductions.php', formData);
        toast.success('Thêm khấu trừ thành công');
      }
      setShowModal(false);
      setEditingDeduction(null);
      resetForm();
      fetchDeductions();
    } catch (error) {
      console.error('Error saving deduction:', error);
      toast.error('Lưu khấu trừ thất bại');
    }
  };

  const handleEdit = (deduction) => {
    setEditingDeduction(deduction);
    setFormData({
      deduction_name: deduction.deduction_name,
      deduction_code: deduction.deduction_code,
      deduction_type: deduction.deduction_type,
      rate: deduction.rate,
      description: deduction.description || '',
      is_active: deduction.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (deductionId) => {
    if (!window.confirm('Bạn có chắc muốn xóa khấu trừ này?')) return;
    
    try {
      await api.delete(`/deductions.php/${deductionId}`);
      toast.success('Xóa khấu trừ thành công');
      fetchDeductions();
    } catch (error) {
      console.error('Error deleting deduction:', error);
      toast.error('Xóa khấu trừ thất bại');
    }
  };

  const resetForm = () => {
    setFormData({
      deduction_name: '',
      deduction_code: '',
      deduction_type: 'other',
      rate: '',
      description: '',
      is_active: 1
    });
  };

  const handleAdd = () => {
    setEditingDeduction(null);
    resetForm();
    setShowModal(true);
  };

  const getDeductionTypeLabel = (type) => {
    const types = {
      insurance: 'Bảo hiểm',
      tax: 'Thuế',
      other: 'Khác'
    };
    return types[type] || type;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Khấu trừ</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Thêm Khấu trừ
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên khấu trừ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ lệ (%)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deductions.map((deduction) => (
              <tr key={deduction.deduction_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{deduction.deduction_code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{deduction.deduction_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {getDeductionTypeLabel(deduction.deduction_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{deduction.rate}%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    deduction.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {deduction.is_active ? 'Đang áp dụng' : 'Ngừng áp dụng'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleEdit(deduction)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(deduction.deduction_id)}
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
              {editingDeduction ? 'Sửa khấu trừ' : 'Thêm khấu trừ mới'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Mã khấu trừ</label>
                <input
                  type="text"
                  value={formData.deduction_code}
                  onChange={(e) => setFormData({...formData, deduction_code: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Tên khấu trừ</label>
                <input
                  type="text"
                  value={formData.deduction_name}
                  onChange={(e) => setFormData({...formData, deduction_name: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Loại</label>
                <select
                  value={formData.deduction_type}
                  onChange={(e) => setFormData({...formData, deduction_type: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="insurance">Bảo hiểm</option>
                  <option value="tax">Thuế</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Tỷ lệ (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({...formData, rate: e.target.value})}
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
                  <span className="text-sm">Đang áp dụng</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingDeduction(null);
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
                  {editingDeduction ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeductionsManagement;
