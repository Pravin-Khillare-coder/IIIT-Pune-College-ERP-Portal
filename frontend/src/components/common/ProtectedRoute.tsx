import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f6f9] text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#007399] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Authenticating ERP Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login/student" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleDashboardMap: Record<UserRole, string> = {
      STUDENT: '/dashboard/student',
      HOSTEL_STAFF: '/dashboard/staff',
      HOSTEL_WARDEN: '/dashboard/warden',
      FACULTY_ADVISOR: '/dashboard/advisor',
      ADMIN: '/dashboard/admin',
    };
    return <Navigate to={roleDashboardMap[user.role] || '/'} replace />;
  }

  return <>{children}</>;
};
