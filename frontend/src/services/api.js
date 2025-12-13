import axios from 'axios';

const API_URL = 'http://localhost/Nhom9/backend/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if not already on login page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth.php/login', credentials),
  register: (userData) => api.post('/auth.php/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Users APIs
export const usersAPI = {
  getAll: () => api.get('/users.php'),
  getPending: () => api.get('/users.php/pending'),
  approve: (userId, action) => api.put(`/users.php/${userId}/approve`, { action }),
  updateRole: (userId, role) => api.put(`/users.php/${userId}/role`, { role }),
  delete: (userId) => api.delete(`/users.php/${userId}`),
};

// Employees APIs
export const employeesAPI = {
  getAll: (params) => api.get('/employees.php', { params }),
  getById: (id) => api.get(`/employees.php/${id}`),
  create: (data) => api.post('/employees.php', data),
  update: (id, data) => api.put(`/employees.php/${id}`, data),
  delete: (id) => api.delete(`/employees.php/${id}`),
};

// Departments APIs
export const departmentsAPI = {
  getAll: () => api.get('/departments.php'),
  getById: (id) => api.get(`/departments.php/${id}`),
  create: (data) => api.post('/departments.php', data),
  update: (id, data) => api.put(`/departments.php/${id}`, data),
  delete: (id) => api.delete(`/departments.php/${id}`),
};

// Positions APIs
export const positionsAPI = {
  getAll: () => api.get('/positions.php'),
  getById: (id) => api.get(`/positions.php/${id}`),
  create: (data) => api.post('/positions.php', data),
  update: (id, data) => api.put(`/positions.php/${id}`, data),
  delete: (id) => api.delete(`/positions.php/${id}`),
};

// Attendance APIs
export const attendanceAPI = {
  getAll: (params) => api.get('/attendance.php', { params }),
  getById: (id) => api.get(`/attendance.php/${id}`),
  checkIn: (data) => api.post('/attendance.php/checkin', data),
  checkOut: (data) => api.post('/attendance.php/checkout', data),
  create: (data) => api.post('/attendance.php', data),
  update: (id, data) => api.put(`/attendance.php/${id}`, data),
  delete: (id) => api.delete(`/attendance.php/${id}`),
};

// Leave Requests APIs
export const leaveRequestsAPI = {
  getAll: (params) => api.get('/leave_requests.php', { params }),
  getById: (id) => api.get(`/leave_requests.php/${id}`),
  create: (data) => api.post('/leave_requests.php', data),
  approve: (id, data) => api.put(`/leave_requests.php/${id}/approve`, data),
  reject: (id, data) => api.put(`/leave_requests.php/${id}/reject`, data),
  cancel: (id) => api.put(`/leave_requests.php/${id}/cancel`),
};

// Payroll APIs
export const payrollAPI = {
  getAll: (params) => api.get('/payroll.php', { params }),
  getById: (id) => api.get(`/payroll.php/${id}`),
  calculate: (data) => api.post('/payroll.php/calculate', data),
  approve: (id) => api.put(`/payroll.php/${id}/approve`),
  pay: (id) => api.put(`/payroll.php/${id}/pay`),
};

// Allowances APIs
export const allowancesAPI = {
  getAll: () => api.get('/allowances.php'),
  getById: (id) => api.get(`/allowances.php/${id}`),
  create: (data) => api.post('/allowances.php', data),
  update: (id, data) => api.put(`/allowances.php/${id}`, data),
  delete: (id) => api.delete(`/allowances.php/${id}`),
};

// Deductions APIs
export const deductionsAPI = {
  getAll: () => api.get('/deductions.php'),
  getById: (id) => api.get(`/deductions.php/${id}`),
  create: (data) => api.post('/deductions.php', data),
  update: (id, data) => api.put(`/deductions.php/${id}`, data),
  delete: (id) => api.delete(`/deductions.php/${id}`),
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard.php/stats'),
  getCharts: () => api.get('/dashboard.php/charts'),
};

export default api;
