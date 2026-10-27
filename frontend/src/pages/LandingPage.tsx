import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Building2,
  ShieldCheck,
  UserCheck,
  Shield,
  ArrowRight,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const loginRoles = [
    {
      title: 'Student Portal',
      description: 'Semester registration, payment receipt submission, anti-ragging & ABC ID card uploads.',
      path: '/login/student',
      icon: GraduationCap,
      color: 'bg-[#007399]',
      badge: 'Student Role',
    },
    {
      title: 'Hostel Staff Portal',
      description: 'Hostel application verification, room allocation check & hostel fee receipt validation.',
      path: '/login/hostel-staff',
      icon: Building2,
      color: 'bg-amber-600',
      badge: 'Hostel Staff',
    },
    {
      title: 'Hostel Warden Portal',
      description: 'Hosteller clearance review, warden discrepancy handling & advisor forwarding.',
      path: '/login/warden',
      icon: ShieldCheck,
      color: 'bg-purple-600',
      badge: 'Warden Role',
    },
    {
      title: 'Faculty Advisor Portal',
      description: 'Academic advisee registration review, discrepancy management & final registration approval.',
      path: '/login/faculty-advisor',
      icon: UserCheck,
      color: 'bg-teal-600',
      badge: 'Faculty Advisor',
    },
    {
      title: 'Administrator Portal',
      description: 'User management, semester dates, fee policies, payment receipt verification & audit logs.',
      path: '/login/admin',
      icon: Shield,
      color: 'bg-emerald-700',
      badge: 'System Admin',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-800 flex flex-col font-sans">
      {/* Top Ocean/Teal Institutional Header matching Portal Navbar */}
      <header className="bg-[#007399] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-white/60 bg-white flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/logo.png"
                alt="IIIT Pune Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-wide text-white">
                IIIT PUNE ERP PORTAL
              </h1>
              <p className="text-[11px] text-sky-100 font-medium">
                Indian Institute of Information Technology Pune
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Banner Card */}
        <div className="bg-white border border-slate-200 rounded-md p-6 sm:p-8 shadow-xs text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-bold text-[#007399]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Monsoon 2026 Semester Registration Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Digital Semester Registration & Academic ERP Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Official portal for IIIT Pune students to complete provisional semester registration online, submit SBI Collect fee receipts, and track multi-level approvals across hostel staff, wardens, and faculty advisors.
          </p>
        </div>

        {/* 5 Distinct Login Options Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">Role-Based Portals</h3>
              <p className="text-xs text-slate-500">Select your authorized role to access the dedicated login interface</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>RBAC Protected</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loginRoles.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.path}
                  onClick={() => navigate(role.path)}
                  className="p-5 rounded-md bg-white border border-slate-200 hover:border-[#007399] hover:shadow-xs cursor-pointer group transition duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-14 h-14 rounded-md ${role.color} flex items-center justify-center text-white shadow-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                        {role.badge}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#007399] transition">
                      {role.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#007399]">
                    <span>Access Portal</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Official Institutional Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-700">© 2026 Indian Institute of Information Technology Pune (IIIT Pune). All Rights Reserved.</p>
        <p className="text-slate-500 text-[11px]">Academic ERP Portal • Digital Semester Registration System</p>
      </footer>
    </div>
  );
};
