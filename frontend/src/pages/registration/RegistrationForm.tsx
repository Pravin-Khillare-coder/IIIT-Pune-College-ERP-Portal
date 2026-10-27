import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { api } from '../../services/api';
import {
  GraduationCap,
  Building,
  CreditCard,
  FileCheck2,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export const RegistrationForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [registration, setRegistration] = useState<any>(null);
  const [hostels, setHostels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form Fields State
  const [contactNumber, setContactNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isHosteller, setIsHosteller] = useState(false);
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [abcId, setAbcId] = useState('');
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);
  const [resolutionComments, setResolutionComments] = useState('');

  const isDiscrepancy = registration?.status === 'RETURNED_FOR_CORRECTION' || registration?.status === 'REJECTED';

  // Upload progress states
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regRes, hostelsRes] = await Promise.all([
          api.get('/registrations/current'),
          api.get('/hostels').catch(() => ({
            data: [
              { id: 'h1', name: 'Indrayani — Girls Hostel', gender_category: 'GIRLS', hostel_fee_per_semester: 25000 },
              { id: 'h2', name: 'Sindhu — Girls Hostel', gender_category: 'GIRLS', hostel_fee_per_semester: 25000 },
              { id: 'h3', name: 'Brahmaputra — Boys Hostel', gender_category: 'BOYS', hostel_fee_per_semester: 25000 },
              { id: 'h4', name: 'Krishna — Boys Hostel', gender_category: 'BOYS', hostel_fee_per_semester: 25000 },
              { id: 'h5', name: 'Godavari — Boys Hostel', gender_category: 'BOYS', hostel_fee_per_semester: 25000 },
            ]
          }))
        ]);

        const regData = regRes.data;
        setRegistration(regData);
        setHostels(hostelsRes.data || []);

        if (regData) {
          setContactNumber(regData.contact_number || '9876543210');
          setEmergencyContact(regData.emergency_contact || '9876543211');
          setIsHosteller(regData.is_hosteller || false);
          setSelectedHostelId(regData.hostel_id || 'h3');
          setAbcId(regData.abc_id || '');
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to initialize registration session.');
      }
    };

    fetchData();
  }, []);

  const saveDraft = async (nextStep?: number) => {
    setSaving(true);
    setError(null);
    try {
      const response = await api.post('/registrations/draft', {
        contact_number: contactNumber,
        emergency_contact: emergencyContact,
        is_hosteller: isHosteller,
        hostel_id: isHosteller ? selectedHostelId : null,
        abc_id: abcId
      });
      setRegistration(response.data);
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save draft progress.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!registration) return;
    setUploadingType(documentType);
    setError(null);

    const formData = new FormData();
    formData.append('registration_id', registration.id);
    formData.append('document_type', documentType);
    formData.append('file', file);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Refresh current registration details
      const refreshed = await api.get('/registrations/current');
      setRegistration(refreshed.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to upload ${documentType}.`);
    } finally {
      setUploadingType(null);
    }
  };

  const handleFinalSubmission = async () => {
    if (!declarationConfirmed) {
      setError('Please check and confirm the declaration before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/registrations/submit', {
        contact_number: contactNumber,
        emergency_contact: emergencyContact,
        is_hosteller: isHosteller,
        hostel_id: isHosteller ? selectedHostelId : null,
        abc_id: abcId,
        declaration_confirmed: declarationConfirmed,
        resolution_comments: resolutionComments
      });
      navigate('/dashboard/student');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit registration. Please verify all mandatory uploads.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDoc = (docType: string) => {
    return registration?.documents?.find((d: any) => d.document_type === docType);
  };

  const hasOutstandingDues = user?.student_profile?.mis_number === '112203045';

  const steps = [
    { num: 1, title: 'Details & Route' },
    { num: 2, title: 'Tuition Fee' },
    { num: 3, title: 'Outstanding Dues' },
    { num: 4, title: 'Hostel Fee' },
    { num: 5, title: 'Anti-Ragging' },
    { num: 6, title: 'ABC ID Card' },
    { num: 7, title: 'Final Review' },
  ];

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-800 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-800">Provisional Semester Registration Form</h1>
                <p className="text-xs text-slate-500">Academic Year 2026-2027 • Monsoon Semester</p>
              </div>
              <button
                onClick={() => saveDraft()}
                disabled={saving}
                className="px-3.5 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              >
                {saving ? 'Saving Draft...' : 'Save Draft Progress'}
              </button>
            </div>

            {isDiscrepancy && (
              <div className="p-4 rounded-md bg-amber-50 border border-amber-300 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Clearing Registration Discrepancy</span>
                </div>
                <div className="text-xs text-amber-800 space-y-1">
                  <p>
                    <span className="font-semibold text-slate-700">Reviewer Discrepancy Note:</span>{' '}
                    <span className="font-bold text-red-700">
                      "{registration?.latest_rejection_reason || 'Please correct requested fields and re-upload verified documents.'}"
                    </span>
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Make your updates across the steps below. In Step 7 (Final Review), add any resolution comments and click <strong>Clear Discrepancy & Resubmit</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Stepper Progress Bar */}
            <div className="bg-white border border-slate-200 rounded-md p-4 overflow-x-auto shadow-xs">
              <div className="flex items-center justify-between min-w-[640px]">
                {steps.map((step) => {
                  const isActive = currentStep === step.num;
                  const isCompleted = currentStep > step.num;
                  return (
                    <div key={step.num} className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isActive
                            ? 'bg-[#007399] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          isActive ? 'text-[#007399] font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </span>
                      {step.num < 7 && <div className="w-5 h-0.5 bg-slate-200 mx-1" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Details & Residence Route */}
          {currentStep === 1 && (
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#007399]" />
                  Step 1: Institutional Student Details & Residence Mode
                </h2>
                <p className="text-xs text-slate-500">Verify your official student profile details and select residence mode.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-md bg-[#f8fafc] border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Full Name</span>
                  <span className="font-bold text-slate-800 text-sm">{user?.full_name}</span>
                </div>
                <div className="p-3.5 rounded-md bg-[#f8fafc] border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">MIS Number</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{user?.student_profile?.mis_number}</span>
                </div>
                <div className="p-3.5 rounded-md bg-[#f8fafc] border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Department</span>
                  <span className="font-semibold text-slate-800">{user?.student_profile?.department}</span>
                </div>
                <div className="p-3.5 rounded-md bg-[#f8fafc] border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Current Semester</span>
                  <span className="font-bold text-[#007399]">Semester {user?.student_profile?.current_semester || 5} (AY 2026-2027)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Contact Mobile Number</label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-white border border-slate-300 focus:border-[#007399] rounded-md px-3.5 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Parent/Guardian Contact</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Emergency contact number"
                    className="w-full bg-white border border-slate-300 focus:border-[#007399] rounded-md px-3.5 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-800">Select Current Semester Residence Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setIsHosteller(false)}
                    className={`p-4 rounded-md border cursor-pointer transition flex items-center justify-between ${
                      !isHosteller
                        ? 'bg-sky-50 border-2 border-[#007399] text-slate-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-800">Non-Hosteller</p>
                      <p className="text-xs text-slate-500 mt-0.5">Day Scholar / Residing outside hostel</p>
                    </div>
                    {!isHosteller && <CheckCircle2 className="w-5 h-5 text-[#007399]" />}
                  </div>

                  <div
                    onClick={() => setIsHosteller(true)}
                    className={`p-4 rounded-md border cursor-pointer transition flex items-center justify-between ${
                      isHosteller
                        ? 'bg-amber-50 border-2 border-amber-600 text-slate-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-800">Hosteller</p>
                      <p className="text-xs text-slate-500 mt-0.5">Residing in official IIIT Pune hostel</p>
                    </div>
                    {isHosteller && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
                  </div>
                </div>

                {isHosteller && (
                  <div className="p-4 rounded-md bg-amber-50/60 border border-amber-200 space-y-1.5">
                    <label className="block text-xs font-bold text-amber-900">Select Assigned Hostel Block</label>
                    <select
                      value={selectedHostelId}
                      onChange={(e) => setSelectedHostelId(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-[#007399] rounded-md px-3 py-1.5 text-xs text-slate-800 outline-none"
                    >
                      {hostels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.gender_category}) — ₹ {h.hostel_fee_per_semester?.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => saveDraft(2)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#007399] hover:bg-[#005c7a] text-white font-semibold text-xs transition shadow-xs"
                >
                  <span>Save & Continue to Step 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Tuition Fee */}
          {currentStep === 2 && (
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#007399]" />
                  Step 2: Semester Registration Fee Payment Receipt
                </h2>
                <p className="text-xs text-slate-500">Complete payment via SBI Collect portal and upload mandatory receipt.</p>
              </div>

              <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Applicable Registration Fee</span>
                  <span className="font-mono font-bold text-base text-slate-800">₹ 45,000.00</span>
                </div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  Payment must be completed through the official State Bank Collect portal. Save your transaction receipt as PDF, JPG, or PNG.
                </div>
                <a
                  href="https://www.onlinesbi.sbi/sbicollect/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-sky-50 text-[#007399] border border-sky-200 hover:bg-sky-100 text-xs font-bold transition"
                >
                  <span>Open Official SBI Collect Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Upload Registration Payment Receipt (PDF/JPG/PNG max 5MB)
                </label>

                {getDoc('REGISTRATION_RECEIPT') ? (
                  <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileCheck2 className="w-5 h-5 text-emerald-700" />
                      <div>
                        <p className="text-xs font-bold text-emerald-800">{getDoc('REGISTRATION_RECEIPT').original_filename}</p>
                        <p className="text-[11px] text-emerald-600">
                          {(getDoc('REGISTRATION_RECEIPT').file_size_bytes / 1024).toFixed(1)} KB • Uploaded
                        </p>
                      </div>
                    </div>
                    <label className="cursor-pointer px-3 py-1 rounded-md bg-white hover:bg-slate-50 text-xs text-slate-700 border border-slate-300 font-semibold">
                      Replace File
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('REGISTRATION_RECEIPT', e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-[#007399] rounded-md p-8 flex flex-col items-center justify-center cursor-pointer transition bg-[#f8fafc]">
                    <Upload className="w-7 h-7 text-[#007399] mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700">
                      {uploadingType === 'REGISTRATION_RECEIPT' ? 'Uploading receipt...' : 'Click to select Registration Fee Receipt'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">PDF, JPG, JPEG, PNG up to 5MB</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('REGISTRATION_RECEIPT', e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex justify-between pt-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 rounded-md bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!getDoc('REGISTRATION_RECEIPT')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#007399] hover:bg-[#005c7a] text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
                >
                  <span>Continue to Step 3</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Outstanding Dues */}
          {currentStep === 3 && (
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  Step 3: Outstanding Institute Dues Verification
                </h2>
                <p className="text-xs text-slate-500">Verifying financial clearance against central institute ledger.</p>
              </div>

              {!hasOutstandingDues ? (
                <div className="p-6 rounded-md bg-emerald-50 border border-emerald-200 text-center space-y-1.5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h3 className="text-sm font-bold text-emerald-800">No Outstanding Dues Pending</h3>
                  <p className="text-xs text-emerald-700">Your account is fully cleared. Dues payment receipt is not required.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-md bg-rose-50 border border-rose-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-800">Outstanding Library Due Detected</span>
                      <span className="font-mono font-bold text-base text-rose-900">₹ 500.00</span>
                    </div>
                    <p className="text-xs text-rose-700">Remarks: Overdue book return fine (Central Library)</p>
                    <a
                      href="https://www.onlinesbi.sbi/sbicollect/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-rose-300 text-rose-700 text-xs font-bold transition mt-1"
                    >
                      <span>Pay Dues on SBI Collect Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Upload Dues Payment Receipt</label>
                    {getDoc('DUES_RECEIPT') ? (
                      <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800">{getDoc('DUES_RECEIPT').original_filename}</span>
                        <label className="cursor-pointer text-xs text-slate-700 underline font-semibold">
                          Replace <input type="file" onChange={(e) => e.target.files?.[0] && handleFileUpload('DUES_RECEIPT', e.target.files[0])} className="hidden" />
                        </label>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-[#007399] rounded-md p-6 flex flex-col items-center justify-center cursor-pointer bg-[#f8fafc]">
                        <Upload className="w-6 h-6 text-slate-500 mb-1" />
                        <span className="text-xs font-semibold text-slate-700">Upload Dues Payment Receipt</span>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => e.target.files?.[0] && handleFileUpload('DUES_RECEIPT', e.target.files[0])} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-3">
                <button onClick={() => setCurrentStep(2)} className="px-4 py-2 rounded-md bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-300">Back</button>
                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={hasOutstandingDues && !getDoc('DUES_RECEIPT')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#007399] hover:bg-[#005c7a] text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
                >
                  <span>Continue to Step 4</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Hostel Fee */}
          {currentStep === 4 && (
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#007399]" />
                  Step 4: Hostel Fee Payment Receipt
                </h2>
                <p className="text-xs text-slate-500">Required only for students residing in official hostels.</p>
              </div>

              {!isHosteller ? (
                <div className="p-6 rounded-md bg-sky-50 border border-sky-200 text-center space-y-1.5">
                  <CheckCircle2 className="w-8 h-8 text-[#007399] mx-auto" />
                  <h3 className="text-sm font-bold text-[#007399]">Step Skipped: Non-Hosteller Residence</h3>
                  <p className="text-xs text-slate-600">You are registered as a non-hosteller for this semester. Hostel fee receipt is not required.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Selected Hostel Block</span>
                      <span className="font-bold text-slate-800">
                        {hostels.find(h => h.id === selectedHostelId)?.name || 'Brahmaputra — Boys Hostel'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Hostel Fee Per Semester</span>
                      <span className="font-mono font-bold text-base text-slate-800">₹ 25,000.00</span>
                    </div>
                    <a
                      href="https://www.onlinesbi.sbi/sbicollect/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-sky-50 text-[#007399] border border-sky-200 hover:bg-sky-100 text-xs font-bold transition"
                    >
                      <span>Pay Hostel Fee on SBI Collect</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Upload Hostel Fee Payment Receipt</label>
                    {getDoc('HOSTEL_RECEIPT') ? (
                      <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800">{getDoc('HOSTEL_RECEIPT').original_filename}</span>
                        <label className="cursor-pointer text-xs text-slate-700 underline font-semibold">
                          Replace <input type="file" onChange={(e) => e.target.files?.[0] && handleFileUpload('HOSTEL_RECEIPT', e.target.files[0])} className="hidden" />
                        </label>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-[#007399] rounded-md p-6 flex flex-col items-center justify-center cursor-pointer bg-[#f8fafc]">
                        <Upload className="w-6 h-6 text-slate-500 mb-1" />
                        <span className="text-xs font-semibold text-slate-700">Upload Hostel Fee Receipt</span>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => e.target.files?.[0] && handleFileUpload('HOSTEL_RECEIPT', e.target.files[0])} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-3">
                <button onClick={() => setCurrentStep(3)} className="px-4 py-2 rounded-md bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-300">Back</button>
                <button
                  onClick={() => setCurrentStep(5)}
                  disabled={isHosteller && !getDoc('HOSTEL_RECEIPT')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#007399] hover:bg-[#005c7a] text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
                >
                  <span>Continue to Step 5</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Anti-Ragging */}
          {currentStep === 5 && (
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  Step 5: Anti-Ragging Mandatory Undertaking
                </h2>
                <p className="text-xs text-slate-500">Complete anti-ragging affidavit online and upload signed copy.</p>
              </div>

              <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-2 text-xs text-slate-600">
                <p className="leading-relaxed">
                  As per UGC regulations, every student must submit a signed Anti-Ragging Undertaking for the academic year.
                </p>
                <a
                  href="https://www.antiragging.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-sky-50 text-[#007399] border border-sky-200 hover:bg-sky-100 text-xs font-bold transition"
                >
                  <span>Fill Anti-Ragging Form Online</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Upload Anti-Ragging Form / Undertaking (PDF/JPG/PNG)</label>
                {getDoc('ANTI_RAGGING') ? (
                  <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800">{getDoc('ANTI_RAGGING').original_filename}</span>
                    <label className="cursor-pointer text-slate-700 underline font-semibold">
                      Replace <input type="file" onChange={(e) => e.target.files?.[0] && handleFileUpload('ANTI_RAGGING', e.target.files[0])} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-[#007399] rounded-md p-6 flex flex-col items-center justify-center cursor-pointer bg-[#f8fafc]">
                    <Upload className="w-6 h-6 text-slate-500 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">Upload Anti-Ragging Undertaking</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => e.target.files?.[0] && handleFileUpload('ANTI_RAGGING', e.target.files[0])} className="hidden" />
                  </label>
                )}
              </div>

              <div className="flex justify-between pt-3">
                <button onClick={() => setCurrentStep(4)} className="px-4 py-2 rounded-md bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-300">Back</button>
                <button
                  onClick={() => setCurrentStep(6)}
                  disabled={!getDoc('ANTI_RAGGING')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#007399] hover:bg-[#005c7a] text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
                >
                  <span>Continue to Step 6</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: ABC ID */}
          {currentStep === 6 && (
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#007399]" />
                  Step 6: Academic Bank of Credits (ABC) ID & DigiLocker Card
                </h2>
                <p className="text-xs text-slate-500">Enter your official ABC ID and upload card downloaded from DigiLocker.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Bank of Credits (ABC) ID</label>
                  <input
                    type="text"
                    value={abcId}
                    onChange={(e) => setAbcId(e.target.value)}
                    placeholder="e.g. 123-456-789-012"
                    className="w-full bg-white border border-slate-300 focus:border-[#007399] rounded-md px-3.5 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Upload DigiLocker ABC ID Card Document</label>
                  {getDoc('ABC_CARD') ? (
                    <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800">{getDoc('ABC_CARD').original_filename}</span>
                      <label className="cursor-pointer text-slate-700 underline font-semibold">
                        Replace <input type="file" onChange={(e) => e.target.files?.[0] && handleFileUpload('ABC_CARD', e.target.files[0])} className="hidden" />
                      </label>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-[#007399] rounded-md p-6 flex flex-col items-center justify-center cursor-pointer bg-[#f8fafc]">
                      <Upload className="w-6 h-6 text-slate-500 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">Upload DigiLocker ABC Card</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => e.target.files?.[0] && handleFileUpload('ABC_CARD', e.target.files[0])} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <button onClick={() => setCurrentStep(5)} className="px-4 py-2 rounded-md bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-300">Back</button>
                <button
                  onClick={() => saveDraft(7)}
                  disabled={!abcId || !getDoc('ABC_CARD')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#007399] hover:bg-[#005c7a] text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
                >
                  <span>Review Application (Step 7)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: Final Review */}
          {currentStep === 7 && (
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Step 7: Final Review & Submission Confirmation
                </h2>
                <p className="text-xs text-slate-500">Review all entered details and document uploads before final submission.</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-1.5">
                  <span className="font-bold text-[#007399] block uppercase text-[11px]">1. Student Details</span>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <p>Name: <span className="font-bold text-slate-900">{user?.full_name}</span></p>
                    <p>MIS: <span className="font-bold text-slate-900">{user?.student_profile?.mis_number}</span></p>
                    <p>Contact: <span className="font-bold text-slate-900">{contactNumber}</span></p>
                    <p>Emergency: <span className="font-bold text-slate-900">{emergencyContact}</span></p>
                    <p>ABC ID: <span className="font-bold text-slate-900">{abcId}</span></p>
                  </div>
                </div>

                <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-1.5">
                  <span className="font-bold text-amber-800 block uppercase text-[11px]">2. Residence & Route</span>
                  <p className="text-slate-700">
                    Residence Mode: <span className="font-bold text-slate-900">{isHosteller ? 'Hosteller' : 'Non-Hosteller'}</span>
                    {isHosteller && (
                      <span className="ml-2 text-amber-800 font-bold">
                        ({hostels.find(h => h.id === selectedHostelId)?.name})
                      </span>
                    )}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Workflow Route: {isHosteller ? 'Student → Hostel Staff → Warden → Faculty Advisor' : 'Student → Faculty Advisor (Direct Route)'}
                  </p>
                </div>

                <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-1.5">
                  <span className="font-bold text-emerald-800 block uppercase text-[11px]">3. Uploaded Documents Check</span>
                  <div className="space-y-1">
                    <p className="text-emerald-700 font-semibold">✓ Registration Fee Receipt: {getDoc('REGISTRATION_RECEIPT')?.original_filename}</p>
                    <p className="text-emerald-700 font-semibold">✓ Anti-Ragging Undertaking: {getDoc('ANTI_RAGGING')?.original_filename}</p>
                    <p className="text-emerald-700 font-semibold">✓ DigiLocker ABC Card: {getDoc('ABC_CARD')?.original_filename}</p>
                    {isHosteller && <p className="text-emerald-700 font-semibold">✓ Hostel Fee Receipt: {getDoc('HOSTEL_RECEIPT')?.original_filename}</p>}
                    {hasOutstandingDues && <p className="text-emerald-700 font-semibold">✓ Dues Payment Receipt: {getDoc('DUES_RECEIPT')?.original_filename}</p>}
                  </div>
                </div>
              </div>

              {isDiscrepancy && (
                <div className="p-4 rounded-md bg-amber-50/70 border border-amber-300 space-y-2">
                  <label className="block text-xs font-bold text-amber-900">
                    Discrepancy Resolution Remarks (Note to Reviewer):
                  </label>
                  <textarea
                    value={resolutionComments}
                    onChange={(e) => setResolutionComments(e.target.value)}
                    placeholder="Briefly state what was corrected or updated (e.g. Re-uploaded clear SBI Collect transaction slip with legible UTR)..."
                    rows={3}
                    className="w-full text-xs p-2.5 rounded-md border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800"
                  />
                  <p className="text-[11px] text-amber-700">
                    Providing explanation notes helps the review authority quickly re-evaluate and clear your application.
                  </p>
                </div>
              )}

              <div className="p-4 rounded-md bg-sky-50 border border-sky-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="declaration"
                  checked={declarationConfirmed}
                  onChange={(e) => setDeclarationConfirmed(e.target.checked)}
                  className="w-4 h-4 accent-[#007399] rounded cursor-pointer mt-0.5"
                />
                <label htmlFor="declaration" className="text-xs text-slate-700 cursor-pointer leading-relaxed">
                  I hereby confirm that all information entered in this semester registration form and all uploaded payment receipts and documents are genuine, authentic, and complete. I understand that submitting false receipts will lead to immediate cancellation of registration and disciplinary action.
                </label>
              </div>

              <div className="flex justify-between pt-3">
                <button onClick={() => setCurrentStep(6)} className="px-4 py-2 rounded-md bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-300">Back</button>
                <button
                  onClick={handleFinalSubmission}
                  disabled={submitting || !declarationConfirmed}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-white font-bold text-xs transition shadow-xs disabled:opacity-50 ${
                    isDiscrepancy
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isDiscrepancy ? 'Clearing Discrepancy & Submitting...' : 'Submitting Registration...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isDiscrepancy ? 'Clear Discrepancy & Resubmit Form' : 'Submit Semester Registration'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
