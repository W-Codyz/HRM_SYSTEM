import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFileExport } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const TeamManagement = () => {
  const { user } = useAuth();
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [managedDepartment, setManagedDepartment] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0
  });
  const [formData, setFormData] = useState({
    employee_code: '',
    full_name: '',
    username: '',
    gender: 'male',
    date_of_birth: '',
    phone: '',
    email: '',
    address: '',
    department_id: '',
    position_id: '',
    salary: '',
    hire_date: '',
    status: 'active'
  });

  useEffect(() => {
    if (user && user.employee_id) {
      fetchTeamData();
    }
  }, [user]);

  const fetchTeamData = async () => {
    if (!user || !user.employee_id) {
      console.log('User not ready yet');
      return;
    }
    
    try {
      setLoading(true);
      
      // Lấy thông tin phòng ban mà user đang quản lý
      const [deptRes, positionsRes] = await Promise.all([
        api.get('/departments'),
        api.get('/positions')
      ]);
      
      const departments = deptRes.data.data || [];
      const myDept = departments.find(d => d.manager_id === user.employee_id);
      
      if (!myDept) {
        console.log('No department found for employee_id:', user.employee_id);
        setManagedDepartment(null);
        setLoading(false);
        return;
      }
      
      setManagedDepartment(myDept);
      setPositions(positionsRes.data.data || []);
      
      // Lấy danh sách nhân viên trong phòng ban
      const empRes = await api.get('/employees', { 
        params: { department_id: myDept.department_id } 
      });
      const employees = empRes.data.data || [];
      setDepartmentEmployees(employees);
      
      // Tính toán stats
      const active = employees.filter(e => e.status === 'active').length;
      
      setStats({
        totalEmployees: employees.length,
        activeEmployees: active,
        onLeave: employees.length - active
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast.error('Không thể tải dữ liệu team');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        department_id: managedDepartment.department_id // Always use manager's department
      };
      
      if (selectedEmployee) {
        await api.put(`/employees/${selectedEmployee.employee_id}`, submitData);
        toast.success('Cập nhật nhân viên thành công!');
      } else {
        await api.post('/employees', submitData);
        toast.success('Thêm nhân viên thành công!');
      }
      setShowModal(false);
      resetForm();
      fetchTeamData();
    } catch (error) {
      console.error('Submit error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      employee_code: employee.employee_code,
      full_name: employee.full_name,
      username: '',
      gender: employee.gender || 'male',
      date_of_birth: employee.date_of_birth || '',
      phone: employee.phone || '',
      email: employee.email || '',
      address: employee.address || '',
      department_id: employee.department_id || '',
      position_id: employee.position_id || '',
      salary: employee.salary || '',
      hire_date: employee.hire_date || '',
      status: employee.status || 'active'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này không?')) {
      try {
        await api.delete(`/employees/${id}`);
        toast.success('Xóa nhân viên thành công');
        fetchTeamData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Xóa nhân viên thất bại');
      }
    }
  };

  const resetForm = () => {
    setSelectedEmployee(null);
    setFormData({
      employee_code: '',
      full_name: '',
      username: '',
      gender: 'male',
      date_of_birth: '',
      phone: '',
      email: '',
      address: '',
      department_id: managedDepartment?.department_id || '',
      position_id: '',
      salary: '',
      hire_date: '',
      status: 'active'
    });
  };

  const handleAddNew = () => {
    resetForm();
    setShowModal(true);
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredEmployees.map((emp, index) => ({
        'STT': index + 1,
        'Mã NV': emp.employee_code,
        'Họ và tên': emp.full_name,
        'Giới tính': emp.gender === 'male' ? 'Nam' : emp.gender === 'female' ? 'Nữ' : 'Khác',
        'Ngày sinh': emp.date_of_birth,
        'Số điện thoại': emp.phone,
        'Email': emp.email,
        'Địa chỉ': emp.address,
        'Phòng ban': emp.department_name,
        'Chức vụ': emp.position_name,
        'Lương cơ bản': emp.salary,
        'Ngày vào làm': emp.hire_date,
        'Trạng thái': emp.status === 'active' ? 'Đang làm việc' : emp.status === 'inactive' ? 'Tạm nghỉ' : 'Đã nghỉ việc'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const colWidths = [
        { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 12 },
        { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 20 },
        { wch: 15 }, { wch: 12 }, { wch: 15 }
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách nhân viên');

      const fileName = `Nhan_vien_${managedDepartment.department_name}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Xuất file Excel thành công!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Lỗi khi xuất file Excel');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-fill salary when position is selected
    if (name === 'position_id' && value) {
      const selectedPosition = positions.find(p => p.position_id === Number.parseInt(value));
      if (selectedPosition?.base_salary) {
        setFormData(prev => ({
          ...prev,
          salary: selectedPosition.base_salary
        }));
        toast.info(`Lương cơ bản đề xuất: ${new Intl.NumberFormat('vi-VN').format(selectedPosition.base_salary)} VND`);
      }
    }
  };

  const getAvailablePositions = () => {
    if (!managedDepartment) return [];
    return positions.filter(pos => 
      !pos.department_id || pos.department_id === managedDepartment.department_id
    );
  };

  const filteredEmployees = departmentEmployees.filter((emp) => {
    const matchSearch = searchTerm === '' ||
                       emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === '' || emp.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner border-purple-600 border-t-transparent w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.employee_id) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đang tải thông tin người dùng</h2>
          <p className="text-gray-600">Vui lòng đợi...</p>
        </div>
      </div>
    );
  }

  if (!managedDepartment) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn không quản lý phòng ban nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">Quản lý Nhân viên - {managedDepartment.department_name}</h2>
            <p className="text-secondary-600 mt-1">
              Tổng cộng {filteredEmployees.length} nhân viên
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button 
              onClick={handleExportExcel}
              className="btn btn-secondary flex items-center"
            >
              <FaFileExport className="mr-2" />
              Xuất Excel
            </button>
            <button
              onClick={handleAddNew}
              className="btn btn-primary flex items-center"
            >
              <FaPlus className="mr-2" />
              Thêm nhân viên
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Tổng nhân viên</p>
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
                <p className="text-gray-500 text-xs font-medium uppercase">Đang làm việc</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeEmployees}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <span className="text-3xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Nghỉ phép/Nghỉ việc</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.onLeave}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <span className="text-3xl">📋</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, mã nhân viên, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang làm việc</option>
                <option value="inactive">Tạm nghỉ</option>
                <option value="resigned">Đã nghỉ việc</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="spinner border-purple-600 border-t-transparent w-12 h-12"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Giới tính</th>
                    <th>Chức vụ</th>
                    <th>Email</th>
                    <th>Số điện thoại</th>
                    <th>Lương</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.employee_id}>
                      <td className="font-semibold text-primary-600">
                        {employee.employee_code}
                      </td>
                      <td>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                            <span className="font-semibold text-primary-600">
                              {employee.full_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-secondary-900">
                              {employee.full_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {employee.gender === 'male' ? 'Nam' : employee.gender === 'female' ? 'Nữ' : 'Khác'}
                      </td>
                      <td>{employee.position_name || 'N/A'}</td>
                      <td>{employee.email || 'N/A'}</td>
                      <td>{employee.phone || 'N/A'}</td>
                      <td className="font-semibold">
                        {employee.salary ? new Intl.NumberFormat('vi-VN').format(employee.salary) + ' đ' : 'N/A'}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            employee.status === 'active'
                              ? 'badge-success'
                              : employee.status === 'inactive'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {employee.status === 'active'
                            ? 'Đang làm'
                            : employee.status === 'inactive'
                            ? 'Tạm nghỉ'
                            : 'Đã nghỉ'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleEdit(employee)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(employee.employee_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          resetForm();
        }}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-secondary-200">
              <h3 className="text-xl font-bold text-secondary-900">
                {selectedEmployee ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Mã nhân viên *
                    </label>
                    <input
                      type="text"
                      name="employee_code"
                      className="input"
                      placeholder="VD: NV001"
                      value={formData.employee_code}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      className="input"
                      placeholder="Nhập họ và tên"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {!selectedEmployee && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3">Thông tin tài khoản đăng nhập</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Tên đăng nhập
                        </label>
                        <input
                          type="text"
                          name="username"
                          className="input"
                          placeholder="VD: teonguyen"
                          value={formData.username}
                          onChange={handleInputChange}
                        />
                        <p className="text-xs text-secondary-500 mt-1">Để trống nếu không tạo tài khoản</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Mật khẩu tự động
                        </label>
                        <input
                          type="text"
                          className="input bg-gray-50"
                          value={formData.username && formData.date_of_birth ? 
                            formData.username + formData.date_of_birth.split('-').reverse().join('') : 
                            'username + ngàythángnăm'}
                          disabled
                        />
                        <p className="text-xs text-secondary-500 mt-1">VD: teo16092005 (teo + 16/09/2005)</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Giới tính
                    </label>
                    <select
                      name="gender"
                      className="input"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      className="input"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      className="input"
                      placeholder="0123456789"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="input"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      name="address"
                      className="input"
                      placeholder="Nhập địa chỉ"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Phòng ban
                    </label>
                    <input 
                      type="text"
                      className="input bg-gray-100"
                      value={managedDepartment?.department_name || ''}
                      disabled
                    />
                    <p className="text-xs text-secondary-500 mt-1">Nhân viên được thêm vào phòng ban của bạn</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Chức vụ *
                    </label>
                    <select 
                      name="position_id"
                      className="input"
                      value={formData.position_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Chọn chức vụ</option>
                      {getAvailablePositions().map((pos) => (
                        <option key={pos.position_id} value={pos.position_id}>
                          {pos.position_name}
                          {pos.department_name && ` (${pos.department_name})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Lương cơ bản *
                    </label>
                    <input
                      type="number"
                      name="salary"
                      className="input"
                      placeholder="Chọn chức vụ để gợi ý lương"
                      value={formData.salary}
                      onChange={handleInputChange}
                      required
                    />
                    {!selectedEmployee && formData.position_id && (
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Lương được tự động điền theo chức vụ, bạn có thể điều chỉnh
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Ngày vào làm *
                    </label>
                    <input
                      type="date"
                      name="hire_date"
                      className="input"
                      value={formData.hire_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Trạng thái
                    </label>
                    <select 
                      name="status"
                      className="input"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Đang làm việc</option>
                      <option value="inactive">Tạm nghỉ</option>
                      <option value="resigned">Đã nghỉ việc</option>
                    </select>
                  </div>
                </div>
                <div className="p-6 border-t border-secondary-200 flex justify-end space-x-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }} 
                    className="btn btn-secondary"
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {selectedEmployee ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-secondary-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-secondary-900">
                  Chi tiết nhân viên
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Avatar and basic info */}
                <div className="col-span-2 flex items-center space-x-4 pb-4 border-b">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-semibold text-primary-600">
                      {selectedEmployee.full_name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-secondary-900">
                      {selectedEmployee.full_name}
                    </h4>
                    <p className="text-secondary-600">{selectedEmployee.position_name}</p>
                    <span className={`badge mt-2 ${
                      selectedEmployee.status === 'active'
                        ? 'badge-success'
                        : selectedEmployee.status === 'inactive'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}>
                      {selectedEmployee.status === 'active'
                        ? 'Đang làm việc'
                        : selectedEmployee.status === 'inactive'
                        ? 'Tạm nghỉ'
                        : 'Đã nghỉ việc'}
                    </span>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="col-span-2">
                  <h5 className="font-semibold text-lg text-secondary-900 mb-3">Thông tin cá nhân</h5>
                </div>
                
                <div>
                  <p className="text-sm text-secondary-500">Mã nhân viên</p>
                  <p className="font-semibold text-secondary-900">{selectedEmployee.employee_code}</p>
                </div>
                
                <div>
                  <p className="text-sm text-secondary-500">Giới tính</p>
                  <p className="font-semibold text-secondary-900">
                    {selectedEmployee.gender === 'male' ? 'Nam' : selectedEmployee.gender === 'female' ? 'Nữ' : 'Khác'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-secondary-500">Ngày sinh</p>
                  <p className="font-semibold text-secondary-900">
                    {selectedEmployee.date_of_birth ? new Date(selectedEmployee.date_of_birth).toLocaleDateString('vi-VN') : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-secondary-500">Số điện thoại</p>
                  <p className="font-semibold text-secondary-900">{selectedEmployee.phone || 'N/A'}</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm text-secondary-500">Email</p>
                  <p className="font-semibold text-secondary-900">{selectedEmployee.email || 'N/A'}</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm text-secondary-500">Địa chỉ</p>
                  <p className="font-semibold text-secondary-900">{selectedEmployee.address || 'N/A'}</p>
                </div>

                {/* Work Information */}
                <div className="col-span-2 pt-4 border-t">
                  <h5 className="font-semibold text-lg text-secondary-900 mb-3">Thông tin công việc</h5>
                </div>
                
                <div>
                  <p className="text-sm text-secondary-500">Phòng ban</p>
                  <p className="font-semibold text-secondary-900">{selectedEmployee.department_name || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-secondary-500">Chức vụ</p>
                  <p className="font-semibold text-secondary-900">{selectedEmployee.position_name || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-secondary-500">Lương cơ bản</p>
                  <p className="font-semibold text-secondary-900">
                    {selectedEmployee.salary ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedEmployee.salary) : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-secondary-500">Ngày vào làm</p>
                  <p className="font-semibold text-secondary-900">
                    {selectedEmployee.hire_date ? new Date(selectedEmployee.hire_date).toLocaleDateString('vi-VN') : 'N/A'}
                  </p>
                </div>

                {/* Account Information */}
                {selectedEmployee.username && (
                  <>
                    <div className="col-span-2 pt-4 border-t">
                      <h5 className="font-semibold text-lg text-secondary-900 mb-3">Thông tin tài khoản</h5>
                    </div>
                    
                    <div>
                      <p className="text-sm text-secondary-500">Tên đăng nhập</p>
                      <p className="font-semibold text-secondary-900">{selectedEmployee.username}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-secondary-500">Vai trò</p>
                      <p className="font-semibold text-secondary-900">
                        {selectedEmployee.role === 'admin' ? 'Quản trị viên' : 
                         selectedEmployee.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-secondary-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn btn-secondary"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(selectedEmployee);
                }}
                className="btn btn-primary"
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
