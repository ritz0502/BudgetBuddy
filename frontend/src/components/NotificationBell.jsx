// frontend/src/components/NotificationBell.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef(null);
  const intervalRef = useRef(null);

  const getAuthHeader = () => ({ Authorization: `Bearer ${user?.token}` });

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await axios.get('/api/notifications', {
        headers: getAuthHeader(),
        withCredentials: true,
      });
      setNotifications(data);
    } catch (err) {
      // Silently fail — don't disrupt the UI for notification fetch errors
      console.error('fetchNotifications error:', err);
    }
  }, [user]);

  // Fetch on mount and every 60 seconds
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 60000);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkOne = async (notification) => {
    if (notification.read) return;
    try {
      await axios.patch(
        `/api/notifications/${notification._id}/read`,
        {},
        { headers: getAuthHeader(), withCredentials: true }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('markOne error:', err);
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await axios.patch(
        '/api/notifications/read-all',
        {},
        { headers: getAuthHeader(), withCredentials: true }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('markAll error:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotifIcon = (type) => {
    if (type === 'budget_exceeded') return '🔴';
    if (type === 'budget_warning') return '🟡';
    return '🔔';
  };

  return (
    <div className="notif-bell-wrapper" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        className="notif-bell-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="notif-dropdown" role="dialog" aria-label="Notifications panel">
          {/* Dropdown Header */}
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="notif-mark-all-btn"
                onClick={handleMarkAll}
                disabled={markingAll}
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                {markingAll ? 'Marking…' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* List */}
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span style={{ fontSize: '1.5rem' }}>🔔</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`notif-item${notif.read ? '' : ' notif-item--unread'}`}
                  onClick={() => handleMarkOne(notif)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleMarkOne(notif)}
                >
                  <div className="notif-item-icon">{getNotifIcon(notif.type)}</div>
                  <div className="notif-item-body">
                    <p className="notif-item-msg">{notif.message}</p>
                    <span className="notif-item-time">{timeAgo(notif.createdAt)}</span>
                  </div>
                  {!notif.read && <div className="notif-unread-dot" aria-label="Unread" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
