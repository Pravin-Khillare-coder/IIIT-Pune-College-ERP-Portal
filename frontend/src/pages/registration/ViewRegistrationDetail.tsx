import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { WorkflowTimeline } from '../../components/common/WorkflowTimeline';
import {
  ArrowLeft,
  GraduationCap,
  CreditCard,
  History,
  CheckCircle2,
  Printer,
  AlertTriangle,
  FileEdit,
  XCircle,
  X,
  FileText
} from 'lucide-react';

export const ViewRegistrationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Review Actions State
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/registrations/${id || 'current'}`);
      setData(res.data);
    } catch {
      // Mock fallback
      setData({
        id: id || '1',
        application_number: 'REG-2026-CSE-1042',
        status: 'PENDING_FACULTY',
        created_at: '2026-10-09T14:30:00Z',
        student: {
          user: { full_name: 'Rahul Sharma', email: 'student.rahul@iiitp.ac.in' },
          mis_number: '112203045',
          department: 'Computer Science & Engineering',
          degree_program: 'B.Tech',
          current_semester: 5,
          mobile_number: '+91 98765 43210',
        },
        courses: [
          { code: 'CS301', name: 'Design and Analysis of Algorithms', credits: 4, category: 'Core' },
          { code: 'CS302', name: 'Database Management Systems', credits: 4, category: 'Core' },
          { code: 'CS303', name: 'Computer Networks', credits: 4, category: 'Core' },
          { code: 'CS305', name: 'Artificial Intelligence & ML', credits: 3, category: 'Elective' },
        ],
        payment_receipt: {
          transaction_id: 'SBIN2026100918234',
          amount: 70000.0,
          status: 'VERIFIED',
        },
        approval_history: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const canReview = () => {
    if (!data || !user) return false;
    if (user.role === 'ADMIN') {
      return ['PENDING_HOSTEL_STAFF', 'PENDING_WARDEN', 'PENDING_FACULTY'].includes(data.status);
    }
    if (user.role === 'HOSTEL_STAFF' && data.status === 'PENDING_HOSTEL_STAFF') return true;
    if (user.role === 'HOSTEL_WARDEN' && data.status === 'PENDING_WARDEN') return true;
    if (user.role === 'FACULTY_ADVISOR' && data.status === 'PENDING_FACULTY') return true;
    return false;
  };

  const handleApprove = async () => {
    if (!data) return;
    setSubmittingAction(true);
    setActionError(null);
    try {
      await api.post('/workflow/review', {
        registration_id: data.id,
        action: 'APPROVE',
        comments: 'Verified documents and approved at this workflow stage.'
      });
      setActionSuccessMessage('Application successfully approved!');
      await fetchDetail();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to approve application.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRejectOrRaiseDiscrepancy = async () => {
    if (!rejectionReason.trim()) {
      setActionError('Discrepancy / rejection reason is mandatory.');
      return;
    }
    setSubmittingAction(true);
    setActionError(null);
    try {
      await api.post('/workflow/review', {
        registration_id: data.id,
        action: 'RETURN_DISCREPANCY',
        comments: rejectionReason.trim()
      });
      setRejectionModalOpen(false);
      setRejectionReason('');
      setActionSuccessMessage('Application returned for correction. Student has been notified of the discrepancy reason.');
      await fetchDetail();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to return application.');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f6f9] text-slate-600 flex items-center justify-center">
        <p className="animate-pulse font-medium text-sm">Loading Application Details...</p>
      </div>
    );
  }

  const student = data?.student;
  const history = data?.approval_history || [];
  const isDiscrepancyState = data?.status === 'RETURNED_FOR_CORRECTION' || data?.status === 'REJECTED';

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-800 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
          {/* Top Bar with Back & Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2.5">
              {data?.status === 'APPROVED' && (
                <button
                  onClick={() => navigate(`/registration/print/${data.id}`)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#007399] hover:bg-[#005c7a] text-white text-xs font-bold shadow-xs transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Registration Slip</span>
                </button>
              )}

              {canReview() && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActionError(null);
                      setRejectionModalOpen(true);
                    }}
                    disabled={submittingAction}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Raise Discrepancy / Reject</span>
                  </button>

                  <button
                    onClick={handleApprove}
                    disabled={submittingAction}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Application</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Feedback messages */}
          {actionSuccessMessage && (
            <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
              <span>{actionSuccessMessage}</span>
              <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {actionError && (
            <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between">
              <span>{actionError}</span>
              <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Discrepancy Raised Notice Card */}
          {isDiscrepancyState && (
            <div className="bg-amber-50 border border-amber-300 rounded-md p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Application Returned with Discrepancy</span>
              </div>
              <div className="space-y-1.5 text-xs text-amber-900">
                <p>
                  <span className="font-semibold text-slate-700">Flagged By:</span>{' '}
                  <span className="font-medium text-slate-900 uppercase text-[11px] bg-amber-100 px-2 py-0.5 rounded">
                    {data?.latest_rejection_role ? data.latest_rejection_role.replace('_', ' ') : 'Academic Reviewer'}
                  </span>
                </p>
                <div className="p-3 bg-white/80 rounded border border-amber-200">
                  <span className="block font-semibold text-slate-600 mb-0.5">Discrepancy Reason:</span>
                  <p className="text-sm font-semibold text-red-700">
                    "{data?.latest_rejection_reason || 'Discrepancy noted in uploaded payment receipts or student form.'}"
                  </p>
                </div>
              </div>

              {user?.role === 'STUDENT' && (
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/registration/form')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    <FileEdit className="w-4 h-4" />
                    <span>Clear Discrepancy & Edit Form</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-mono text-[#007399] font-bold">
                  {data?.application_number || 'REG-2026-CSE-1042'}
                </span>
                <h1 className="text-xl font-bold text-slate-800 mt-0.5">
                  Semester Registration Application Detail
                </h1>
                <p className="text-xs text-slate-500">
                  Submitted on {new Date(data?.created_at || Date.now()).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={data?.status || 'SUBMITTED'} showMeaning={true} isHosteller={data?.is_hosteller} />
              </div>
            </div>

            {/* Visual Workflow Stage Progression Tracker */}
            <WorkflowTimeline
              status={data?.status || 'SUBMITTED'}
              isHosteller={data?.is_hosteller}
              approvalHistory={data?.approval_history}
              latestRejectionReason={data?.latest_rejection_reason}
              latestRejectionRole={data?.latest_rejection_role}
            />

            {/* Student & Fee Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#f8fafc] p-4 rounded-md border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-[#007399] font-bold text-sm border-b border-slate-200 pb-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Student Profile</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Full Name</span>
                    <span className="font-semibold text-slate-800">{student?.user?.full_name || data?.student_name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">MIS Number</span>
                    <span className="font-mono font-semibold text-slate-800">{student?.mis_number || data?.mis_number}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Department</span>
                    <span className="font-semibold text-slate-800">{student?.department || data?.department}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Current Semester</span>
                    <span className="font-bold text-[#007399]">Semester {student?.current_semester || data?.current_semester || 5}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#f8fafc] p-4 rounded-md border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-[#007399] font-bold text-sm border-b border-slate-200 pb-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Fee Payment Status</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Transaction ID</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {data?.payment_receipt?.transaction_id || data?.receipts?.[0]?.transaction_reference || 'SBIN2026100918234'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Total Fee Paid</span>
                    <span className="font-mono font-bold text-slate-800">
                      ₹ 70,000.00
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Verification</span>
                    <span className="font-bold text-emerald-700 uppercase">
                      {data?.payment_receipt?.status || 'VERIFIED'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploaded Documents List */}
            {data?.documents && data.documents.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#007399]" />
                  <span>Submitted Documents ({data.documents.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {data.documents.map((d: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-md bg-[#f8fafc] border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800 block">{d.document_type?.replace(/_/g, ' ')}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{d.original_filename}</span>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Attached</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approval History Trail */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-[#007399] font-bold text-sm">
                <History className="w-4 h-4" />
                <span>Approval Audit Trail</span>
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No reviewer actions recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {history.map((h: any, idx: number) => {
                    const isDiscrepancyAction = h.action === 'RETURN_DISCREPANCY' || h.action === 'REJECT';
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-md text-xs flex items-start gap-3 border ${
                          isDiscrepancyAction
                            ? 'bg-red-50/60 border-red-200'
                            : 'bg-[#f8fafc] border-slate-200'
                        }`}
                      >
                        {isDiscrepancyAction ? (
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        )}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 uppercase text-[11px]">
                              {h.step?.replace(/_/g, ' ') || h.actor_role?.replace(/_/g, ' ')} — {h.action?.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(h.created_at || h.timestamp || Date.now()).toLocaleString()}
                            </span>
                          </div>
                          <p className={`font-sans text-xs ${isDiscrepancyAction ? 'text-red-700 font-medium' : 'text-slate-600'}`}>
                            {h.comments}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Rejection / Discrepancy Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                <h2>Raise Discrepancy / Return Application</h2>
              </div>
              <button
                onClick={() => setRejectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Please enter the specific reason for rejecting or returning this application. The student will immediately receive a notification with your comments and an option to clear the discrepancy.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Discrepancy / Rejection Reason (Mandatory):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Fee receipt reference number is blurry or invalid. Please re-upload clear payment voucher..."
                rows={4}
                className="w-full text-xs p-3 rounded-md border border-slate-300 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setRejectionModalOpen(false)}
                className="px-4 py-2 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectOrRaiseDiscrepancy}
                disabled={submittingAction || !rejectionReason.trim()}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                {submittingAction ? 'Returning Application...' : 'Confirm & Notify Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
