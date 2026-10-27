import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  GraduationCap,
  FileText,
  ShieldCheck
} from 'lucide-react';

interface WorkflowTimelineProps {
  status: string;
  isHosteller?: boolean;
  approvalHistory?: any[];
  latestRejectionReason?: string;
  latestRejectionRole?: string;
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  status,
  isHosteller = true,
  latestRejectionReason,
  latestRejectionRole,
}) => {
  const isSubmitted = status !== 'NOT_STARTED' && status !== 'DRAFT';
  const isApproved = status === 'APPROVED';
  const isDiscrepancy = status === 'RETURNED_FOR_CORRECTION' || status === 'REJECTED';

  // Status mapping
  let staffState: 'completed' | 'active' | 'pending' | 'discrepancy' | 'skipped' = 'pending';
  let wardenState: 'completed' | 'active' | 'pending' | 'discrepancy' | 'skipped' = 'pending';
  let facultyState: 'completed' | 'active' | 'pending' | 'discrepancy' = 'pending';

  if (!isHosteller) {
    staffState = 'skipped';
    wardenState = 'skipped';
    if (status === 'PENDING_FACULTY') {
      facultyState = 'active';
    } else if (isApproved) {
      facultyState = 'completed';
    } else if (isDiscrepancy) {
      facultyState = 'discrepancy';
    }
  } else {
    // Hosteller route
    if (status === 'PENDING_HOSTEL_STAFF') {
      staffState = 'active';
      wardenState = 'pending';
      facultyState = 'pending';
    } else if (status === 'PENDING_WARDEN') {
      staffState = 'completed';
      wardenState = 'active';
      facultyState = 'pending';
    } else if (status === 'PENDING_FACULTY') {
      staffState = 'completed';
      wardenState = 'completed';
      facultyState = 'active';
    } else if (isApproved) {
      staffState = 'completed';
      wardenState = 'completed';
      facultyState = 'completed';
    } else if (isDiscrepancy) {
      if (latestRejectionRole === 'HOSTEL_STAFF') {
        staffState = 'discrepancy';
      } else if (latestRejectionRole === 'HOSTEL_WARDEN') {
        staffState = 'completed';
        wardenState = 'discrepancy';
      } else {
        staffState = 'completed';
        wardenState = 'completed';
        facultyState = 'discrepancy';
      }
    }
  }

  const steps = [
    {
      id: 'submission',
      title: 'Student Submission',
      role: 'Student Form & Receipts',
      state: isSubmitted ? 'completed' : 'pending',
      icon: FileText,
      explanation: isSubmitted ? 'Application and mandatory receipts uploaded' : 'Draft stage',
      badgeText: isSubmitted ? '✓ Submitted' : 'Pending'
    },
    ...(isHosteller
      ? [
          {
            id: 'hostel_staff',
            title: 'Hostel Staff Verification',
            role: 'Hostel Staff Desk',
            state: staffState,
            icon: Building,
            explanation:
              staffState === 'completed'
                ? 'Verified room allotment & hostel dues'
                : staffState === 'active'
                ? 'Under verification of Hostel Staff'
                : staffState === 'discrepancy'
                ? 'Discrepancy flagged by Staff'
                : 'Awaiting submission',
            badgeText:
              staffState === 'completed'
                ? '✓ Verified by Staff'
                : staffState === 'active'
                ? '⏳ Under Verification'
                : staffState === 'discrepancy'
                ? '⚠️ Discrepancy'
                : 'Pending'
          },
          {
            id: 'hostel_warden',
            title: 'Hostel Warden Clearance',
            role: 'Hostel Warden Desk',
            state: wardenState,
            icon: ShieldCheck,
            explanation:
              wardenState === 'completed'
                ? 'Hostel clearance granted by Warden'
                : wardenState === 'active'
                ? 'Verified by Staff — Under verification of Warden'
                : wardenState === 'discrepancy'
                ? 'Discrepancy flagged by Warden'
                : 'Awaiting Staff verification',
            badgeText:
              wardenState === 'completed'
                ? '✓ Verified by Warden'
                : wardenState === 'active'
                ? '⏳ Under Verification'
                : wardenState === 'discrepancy'
                ? '⚠️ Discrepancy'
                : 'Pending'
          }
        ]
      : [
          {
            id: 'hostel_skipped',
            title: 'Hostel Clearance',
            role: 'Day Scholar Route',
            state: 'skipped',
            icon: Building,
            explanation: 'Hostel verification not required for Non-Hosteller',
            badgeText: 'Bypassed (Day Scholar)'
          }
        ]),
    {
      id: 'faculty_advisor',
      title: 'Faculty Advisor Approval',
      role: 'Academic Department',
      state: facultyState,
      icon: GraduationCap,
      explanation:
        facultyState === 'completed'
          ? 'Academic approval verified by Faculty Advisor'
          : facultyState === 'active'
          ? isHosteller
            ? 'Verified by Warden — Under verification of Faculty Advisor'
            : 'Submitted — Under verification of Faculty Advisor'
          : facultyState === 'discrepancy'
          ? 'Discrepancy flagged by Advisor'
          : 'Awaiting hostel clearance',
      badgeText:
        facultyState === 'completed'
          ? '✓ Verified & Approved'
          : facultyState === 'active'
          ? '⏳ Under Verification'
          : facultyState === 'discrepancy'
          ? '⚠️ Discrepancy'
          : 'Pending'
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#007399]">
            Workflow Lifecycle & Verification Progress
          </span>
          <h3 className="text-sm font-bold text-slate-800">
            {isApproved
              ? 'Registration Fully Verified & Officially Approved'
              : isDiscrepancy
              ? 'Verification Paused — Discrepancy Resolution in Progress'
              : status === 'PENDING_HOSTEL_STAFF'
              ? 'Stage 1 of 3: Under Verification of Hostel Staff'
              : status === 'PENDING_WARDEN'
              ? 'Stage 2 of 3: Verified by Hostel Staff — Under Verification of Hostel Warden'
              : status === 'PENDING_FACULTY'
              ? isHosteller
                ? 'Stage 3 of 3: Verified by Hostel Warden — Under Verification of Faculty Advisor'
                : 'Direct Route: Under Verification of Faculty Advisor'
              : 'Application Verification Pipeline'}
          </h3>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-500 font-medium">
            {isHosteller ? 'Route: Hosteller (Staff → Warden → Advisor)' : 'Route: Non-Hosteller (Direct Advisor)'}
          </span>
        </div>
      </div>

      {/* Stepper Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isDone = step.state === 'completed';
          const isActive = step.state === 'active';
          const isIssue = step.state === 'discrepancy';
          const isSkipped = step.state === 'skipped';

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-md border transition relative flex flex-col justify-between ${
                isDone
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                  : isActive
                  ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-200 text-sky-950 shadow-xs'
                  : isIssue
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : isSkipped
                  ? 'bg-slate-50 border-slate-200 opacity-70 text-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Step {idx + 1}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-800'
                        : isActive
                        ? 'bg-sky-100 text-sky-800 animate-pulse'
                        : isIssue
                        ? 'bg-rose-100 text-rose-800'
                        : isSkipped
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {step.badgeText}
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isActive
                        ? 'bg-[#007399] text-white'
                        : isIssue
                        ? 'bg-rose-600 text-white'
                        : isSkipped
                        ? 'bg-slate-300 text-slate-600'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isActive ? (
                      <Clock className="w-4 h-4 animate-spin-slow" />
                    ) : isIssue ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold leading-tight">{step.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{step.role}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60">
                <p className="text-[11px] leading-tight text-slate-600">{step.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>

      {isDiscrepancy && latestRejectionReason && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800">
          <span className="font-bold">Active Discrepancy Note: </span>
          <span>{latestRejectionReason}</span>
        </div>
      )}
    </div>
  );
};
