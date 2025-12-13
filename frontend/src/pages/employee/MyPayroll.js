import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FaMoneyBillWave, FaChartLine, FaDownload, FaEye, FaFileInvoice } from 'react-icons/fa';
import jsPDF from 'jspdf';

const MyPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectingPayrollId, setRejectingPayrollId] = useState(null);

  // Helper function to remove Vietnamese accents for PDF
  const removeVietnameseAccents = (str) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  useEffect(() => {
    fetchPayrolls();
  }, [selectedYear]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payroll.php');
      console.log('Employee payroll response:', response.data);
      const allPayrolls = response.data.data || [];
      console.log('All payrolls:', allPayrolls);
      // Filter by selected year if needed
      const filtered = selectedYear ? allPayrolls.filter(p => p.payroll_year == selectedYear) : allPayrolls;
      console.log('Filtered payrolls:', filtered);
      setPayrolls(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi tải dữ liệu lương:', error);
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
      console.error('Lỗi tải chi tiết lương:', error);
      toast.error('Không thể tải chi tiết lương');
    }
  };

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

  const handleApprove = async (payrollId) => {
    if (!window.confirm('Bạn xác nhận chấp nhận bảng lương này?')) return;
    
    try {
      await api.post(`/payroll.php/${payrollId}/approve`);
      toast.success('Đã chấp nhận bảng lương');
      fetchPayrolls();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể chấp nhận bảng lương');
    }
  };

  const handleReject = (payrollId) => {
    setRejectingPayrollId(payrollId);
    setShowRejectModal(true);
  };

  const submitReject = async () => {
    if (!rejectNotes.trim()) {
      toast.error('Vui lòng nhập lý do yêu cầu xem lại');
      return;
    }
    
    try {
      await api.post(`/payroll.php/${rejectingPayrollId}/reject`, { notes: rejectNotes });
      toast.success('Đã gửi yêu cầu xem lại bảng lương');
      setShowRejectModal(false);
      setRejectNotes('');
      setRejectingPayrollId(null);
      fetchPayrolls();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi yêu cầu');
    }
  };

  const stats = payrolls.reduce((acc, payroll) => {
    acc.totalEarned += parseFloat(payroll.net_salary || 0);
    acc.totalBase += parseFloat(payroll.base_salary || 0);
    acc.totalAllowances += parseFloat(payroll.total_allowances || 0);
    acc.totalOvertime += parseFloat(payroll.overtime_pay || 0);
    if (payroll.status === 'paid') {
      acc.totalPaid += parseFloat(payroll.net_salary || 0);
    }
    return acc;
  }, { totalEarned: 0, totalPaid: 0, totalBase: 0, totalAllowances: 0, totalOvertime: 0 });

  const years = [...new Set(payrolls.map(p => p.payroll_year))].sort((a, b) => b - a);
  if (!years.includes(new Date().getFullYear())) {
    years.unshift(new Date().getFullYear());
  }

  const downloadPayslip = (payroll) => {
    try {
      const doc = new jsPDF();
      
      // Add font support for Vietnamese (using default font)
      doc.setFont('helvetica', 'normal');
      
      // Colors
      const primaryColor = [41, 128, 185]; // Blue
      const successColor = [39, 174, 96]; // Green
      const dangerColor = [231, 76, 60]; // Red
      const darkColor = [44, 62, 80]; // Dark gray
      const lightGray = [236, 240, 241];
      
      // Header with gradient effect
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('PHIEU LUONG', 105, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text('SALARY SLIP', 105, 23, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text(`Ky luong: Thang ${payroll.payroll_month}/${payroll.payroll_year}`, 105, 33, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(...darkColor);
      
      // Employee Information Section
      let yPos = 50;
      doc.setFillColor(...lightGray);
      doc.rect(10, yPos, 190, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('THONG TIN NHAN VIEN', 15, yPos + 6);
      
      yPos += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      // Employee details in two columns
      doc.text('Ma nhan vien:', 15, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(payroll.employee_code, 60, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Ho va ten:', 110, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(removeVietnameseAccents(payroll.full_name), 145, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.text('Phong ban:', 15, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(removeVietnameseAccents(payroll.department_name || 'N/A'), 60, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Chuc vu:', 110, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(removeVietnameseAccents(payroll.position_name || 'N/A'), 145, yPos);
      
      // Salary Details Section
      yPos += 15;
      doc.setFillColor(...lightGray);
      doc.rect(10, yPos, 190, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('CHI TIET LUONG', 15, yPos + 6);
      
      yPos += 15;
      
      // Draw salary table manually
      doc.setFontSize(11);
      
      // Row 1: Luong co ban
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkColor);
      doc.text('Luong co ban:', 15, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(new Intl.NumberFormat('vi-VN').format(payroll.base_salary) + ' d', 200, yPos, { align: 'right' });
      
      // Row 2: Phu cap
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.text('Phu cap:', 15, yPos);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...successColor);
      doc.text('+' + new Intl.NumberFormat('vi-VN').format(payroll.total_allowances || 0) + ' d', 200, yPos, { align: 'right' });
      
      // Row 3: Luong tang ca
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkColor);
      doc.text('Luong tang ca:', 15, yPos);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...successColor);
      doc.text('+' + new Intl.NumberFormat('vi-VN').format(payroll.overtime_pay || 0) + ' d', 200, yPos, { align: 'right' });
      
      yPos += 10;
      
      // Gross Salary
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(10, yPos, 200, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Tong luong:', 15, yPos);
      doc.setTextColor(...primaryColor);
      const grossSalary = parseFloat(payroll.base_salary) + parseFloat(payroll.total_allowances || 0) + parseFloat(payroll.overtime_pay || 0);
      doc.text(new Intl.NumberFormat('vi-VN').format(grossSalary) + ' d', 200, yPos, { align: 'right' });
      
      // Deductions
      yPos += 10;
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Cac khoan khau tru:', 15, yPos);
      doc.setTextColor(...dangerColor);
      doc.setFont('helvetica', 'bold');
      doc.text('-' + new Intl.NumberFormat('vi-VN').format(payroll.total_deductions || 0) + ' d', 200, yPos, { align: 'right' });
      
      // Net Salary - Highlighted Box
      yPos += 12;
      doc.setFillColor(...successColor);
      doc.roundedRect(10, yPos, 190, 18, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('LUONG THUC LINH:', 15, yPos + 12);
      doc.setFontSize(16);
      doc.text(new Intl.NumberFormat('vi-VN').format(payroll.net_salary) + ' d', 195, yPos + 12, { align: 'right' });
      
      // Work Days Section
      yPos += 25;
      doc.setTextColor(...darkColor);
      doc.setFillColor(...lightGray);
      doc.rect(10, yPos, 190, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CHAM CONG', 15, yPos + 6);
      
      yPos += 15;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Ngay cong chuan:', 15, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(payroll.work_days + ' ngay', 70, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Ngay cong thuc te:', 110, yPos);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(payroll.actual_work_days + ' ngay', 170, yPos);
      
      // Status
      yPos += 10;
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'normal');
      doc.text('Trang thai:', 15, yPos);
      
      const statusBadge = getStatusBadge(payroll.status);
      let statusColor = darkColor;
      if (payroll.status === 'paid') statusColor = successColor;
      else if (payroll.status === 'approved') statusColor = primaryColor;
      else if (payroll.status === 'need_review') statusColor = dangerColor;
      
      doc.setTextColor(...statusColor);
      doc.setFont('helvetica', 'bold');
      doc.text(removeVietnameseAccents(statusBadge.text), 70, yPos);
      
      // Footer
      yPos = 270;
      doc.setDrawColor(...lightGray);
      doc.setLineWidth(0.5);
      doc.line(10, yPos, 200, yPos);
      
      yPos += 7;
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Phieu luong nay duoc tao tu dong boi he thong quan ly nhan su.', 105, yPos, { align: 'center' });
      doc.text(`Ngay tao: ${new Date().toLocaleDateString('vi-VN')}`, 105, yPos + 5, { align: 'center' });
      
      // Save PDF
      doc.save(`Phieu_luong_T${payroll.payroll_month}_${payroll.payroll_year}_${payroll.employee_code}.pdf`);
      toast.success('Đã tải phiếu lương PDF thành công!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Lỗi khi tạo file PDF');
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Bảng lương của tôi</h1>
        <p className="text-gray-600 mt-2">Xem lịch sử và chi tiết lương cá nhân</p>
      </div>

      {/* Year Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Chọn năm</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="input max-w-xs"
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-100 text-sm mb-2">Tổng bảng lương</div>
              <div className="text-3xl font-bold">{payrolls.length}</div>
            </div>
            <FaFileInvoice className="text-5xl text-blue-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-100 text-sm mb-2">Tổng thu nhập</div>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('vi-VN').format(stats.totalEarned)} đ
              </div>
            </div>
            <FaMoneyBillWave className="text-5xl text-green-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-purple-100 text-sm mb-2">Đã nhận</div>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('vi-VN').format(stats.totalPaid)} đ
              </div>
            </div>
            <FaChartLine className="text-5xl text-purple-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-orange-100 text-sm mb-2">Tăng ca</div>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('vi-VN').format(stats.totalOvertime)} đ
              </div>
            </div>
            <FaChartLine className="text-5xl text-orange-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Lịch sử lương năm {selectedYear}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kỳ lương</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lương cơ bản</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phụ cấp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tăng ca</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khấu trừ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lương thực nhận</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="spinner border-blue-600 border-t-transparent w-8 h-8"></div>
                      <span className="ml-3">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    Chưa có bảng lương nào cho năm {selectedYear}
                  </td>
                </tr>
              ) : (
                payrolls
                  .sort((a, b) => b.payroll_month - a.payroll_month)
                  .map((payroll) => (
                    <tr key={payroll.payroll_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Tháng {payroll.payroll_month}/{payroll.payroll_year}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Intl.NumberFormat('vi-VN').format(parseFloat(payroll.base_salary))} đ
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600">
                        <div className="text-sm font-medium">
                          +{new Intl.NumberFormat('vi-VN').format(parseFloat(payroll.total_allowances || 0))} đ
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-purple-600">
                        <div className="text-sm font-medium">
                          +{new Intl.NumberFormat('vi-VN').format(parseFloat(payroll.overtime_pay || 0))} đ
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-red-600">
                        <div className="text-sm font-medium">
                          -{new Intl.NumberFormat('vi-VN').format(parseFloat(payroll.total_deductions || 0))} đ
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-blue-600">
                          {new Intl.NumberFormat('vi-VN').format(parseFloat(payroll.net_salary))} đ
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(payroll.status).bg}`}>
                          {getStatusBadge(payroll.status).text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => fetchPayrollDetails(payroll.payroll_id)}
                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <FaEye className="text-lg" />
                          </button>
                          <button
                            onClick={() => downloadPayslip(payroll)}
                            className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg transition-colors"
                            title="Tải phiếu lương"
                          >
                            <FaDownload className="text-lg" />
                          </button>
                          {(payroll.status === 'pending' || payroll.status === 'revised') && (
                            <>
                              <button
                                onClick={() => handleApprove(payroll.payroll_id)}
                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs"
                              >
                                Chấp nhận
                              </button>
                              <button
                                onClick={() => handleReject(payroll.payroll_id)}
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-xs"
                              >
                                Yêu cầu xem lại
                              </button>
                            </>
                          )}
                          {payroll.status === 'need_review' && payroll.notes && (
                            <span className="text-xs text-red-600 italic">Đang chờ admin xem lại</span>
                          )}
                          {payroll.admin_notes && (
                            <span className="text-xs text-blue-600" title={payroll.admin_notes}>💬</span>
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

      {/* Detail Modal */}
      {showDetailModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Chi tiết lương - Tháng {selectedPayroll.payroll_month}/{selectedPayroll.payroll_year}
              </h2>
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Employee Info */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-700">Thông tin nhân viên</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Mã nhân viên</p>
                    <p className="font-semibold text-gray-800">{selectedPayroll.employee_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Họ tên</p>
                    <p className="font-semibold text-gray-800">{selectedPayroll.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phòng ban</p>
                    <p className="font-semibold text-gray-800">{selectedPayroll.department_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Chức vụ</p>
                    <p className="font-semibold text-gray-800">{selectedPayroll.position_name}</p>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-700">Chi tiết lương</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Lương cơ bản</span>
                    <span className="font-semibold text-gray-800">
                      {new Intl.NumberFormat('vi-VN').format(parseFloat(selectedPayroll.base_salary))} đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded">
                    <span className="text-green-700">Phụ cấp</span>
                    <span className="font-semibold text-green-700">
                      +{new Intl.NumberFormat('vi-VN').format(parseFloat(selectedPayroll.total_allowances || 0))} đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-purple-50 px-3 rounded">
                    <span className="text-purple-700">Lương tăng ca</span>
                    <span className="font-semibold text-purple-700">
                      +{new Intl.NumberFormat('vi-VN').format(parseFloat(selectedPayroll.overtime_pay || 0))} đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded font-semibold border-t-2 border-blue-200">
                    <span className="text-blue-700">Tổng lương</span>
                    <span className="text-blue-700 text-lg">
                      {new Intl.NumberFormat('vi-VN').format(parseFloat(selectedPayroll.gross_salary || 0))} đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Allowances Detail */}
              {selectedPayroll.allowances && Array.isArray(selectedPayroll.allowances) && selectedPayroll.allowances.length > 0 && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-3 text-gray-700">Chi tiết phụ cấp</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedPayroll.allowances.map((allowance, index) => (
                      <div key={index} className="flex justify-between text-sm mb-2 last:mb-0">
                        <span className="text-gray-700">{allowance.allowance_name}</span>
                        <span className="text-green-600 font-medium">
                          +{new Intl.NumberFormat('vi-VN').format(parseFloat(allowance.amount))} đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deductions */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-700">Các khoản khấu trừ</h3>
                {selectedPayroll.deductions && Array.isArray(selectedPayroll.deductions) && selectedPayroll.deductions.length > 0 ? (
                  <div className="bg-red-50 rounded-lg p-4">
                    {selectedPayroll.deductions.map((deduction, index) => (
                      <div key={index} className="mb-3 last:mb-0">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 font-medium">{deduction.deduction_type}</span>
                          <span className="text-red-600 font-medium">
                            -{new Intl.NumberFormat('vi-VN').format(parseFloat(deduction.amount))} đ
                          </span>
                        </div>
                        {deduction.description && (
                          <p className="text-xs text-gray-500 mt-1">{deduction.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-between bg-red-50 rounded-lg p-4">
                    <span className="text-gray-700">Tổng khấu trừ</span>
                    <span className="text-red-600 font-semibold">
                      -{new Intl.NumberFormat('vi-VN').format(parseFloat(selectedPayroll.total_deductions || 0))} đ
                    </span>
                  </div>
                )}
              </div>

              {/* Work Days */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-700">Chấm công</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Ngày công chuẩn</p>
                    <p className="text-2xl font-bold text-gray-800">{selectedPayroll.work_days} <span className="text-sm font-normal">ngày</span></p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Ngày công thực tế</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedPayroll.actual_work_days} <span className="text-sm font-normal">ngày</span></p>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 shadow-lg">
                <div className="flex justify-between items-center text-white">
                  <div>
                    <p className="text-green-100 text-sm mb-1">LƯƠNG THỰC LĨNH</p>
                    <p className="text-4xl font-bold">
                      {new Intl.NumberFormat('vi-VN').format(parseFloat(selectedPayroll.net_salary))} đ
                    </p>
                  </div>
                  <FaMoneyBillWave className="text-6xl text-green-200 opacity-50" />
                </div>
              </div>

              {selectedPayroll.notes && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded p-4">
                  <p className="text-sm font-semibold text-yellow-800 mb-1">Ghi chú của bạn</p>
                  <p className="text-gray-700">{selectedPayroll.notes}</p>
                </div>
              )}

              {selectedPayroll.admin_notes && (
                <div className="bg-blue-50 border-l-4 border-blue-400 rounded p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-1">Ghi chú từ Admin</p>
                  <p className="text-gray-700">{selectedPayroll.admin_notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => downloadPayslip(selectedPayroll)}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center"
              >
                <FaDownload className="mr-2" />
                Tải phiếu lương
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Yêu cầu xem lại bảng lương</h2>
              <button onClick={() => {
                setShowRejectModal(false);
                setRejectNotes('');
                setRejectingPayrollId(null);
              }} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Vui lòng cho biết lý do yêu cầu xem lại: *
              </label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="5"
                placeholder="Ví dụ: Tôi thấy số ngày công không đúng, tháng này tôi làm thêm 2 ngày Chủ nhật nhưng chưa được tính..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Ghi chú này sẽ được gửi đến admin để kiểm tra lại bảng lương của bạn.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={submitReject}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium"
              >
                Gửi yêu cầu
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectNotes('');
                  setRejectingPayrollId(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 font-medium"
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

export default MyPayroll;
