import React from 'react';
import type { RegistrationStatus } from '../../types';

interface StatusBadgeProps {
  status: RegistrationStatus | string;
  showMeaning?: boolean;
  isHosteller?: boolean;
  className?: string;
}

export const getStatusDetails = (status: string, isHosteller: boolean = true) => {
  switch (status) {
    case 'APPROVED':
      return {
        shortLabel: 'Approved (Verified by Faculty)',
        fullLabel: 'Verified by Faculty Advisor — Officially Approved',
        stageExplanation: 'Verified by Faculty Advisor. Semester Registration is officially approved.',
        badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        dotColor: 'bg-emerald-500'
      };
    case 'PENDING_HOSTEL_STAFF':
      return {
        shortLabel: 'Under Hostel Staff',
        fullLabel: 'Under Verification of Hostel Staff',
        stageExplanation: 'Currently under verification of Hostel Staff for room allotment and hostel dues clearance.',
        badgeStyle: 'bg-amber-50 text-amber-800 border-amber-300',
        dotColor: 'bg-amber-500'
      };
    case 'PENDING_WARDEN':
      return {
        shortLabel: 'Verified by Staff • Under Warden',
        fullLabel: 'Verified by Hostel Staff — Under Verification of Hostel Warden',
        stageExplanation: 'Verified by Hostel Staff. Currently under verification of Hostel Warden for final hostel clearance.',
        badgeStyle: 'bg-sky-50 text-sky-800 border-sky-300',
        dotColor: 'bg-sky-500'
      };
    case 'PENDING_FACULTY':
      return {
        shortLabel: isHosteller ? 'Verified by Warden • Under Advisor' : 'Under Faculty Advisor',
        fullLabel: isHosteller
          ? 'Verified by Hostel Warden — Under Verification of Faculty Advisor'
          : 'Submitted by Student — Under Verification of Faculty Advisor',
        stageExplanation: isHosteller
          ? 'Verified by Hostel Warden (hostel clearance granted). Currently under academic verification of Faculty Advisor.'
          : 'Direct Day Scholar route. Currently under academic course verification of Faculty Advisor.',
        badgeStyle: 'bg-indigo-50 text-indigo-800 border-indigo-300',
        dotColor: 'bg-indigo-500'
      };
    case 'RETURNED_FOR_CORRECTION':
      return {
        shortLabel: 'Discrepancy Raised (Action Required)',
        fullLabel: 'Discrepancy Raised — Returned for Student Correction',
        stageExplanation: 'Reviewer identified a discrepancy in submitted documents or details. Student must resolve and resubmit.',
        badgeStyle: 'bg-rose-50 text-rose-800 border-rose-300',
        dotColor: 'bg-rose-500'
      };
    case 'REJECTED':
      return {
        shortLabel: 'Rejected',
        fullLabel: 'Application Rejected by Review Authority',
        stageExplanation: 'Application has been rejected by review authorities.',
        badgeStyle: 'bg-red-50 text-red-800 border-red-300',
        dotColor: 'bg-red-500'
      };
    case 'SUBMITTED':
      return {
        shortLabel: 'Submitted (Verification in Progress)',
        fullLabel: 'Submitted by Student — Verification in Progress',
        stageExplanation: 'Application submitted and currently in verification queue.',
        badgeStyle: 'bg-amber-50 text-amber-800 border-amber-300',
        dotColor: 'bg-amber-500'
      };
    case 'DRAFT':
      return {
        shortLabel: 'Draft in Progress',
        fullLabel: 'Draft in Progress (Not Yet Submitted)',
        stageExplanation: 'Registration form is currently saved as a draft by the student.',
        badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
        dotColor: 'bg-purple-500'
      };
    case 'NOT_STARTED':
    default:
      return {
        shortLabel: 'Not Started',
        fullLabel: 'Registration Not Started',
        stageExplanation: 'Student has not yet started provisional semester registration.',
        badgeStyle: 'bg-slate-100 text-slate-600 border-slate-200',
        dotColor: 'bg-slate-400'
      };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showMeaning = false,
  isHosteller = true,
  className = ''
}) => {
  const details = getStatusDetails(status, isHosteller);
  const label = showMeaning ? details.fullLabel : details.shortLabel;

  return (
    <span
      title={details.stageExplanation}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${details.badgeStyle} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${details.dotColor}`} />
      <span>{label}</span>
    </span>
  );
};
