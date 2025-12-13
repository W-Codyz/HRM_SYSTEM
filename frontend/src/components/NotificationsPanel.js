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
    const iconClass = "text-2xl";
    switch (type) {
      case 'success':
        return <FaCheckCircle className={`${iconClass} text-green-500`} />;
      case 'warning':
        return <FaExclamationTriangle className={`${iconClass} text-yellow-500`} />;
      case 'error':
        return <FaTimesCircle className={`${iconClass} text-red-500`} />;
      case 'info':
      default:
        return <FaInfoCircle className={`${iconClass} text-blue-500`} />;
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaBell className="text-xl" />
              <h2 className="text-xl font-bold">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors duration-200"
              title="Close"
            >
              <FaTimes className="text-lg" />
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-sm bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1.5 rounded-lg transition-all duration-200"
            >
              <FaCheckDouble />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <FaBell className="text-6xl mb-4 opacity-50" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`p-4 hover:bg-white cursor-pointer transition-all duration-200 border-l-4 ${
                    !notification.is_read 
                      ? 'bg-blue-50 border-blue-500 hover:shadow-md' 
                      : 'bg-white border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-semibold text-sm ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 mt-1 animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {!notification.is_read && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            New
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
