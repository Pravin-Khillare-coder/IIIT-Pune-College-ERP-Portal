import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  FileText,
  LayoutDashboard,
  CheckSquare,
  Building2,
  Users,
  Info
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const roleNavItems = () => {
    switch (user.role) {
      case 'STUDENT':
        return [
          { to: '/dashboard/student', label: 'Student Profile', icon: User },
          { to: '/registration/form', label: 'Sem Registration', icon: FileText },
          { to: '/new-admission-info', label: 'Admission Guidelines', icon: Info },
        ];
      case 'HOSTEL_STAFF':
        return [
          { to: '/dashboard/staff', label: 'Hostel Clearances', icon: CheckSquare },
          { to: '/new-admission-info', label: 'Admission Guidelines', icon: Info },
        ];
      case 'HOSTEL_WARDEN':
        return [
          { to: '/dashboard/warden', label: 'Warden Approvals', icon: Building2 },
          { to: '/new-admission-info', label: 'Admission Guidelines', icon: Info },
        ];
      case 'FACULTY_ADVISOR':
        return [
          { to: '/dashboard/advisor', label: 'Advisor Approvals', icon: Users },
          { to: '/new-admission-info', label: 'Admission Guidelines', icon: Info },
        ];
      case 'ADMIN':
        return [
          { to: '/dashboard/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
          { to: '/admin/payments', label: 'Payment Receipts', icon: CheckSquare },
          { to: '/new-admission-info', label: 'Admission Guidelines', icon: Info },
        ];
      default:
        return [];
    }
  };

  const navItems = roleNavItems();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-3.5rem)] py-6 flex flex-col justify-between shrink-0 shadow-xs">
      <div className="space-y-6">
        {/* IIIT PUNE Official Emblem Header */}
        <div className="flex flex-col items-center justify-center space-y-2 px-4 pb-4 border-b border-slate-100">
          <div className="w-24 h-24 rounded-full border-2 border-[#008ab3] bg-white flex items-center justify-center shadow-xs overflow-hidden">
            <img
              src="/logo.png"
              alt="IIIT Pune Emblem"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-extrabold text-sm tracking-wider text-[#008ab3] uppercase">
            IIIT PUNE
          </span>
        </div>

        {/* Navigation Menu Links */}
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'text-[#008ab3] font-bold bg-sky-50 border-l-4 border-[#008ab3]'
                      : 'text-slate-600 hover:text-[#008ab3] hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding */}
      <div className="px-6 py-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
        <p className="font-semibold text-slate-600">IIIT Pune ERP Portal</p>
        <p>AY 2026-2027</p>
      </div>
    </aside>
  );
};
