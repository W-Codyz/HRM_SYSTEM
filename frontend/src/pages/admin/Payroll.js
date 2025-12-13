import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FaMoneyBillWave, FaCalculator, FaFileDownload, FaEye, FaEdit, FaTrash, FaCheck } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const Payroll = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [createData, setCreateData] = useState({
    employee_id: '',
    payroll_month: new Date().getMonth() + 1,
    payroll_year: new Date().getFullYear(),
    base_salary: '',
    total_allowances: '',
    overtime_pay: '',
    total_deductions: '',
    work_days: 26,
    notes: ''
  });

  useEffect(() => {
    fetchPayroll();
    fetchEmployees();
  }, [selectedMonth]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees?status=active');
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-');
      console.log('Fetching payroll for:', { month, year });
      const response = await api.get(`/payroll.php?month=${month}&year=${year}`);
      console.log('Payroll response:', response.data);
      setPayrollData(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payroll:', error);
      toast.error('Không thể tải dữ liệu lương');
      setLoading(false);
    }
  };

  const fetchPayrollDetails = async (payrollId) => {
    try {
      const response = await api.get(`/payroll.php/${payrollId}`);
      setSelectedPayroll(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching payroll details:', error);
      toast.error('Không thể tải chi tiết lương');
    }
  };

  const totalPayroll = payrollData.reduce((sum, p) => sum + parseFloat(p.net_salary || 0), 0);
  const paidCount = payrollData.filter((p) => p.status === 'paid').length;
  const pendingCount = payrollData.filter((p) => p.status === 'pending' || p.status === 'revised').length;
  const needReviewCount = payrollData.filter((p) => p.status === 'need_review').length;

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { bg: 'bg-yellow-100 text-yellow-800', text: 'Chờ duyệt' },
      'approved': { bg: 'bg-blue-100 text-blue-800', text: 'Đã duyệt' },
      'need_review': { bg: 'bg-red-100 text-red-800', text: 'Cần xem lại' },
      'revised': { bg: 'bg-purple-100 text-purple-800', text: 'Đã chỉnh sửa' },
      'paid': { bg: 'bg-green-100 text-green-800', text: 'Đã thanh toán' }
    };
    return badges[status] || { bg: 'bg-gray-100 text-gray-800', text: status };
  };

  const handleCreatePayroll = async () => {
    try {
      await api.post('/payroll.php', createData);
      toast.success('Tạo bảng lương thành công');
      setShowCreateModal(false);
      resetCreateForm();
      fetchPayroll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Tạo bảng lương thất bại');
    }
  };

  const resetCreateForm = () => {
    setCreateData({
      employee_id: '',
      payroll_month: new Date().getMonth() + 1,
      payroll_year: new Date().getFullYear(),
      base_salary: '',
      total_allowances: '',
      overtime_pay: '',
      total_deductions: '',
      work_days: 26,
      notes: ''
    });
  };

  const handleCalculateAll = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn tính lương cho tất cả nhân viên?')) return;
    
    try {
      const [year, month] = selectedMonth.split('-');
      console.log('Sending payroll calculation:', { month: parseInt(month), year: parseInt(year) });
      const response = await api.post('/payroll.php/calculate', { month: parseInt(month), year: parseInt(year) });
      console.log('Payroll calculation response:', response);
      toast.success(response.data.message || 'Đã tính lương cho tất cả nhân viên');
      fetchPayroll();
    } catch (error) {
      console.error('Payroll calculation error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Tính lương thất bại');
    }
  };

  const handlePaySalary = async (id) => {
    if (!window.confirm('Xác nhận đã thanh toán lương?')) return;
    
    try {
      await api.post(`/payroll.php/${id}/pay`);
      toast.success('Đã thanh toán lương');
      fetchPayroll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thanh toán thất bại');
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Xác nhận duyệt lương?')) return;
    
    try {
      await api.post(`/payroll.php/${id}/approve`);
      toast.success('Đã duyệt lương');
      fetchPayroll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Duyệt lương thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) return;
    
    try {
      await api.delete(`/payroll.php/${id}`);
      toast.success('Đã xóa bản ghi lương');
      fetchPayroll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleEdit = (payroll) => {
    setEditData({
      payroll_id: payroll.payroll_id,
      base_salary: payroll.base_salary,
      total_allowances: payroll.total_allowances,
      overtime_pay: payroll.overtime_pay,
      total_deductions: payroll.total_deductions,
      work_days: payroll.work_days,
      admin_notes: payroll.admin_notes || '',
      notes: payroll.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/payroll.php/${editData.payroll_id}`, editData);
      toast.success('Cập nhật lương thành công');
      setShowEditModal(false);
      fetchPayroll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const exportToExcel = () => {
    if (payrollData.length === 0) {
      toast.warning('Không có dữ liệu để xuất');
      return;
    }

    try {
      // Prepare data for export
      const [year, month] = selectedMonth.split('-');
      const exportData = payrollData.map((p, index) => ({
        'STT': index + 1,
        'Mã NV': p.employee_code,
        'Họ và tên': p.full_name,
        'Phòng ban': p.department_name,
        'Chức vụ': p.position_name || 'N/A',
        'Lương cơ bản': parseFloat(p.base_salary),
        'Phụ cấp': parseFloat(p.total_allowances || 0),
        'Lương tăng ca': parseFloat(p.overtime_pay || 0),
        'Tổng lương': parseFloat(p.base_salary) + parseFloat(p.total_allowances || 0) + parseFloat(p.overtime_pay || 0),
        'Khấu trừ': parseFloat(p.total_deductions || 0),
        'Lương thực lĩnh': parseFloat(p.net_salary),
        'Ngày công': p.actual_work_days + '/' + p.work_days,
        'Trạng thái': getStatusBadge(p.status).text
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 5 },  // STT
        { wch: 12 }, // Mã NV
        { wch: 25 }, // Họ tên
        { wch: 20 }, // Phòng ban
        { wch: 20 }, // Chức vụ
        { wch: 15 }, // Lương CB
        { wch: 15 }, // Phụ cấp
        { wch: 15 }, // Tăng ca
        { wch: 15 }, // Tổng lương
        { wch: 15 }, // Khấu trừ
        { wch: 18 }, // Thực lĩnh
        { wch: 15 }, // Ngày công
        { wch: 15 }  // Trạng thái
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Bảng lương T${month}-${year}`);

      // Generate file name with current date
      const fileName = `Bang_luong_T${month}_${year}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(wb, fileName);
      
      toast.success('Xuất file Excel thành công!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Lỗi khi xuất file Excel');
    }
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">Quản lý Lương</h2>
            <p className="text-secondary-600 mt-1">Tính toán và thanh toán lương nhân viên</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input"
            />
            <button onClick={() => setShowCreateModal(true)} className="btn btn-success flex items-center">
              <FaMoneyBillWave className="mr-2" />
              Tạo lương mới
            </button>
            <button onClick={handleCalculateAll} className="btn btn-primary flex items-center">
              <FaCalculator className="mr-2" />
              Tính lương
            </button>
            <button onClick={exportToExcel} className="btn btn-secondary flex items-center">
              <FaFileDownload className="mr-2" />
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm mb-1">Tổng quỹ lương</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('vi-VN').format(totalPayroll)} đ
                </p>
              </div>
              <FaMoneyBillWave className="text-4xl text-primary-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Đã thanh toán</p>
                <p className="text-2xl font-bold">
                  {paidCount}/{payrollData.length}
                </p>
              </div>
              <FaCheck className="text-4xl text-green-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm mb-1">Chờ duyệt</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <FaCalculator className="text-4xl text-yellow-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm mb-1">Cần xem lại</p>
                <p className="text-2xl font-bold">{needReviewCount}</p>
              </div>
              <FaFileDownload className="text-4xl text-red-200" />
            </div>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã NV</th>
                  <th>Họ tên</th>
                  <th>Phòng ban</th>
                  <th>Lương CB</th>
                  <th>Phụ cấp</th>
                  <th>Tăng ca</th>
                  <th>Khấu trừ</th>
                  <th>Thực lĩnh</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-secondary-500">
                      Chưa có dữ liệu lương cho tháng này. Nhấn "Tính lương" để bắt đầu.
                    </td>
                  </tr>
                ) : (
                  payrollData.map((payroll) => (
                    <tr key={payroll.payroll_id}>
                      <td className="font-semibold text-primary-600">{payroll.employee_code}</td>
                      <td>{payroll.full_name}</td>
                      <td>{payroll.department_name}</td>
                      <td>{new Intl.NumberFormat('vi-VN').format(payroll.base_salary)} đ</td>
                      <td className="text-green-600">
                      +{new Intl.NumberFormat('vi-VN').format(payroll.total_allowances || 0)} đ
                      </td>
                      <td className="text-blue-600">
                        +{new Intl.NumberFormat('vi-VN').format(payroll.overtime_pay || 0)} đ
                      </td>
                      <td className="text-red-600">
                      -{new Intl.NumberFormat('vi-VN').format(payroll.total_deductions || 0)} đ
                      </td>
                      <td className="font-bold text-lg text-secondary-900">
                        {new Intl.NumberFormat('vi-VN').format(payroll.net_salary)} đ
                      </td>
                      <td>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(payroll.status).bg}`}>
                          {getStatusBadge(payroll.status).text}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => fetchPayrollDetails(payroll.payroll_id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Xem chi tiết"
                          >
                            <FaEye />
                          </button>
                          {(payroll.status === 'pending' || payroll.status === 'need_review' || payroll.status === 'revised') && (
                            <>
                              <button 
                                onClick={() => handleEdit(payroll)}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                title="Chỉnh sửa"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                onClick={() => handleDelete(payroll.payroll_id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Xóa"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                          {payroll.status === 'approved' && (
                            <button
                              onClick={() => handlePaySalary(payroll.payroll_id)}
                              className="btn btn-success btn-sm"
                            >
                              Thanh toán
                            </button>
                          )}
                          {payroll.status === 'need_review' && payroll.notes && (
                            <span className="text-xs text-red-600 italic">({payroll.notes})</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Chi tiết lương - Tháng {selectedPayroll.payroll_month}/{selectedPayroll.payroll_year}</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Employee Info */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Thông tin nhân viên</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Mã nhân viên</p>
                    <p className="font-semibold">{selectedPayroll.employee_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Họ tên</p>
                    <p className="font-semibold">{selectedPayroll.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phòng ban</p>
                    <p className="font-semibold">{selectedPayroll.department_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Chức vụ</p>
                    <p className="font-semibold">{selectedPayroll.position_name}</p>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Chi tiết lương</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lương cơ bản</span>
                    <span className="font-semibold">{new Intl.NumberFormat('vi-VN').format(selectedPayroll.base_salary)} đ</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Phụ cấp</span>
                    <span className="font-semibold">+{new Intl.NumberFormat('vi-VN').format(selectedPayroll.total_allowances || 0)} đ</span>
                  </div>
                  <div className="flex justify-between text-purple-600">
                    <span>Lương tăng ca</span>
                    <span className="font-semibold">+{new Intl.NumberFormat('vi-VN').format(selectedPayroll.overtime_pay || 0)} đ</span>
                  </div>
                  <div className="flex justify-between text-blue-600 font-semibold border-t pt-2">
                    <span>Tổng lương</span>
                    <span>{new Intl.NumberFormat('vi-VN').format((parseFloat(selectedPayroll.base_salary || 0) + parseFloat(selectedPayroll.total_allowances || 0) + parseFloat(selectedPayroll.overtime_pay || 0)))} đ</span>
                  </div>
                </div>
              </div>

              {/* Allowances Detail */}
              {selectedPayroll.allowances_detail && selectedPayroll.allowances_detail.length > 0 && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-3">Chi tiết phụ cấp</h3>
                  {selectedPayroll.allowances_detail.map((allowance, index) => (
                    <div key={index} className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">{allowance.allowance_name}</span>
                      <span className="text-green-600">+{new Intl.NumberFormat('vi-VN').format(allowance.amount)} đ</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Deductions */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Các khoản khấu trừ</h3>
                {selectedPayroll.deductions_detail && selectedPayroll.deductions_detail.length > 0 ? (
                  selectedPayroll.deductions_detail.map((deduction, index) => {
                    const amount = (parseFloat(selectedPayroll.base_salary || 0) * parseFloat(deduction.rate || 0)) / 100;
                    return (
                      <div key={index} className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">{deduction.deduction_name || deduction.deduction_type}: {deduction.description}</span>
                        <span className="text-red-600">-{new Intl.NumberFormat('vi-VN').format(amount)} đ ({deduction.rate}%)</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng khấu trừ</span>
                    <span className="text-red-600 font-semibold">-{new Intl.NumberFormat('vi-VN').format(selectedPayroll.total_deductions || 0)} đ</span>
                  </div>
                )}
              </div>

              {/* Work Days */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Chấm công</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Ngày công chuẩn</p>
                    <p className="font-semibold">{selectedPayroll.work_days} ngày</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày công thực tế</p>
                    <p className="font-semibold">{selectedPayroll.actual_work_days} ngày</p>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Lương thực lĩnh</span>
                  <span className="text-3xl font-bold text-blue-600">
                    {new Intl.NumberFormat('vi-VN').format(selectedPayroll.net_salary)} đ
                  </span>
                </div>
              </div>

              {selectedPayroll.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Ghi chú</p>
                  <p className="text-gray-800">{selectedPayroll.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Chỉnh sửa lương</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Lương cơ bản</label>
                <input
                  type="number"
                  value={editData.base_salary}
                  onChange={(e) => setEditData({ ...editData, base_salary: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phụ cấp</label>
                <input
                  type="number"
                  value={editData.total_allowances}
                  onChange={(e) => setEditData({ ...editData, total_allowances: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Lương tăng ca</label>
                <input
                  type="number"
                  value={editData.overtime_pay}
                  onChange={(e) => setEditData({ ...editData, overtime_pay: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Khấu trừ</label>
                <input
                  type="number"
                  value={editData.total_deductions}
                  onChange={(e) => setEditData({ ...editData, total_deductions: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ngày công</label>
                <input
                  type="number"
                  value={editData.work_days}
                  onChange={(e) => setEditData({ ...editData, work_days: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú cho nhân viên</label>
                <textarea
                  value={editData.admin_notes}
                  onChange={(e) => setEditData({ ...editData, admin_notes: e.target.value })}
                  className="input w-full"
                  rows="3"
                  placeholder="Ghi chú từ admin cho nhân viên"
                />
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Lưu
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Tạo bảng lương mới</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nhân viên *</label>
                <select
                  value={createData.employee_id}
                  onChange={(e) => {
                    const employee = employees.find(emp => emp.employee_id == e.target.value);
                    setCreateData({ 
                      ...createData, 
                      employee_id: e.target.value,
                      base_salary: employee?.salary || ''
                    });
                  }}
                  className="input w-full"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tháng *</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={createData.payroll_month}
                    onChange={(e) => setCreateData({ ...createData, payroll_month: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Năm *</label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={createData.payroll_year}
                    onChange={(e) => setCreateData({ ...createData, payroll_year: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Lương cơ bản *</label>
                <input
                  type="number"
                  value={createData.base_salary}
                  onChange={(e) => setCreateData({ ...createData, base_salary: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phụ cấp</label>
                <input
                  type="number"
                  value={createData.total_allowances}
                  onChange={(e) => setCreateData({ ...createData, total_allowances: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Lương tăng ca</label>
                <input
                  type="number"
                  value={createData.overtime_pay}
                  onChange={(e) => setCreateData({ ...createData, overtime_pay: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Khấu trừ</label>
                <input
                  type="number"
                  value={createData.total_deductions}
                  onChange={(e) => setCreateData({ ...createData, total_deductions: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ngày công</label>
                <input
                  type="number"
                  step="0.5"
                  value={createData.work_days}
                  onChange={(e) => setCreateData({ ...createData, work_days: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú</label>
                <textarea
                  value={createData.notes}
                  onChange={(e) => setCreateData({ ...createData, notes: e.target.value })}
                  className="input w-full"
                  rows="3"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm font-medium">Lương thực lĩnh dự kiến:</p>
                <p className="text-xl font-bold text-blue-600">
                  {new Intl.NumberFormat('vi-VN').format(
                    (parseFloat(createData.base_salary) || 0) + 
                    (parseFloat(createData.total_allowances) || 0) + 
                    (parseFloat(createData.overtime_pay) || 0) - 
                    (parseFloat(createData.total_deductions) || 0)
                  )} đ
                </p>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleCreatePayroll}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Tạo
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
