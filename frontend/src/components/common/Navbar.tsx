import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Power, Settings, ArrowLeft, Bell, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/');
      const notifs = res.data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
    } catch {
      // Ignore if offline/mock
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return 'Student';
      case 'HOSTEL_STAFF':
        return 'Hostel Staff';
      case 'HOSTEL_WARDEN':
        return 'Hostel Warden';
      case 'FACULTY_ADVISOR':
        return 'Faculty Advisor';
      case 'ADMIN':
        return 'Admin';
      default:
        return 'Portal';
    }
  };

  return (
    <header className="w-full flex h-14 sticky top-0 z-50 select-none shadow-md">
      {/* Left Block matching Sidebar width */}
      <div className="w-64 bg-[#007399] flex items-center justify-center px-4 shrink-0 border-r border-[#006080]">
        <h1 className="text-white font-bold text-base tracking-wide">
          {getRoleTitle(user?.role || 'STUDENT')}
        </h1>
      </div>

      {/* Main Top Header Bar with Cyan Teal Theme */}
      <div className="flex-1 bg-[#008ab3] flex items-center justify-between px-4 sm:px-6">
        {/* Left Back Arrow Button */}
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition border border-white/30"
          title="Go Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Right User Actions */}
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider hidden sm:inline-block">
              {user.full_name?.toUpperCase()}
            </span>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative p-1.5 rounded-full text-white hover:bg-white/20 transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#008ab3] animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden animate-in fade-in duration-150">
                  <div className="p-3 bg-[#007399] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      <span className="font-bold text-xs uppercase tracking-wide">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-sky-100 hover:text-white underline font-semibold transition"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isDiscrepancy = n.title?.toLowerCase().includes('discrepancy') || n.title?.toLowerCase().includes('reject');
                        return (
                          <div
                            key={n.id}
                            onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                            className={`p-3 text-xs transition cursor-pointer ${
                              !n.is_read ? 'bg-sky-50/70 hover:bg-sky-50' : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {isDiscrepancy ? (
                                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <h4 className={`font-bold ${isDiscrepancy ? 'text-red-700' : 'text-slate-900'}`}>
                                    {n.title}
                                  </h4>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-slate-600 leading-relaxed text-[11px]">
                                  {n.message}
                                </p>

                                {isDiscrepancy && user.role === 'STUDENT' && (
                                  <div className="pt-1.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(n.id);
                                        setDropdownOpen(false);
                                        navigate('/registration/form');
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs transition"
                                    >
                                      <span>Clear Discrepancy & Edit Form</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar with Red Ring border */}
            <div className="relative">
              <div className="w-9 h-9 rounded-full border-2 border-red-500 overflow-hidden bg-slate-200 flex items-center justify-center text-slate-800 font-bold text-xs shadow-sm">
                {user.full_name ? (
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.full_name)}`}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  'U'
                )}
              </div>
            </div>

            {/* Power / Logout Button */}
            <button
              onClick={handleLogout}
              className="text-white hover:text-red-200 transition p-1"
              title="Logout Session"
            >
              <Power className="w-5 h-5" />
            </button>

            {/* Settings Gear Icon */}
            <button
              className="text-white hover:text-slate-200 transition p-1"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
