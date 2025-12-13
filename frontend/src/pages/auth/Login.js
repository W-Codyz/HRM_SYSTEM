import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Form submitted:', { isLogin, username: formData.username });
    
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      if (isLogin) {
        const user = await login({
          username: formData.username,
          password: formData.password,
        });
        
        toast.success('Đăng nhập thành công!');
        
        // Redirect based on role
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          // Employee và Manager đều vào employee portal
          navigate('/employee/dashboard');
        }
      } else {
        // Register
        try {
          await api.post('/auth/register', {
            username: formData.username,
            email: formData.email,
            password: formData.password,
          });
        toast.success('Đăng ký thành công! Vui lòng đợi quản trị viên phê duyệt.');
          setFormData({ username: '', email: '', password: '' });
          setIsLogin(true); // Switch to login tab
        } catch (registerError) {
          throw registerError;
        }
      }
    } catch (error) {
      console.error('Login/Register error:', error.response?.data);
      let message = 'Đã có lỗi xảy ra';
      
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        message = Object.values(error.response.data.errors).join(', ');
      } else if (error.message) {
        message = error.message;
      }
      
      setError(message); // Set error to display in form
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-full p-4 shadow-lg mb-4">
            <span className="text-6xl">👥</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Hệ Thống HRM
          </h2>
          <p className="text-blue-100">
            Hệ Thống Quản Lý Nhân Sự
          </p>
        </div>

        {/* Login/Register Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex mb-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2 text-center font-semibold transition-all ${
                isLogin
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 border-b-2 border-transparent hover:text-blue-600'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2 text-center font-semibold transition-all ${
                !isLogin
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 border-b-2 border-transparent hover:text-blue-600'
              }`}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                <span className="text-xl mr-3">⚠️</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">👤</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-10 py-2"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>
            </div>

            {/* Email (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">📧</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-10 py-2"
                    placeholder="Nhập địa chỉ email"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔒</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-10 py-2"
                  placeholder="Nhập mật khẩu"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                />
              </div>
            </div>

            {/* Remember & Forgot */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">Ghi nhớ đăng nhập</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner border-white border-t-transparent w-5 h-5 mr-2"></div>
                  Đang xử lý...
                </div>
              ) : (
                isLogin ? 'Đăng nhập' : 'Đăng ký'
              )}
            </button>
          </form>

          {/* Info */}
          {!isLogin && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Sau khi đăng ký, tài khoản của bạn cần được quản trị viên phê duyệt trước khi có thể đăng nhập.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-blue-100">
          &copy; 2025 Hệ Thống HRM. Nhóm 9 - Quản Lý Nhân Sự
        </p>
      </div>
    </div>
  );
};

export default Login;
