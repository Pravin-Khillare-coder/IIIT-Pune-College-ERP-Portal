import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { WorkflowTimeline } from '../../components/common/WorkflowTimeline';
import { api } from '../../services/api';
import {
  GraduationCap,
  Building,
  CreditCard,
  FileText,
  Printer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileEdit
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [registration, setRegistration] = useState<any>(null);

  useEffect(() => {
    const fetchCurrentRegistration = async () => {
      try {
        const response = await api.get('/registrations/current');
        setRegistration(response.data);
      } catch {
        setRegistration(null);
      }
    };

    fetchCurrentRegistration();
  }, []);

  const profile = user?.student_profile;
  const currentStatus = registration?.status || 'NOT_STARTED';

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-800 flex flex-col font-sans">
      {/* Top Ocean/Cyan Navbar */}
      <Navbar />

      <div className="flex flex-1">
        {/* Left White Sidebar with IIIT Pune Logo */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl space-y-6">
          {/* Main Registration Box matching exact screenshot design */}
          <div className="bg-white border border-slate-200 rounded-md shadow-sm p-6 space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-semibold text-slate-800 font-sans">
                Provisional Registration Form
              </h2>
            </div>

            {/* Inner Warning / Action Container matching screenshot */}
            <div className="border border-slate-200 rounded-md p-8 sm:p-12 text-center bg-white space-y-4 shadow-2xs">
              {currentStatus === 'NOT_STARTED' ? (
                <div className="space-y-4">
                  <p className="text-red-600 font-bold text-base sm:text-lg">
                    Registration Date not Open/Expired.
                  </p>
                  <div>
                    <button
                      onClick={() => navigate('/registration/form')}
                      className="inline-flex items-center gap-2 text-[#007399] hover:underline text-sm font-semibold transition"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Start Provisional Semester Registration</span>
                    </button>
                  </div>
                </div>
              ) : currentStatus === 'APPROVED' ? (
                <div className="space-y-3">
                  <p className="text-emerald-700 font-bold text-base sm:text-lg flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Semester Registration Officially Approved & Verified!
                  </p>
                  <div>
                    <button
                      onClick={() => navigate(`/registration/print/${registration?.id || 'current'}`)}
                      className="inline-flex items-center gap-2 text-[#007399] hover:underline text-sm font-semibold transition"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Registration Form</span>
                    </button>
                  </div>
                </div>
              ) : currentStatus === 'RETURNED_FOR_CORRECTION' || currentStatus === 'REJECTED' ? (
                <div className="space-y-4 text-left max-w-2xl mx-auto">
                  <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-md">
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <h3 className="text-amber-900 font-bold text-sm sm:text-base">
                        Discrepancy Raised — Action Required
                      </h3>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Your semester registration application has been returned for correction. Please review the reason below and clear the discrepancy to resubmit.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-2">
                      <span className="font-semibold text-slate-700 uppercase tracking-wide">Discrepancy / Rejection Reason</span>
                      {registration?.latest_rejection_role && (
                        <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                          Raised by: {registration.latest_rejection_role.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-red-700 bg-red-50/70 p-3 rounded border border-red-100">
                      "{registration?.latest_rejection_reason || 'Discrepancy identified in fee receipt or documentation. Please review and update.'}"
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => navigate('/registration/form')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      <FileEdit className="w-4 h-4" />
                      <span>Clear Discrepancy & Edit Form</span>
                    </button>
                    <button
                      onClick={() => navigate(`/registration/view/${registration?.id || 'current'}`)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Full Application & History</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                    <span className="text-slate-800 font-bold text-base">
                      {currentStatus === 'PENDING_HOSTEL_STAFF'
                        ? 'Under Verification of Hostel Staff'
                        : currentStatus === 'PENDING_WARDEN'
                        ? 'Verified by Hostel Staff — Under Verification of Hostel Warden'
                        : currentStatus === 'PENDING_FACULTY'
                        ? (registration?.is_hosteller
                            ? 'Verified by Hostel Warden — Under Verification of Faculty Advisor'
                            : 'Submitted by Student — Under Verification of Faculty Advisor')
                        : 'Application Submitted — Verification in Progress'}
                    </span>
                  </div>
                  <div className="flex justify-center my-2">
                    <StatusBadge status={currentStatus} showMeaning={true} isHosteller={registration?.is_hosteller} />
                  </div>
                  <div>
                    <button
                      onClick={() => navigate(`/registration/view/${registration?.id || 'current'}`)}
                      className="inline-flex items-center gap-2 text-[#007399] hover:underline text-sm font-semibold transition"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Submitted Application Form</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Verification Workflow Lifecycle Tracker */}
          {currentStatus !== 'NOT_STARTED' && (
            <WorkflowTimeline
              status={currentStatus}
              isHosteller={registration?.is_hosteller}
              approvalHistory={registration?.approval_history}
              latestRejectionReason={registration?.latest_rejection_reason}
              latestRejectionRole={registration?.latest_rejection_role}
            />
          )}

          {/* Student Profile Quick Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-md p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-[#007399] font-bold text-sm">
                <GraduationCap className="w-4 h-4" />
                <span>Student Academic Profile</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Student Name</span>
                  <span className="font-bold text-slate-800">{user?.full_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>MIS Number</span>
                  <span className="font-mono font-bold text-slate-800">{profile?.mis_number}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Department</span>
                  <span className="font-semibold text-slate-800">{profile?.department}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Current Semester</span>
                  <span className="font-bold text-[#007399]">Semester {profile?.current_semester || 5}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-[#007399] font-bold text-sm">
                <Building className="w-4 h-4" />
                <span>Hostel Occupancy</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Hosteller Status</span>
                  <span className="font-bold text-emerald-700">
                    {profile?.is_hosteller_eligible ? 'Eligible Hosteller' : 'Day Scholar'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Allocated Hostel</span>
                  <span className="font-bold text-slate-800">
                    {registration?.hostel?.name || 'Brahmaputra — Boys Hostel'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Clearance Status</span>
                  <span className="font-bold text-amber-600">
                    {registration?.is_hosteller ? 'Hostel Verification Pending' : 'Clearance Granted'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-[#007399] font-bold text-sm">
                <CreditCard className="w-4 h-4" />
                <span>Financial & Fee Summary</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Tuition Fee</span>
                  <span className="font-mono font-bold text-slate-800">₹ 45,000.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Hostel Fee</span>
                  <span className="font-mono font-bold text-slate-800">₹ 25,000.00</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Pending Dues</span>
                  <span className="font-mono font-bold text-slate-800">No Dues Pending</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
