import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaInfoCircle, FaTimes, FaCheckDouble } from 'react-icons/fa';

const NotificationsPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.data || []);
      const unread = (response.data.data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type) => {
    const iconClass = "text-xl";
    switch (type) {
      case 'success':
        return <FaCheckCircle className={`${iconClass} text-green-600`} />;
      case 'warning':
        return <FaExclamationTriangle className={`${iconClass} text-amber-600`} />;
      case 'error':
        return <FaTimesCircle className={`${iconClass} text-red-600`} />;
      case 'info':
      default:
        return <FaInfoCircle className={`${iconClass} text-blue-600`} />;
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead(notification.notification_id);
    }

    // Navigate based on notification type or link
    if (notification.link) {
      navigate(notification.link);
      onClose();
    } else {
      // Default navigation based on message content
      const message = notification.message.toLowerCase();
      const title = notification.title.toLowerCase();
      
      if (message.includes('leave') || title.includes('leave')) {
        navigate('/admin/leave-requests');
      } else if (message.includes('user') || title.includes('user') || message.includes('registration')) {
        navigate('/admin/users');
      } else if (message.includes('employee')) {
        navigate('/admin/employees');
      } else if (message.includes('attendance')) {
        navigate('/admin/attendance');
      } else if (message.includes('payroll') || message.includes('salary')) {
        navigate('/admin/payroll');
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-16 w-full sm:w-96 h-[calc(100vh-4rem)] bg-white shadow-2xl z-50 overflow-hidden flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <FaBell className="text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  Thông báo
                </h2>
                {unreadCount > 0 && (
                  <p className="text-xs text-blue-100">{unreadCount} chưa đọc</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200 hover:rotate-90"
              title="Đóng"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg transition-all duration-200 font-medium w-full justify-center mt-2 hover:shadow-md"
            >
              <FaCheckDouble />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-4">
              <div className="bg-gray-100 p-6 rounded-full mb-4">
                <FaBell className="text-5xl opacity-40" />
              </div>
              <p className="text-lg font-semibold text-gray-600">Không có thông báo</p>
              <p className="text-sm text-gray-400 mt-1">Bạn đã xem tất cả!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`p-4 cursor-pointer transition-all duration-200 border-l-4 relative ${
                    !notification.is_read 
                      ? 'bg-gradient-to-r from-blue-50 to-white border-blue-500 hover:shadow-lg hover:from-blue-100' 
                      : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`p-2 rounded-lg ${
                        !notification.is_read ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`font-semibold text-sm leading-tight ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5 animate-pulse shadow-lg"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400 font-medium">
                          {new Date(notification.created_at).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {!notification.is_read && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-semibold shadow-sm">
                            Mới
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPanel;
