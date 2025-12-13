import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import EmployeeLayout from './components/EmployeeLayout';

// Auth Pages
import Login from './pages/auth/Login';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import Users from './pages/admin/Users';
import AdminAttendance from './pages/admin/Attendance';
import AdminLeaveRequests from './pages/admin/LeaveRequests';
import AdminPayroll from './pages/admin/Payroll';
import Departments from './pages/admin/Departments';
import Positions from './pages/admin/Positions';
import Allowances from './pages/admin/Allowances';
import Deductions from './pages/admin/Deductions';
import Profile from './pages/admin/Profile';
import Settings from './pages/admin/Settings';

// Employee Pages
import EmployeeDashboard from './pages/employee/Dashboard';
import MyAttendance from './pages/employee/MyAttendance';
import MyLeaveRequests from './pages/employee/MyLeaveRequests';
import MyPayroll from './pages/employee/MyPayroll';
import EmployeeProfile from './pages/employee/Profile';
import TeamManagement from './pages/employee/TeamManagement';
import TeamAttendance from './pages/employee/TeamAttendance';
import LeaveApprovals from './pages/employee/LeaveApprovals';
import FaceAttendance from './pages/employee/FaceAttendance';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (user) {
    // Redirect based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // Both manager and employee go to employee portal
    return <Navigate to="/employee/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="users" element={<Users />} />
              <Route path="departments" element={<Departments />} />
              <Route path="positions" element={<Positions />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="leave-requests" element={<AdminLeaveRequests />} />
              <Route path="payroll" element={<AdminPayroll />} />
              <Route path="allowances" element={<Allowances />} />
              <Route path="deductions" element={<Deductions />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Manager Routes - Removed, managers now use employee portal */}

            {/* Employee Routes (also used by managers) */}
            <Route path="/employee" element={<EmployeeLayout />}>
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="attendance" element={<MyAttendance />} />
              <Route path="face-attendance" element={<FaceAttendance />} />
              <Route path="leave-requests" element={<MyLeaveRequests />} />
              <Route path="payroll" element={<MyPayroll />} />
              <Route path="profile" element={<EmployeeProfile />} />
              {/* Manager-only routes */}
              <Route path="team-management" element={<TeamManagement />} />
              <Route path="team-attendance" element={<TeamAttendance />} />
              <Route path="leave-approvals" element={<LeaveApprovals />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-secondary-50">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
                    <p className="text-xl text-secondary-600 mb-8">
                      Trang không tồn tại
                    </p>
                    <a href="/login" className="btn btn-primary">
                      Về trang chủ
                    </a>
                  </div>
                </div>
              }
            />

            {/* Unauthorized */}
            <Route
              path="unauthorized"
              element={
                <div className="min-h-screen flex items-center justify-center bg-red-50">
                  <div className="text-center">
                    <h1 className="text-5xl font-bold text-red-600 mb-4">403</h1>
                    <p className="text-xl text-red-500 mb-8">
                      Bạn không có quyền truy cập trang này
                    </p>
                    <a href="/login" className="btn btn-primary">
                      Về trang chủ
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
