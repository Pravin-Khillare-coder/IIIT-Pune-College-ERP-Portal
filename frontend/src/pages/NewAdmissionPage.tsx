import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  PhoneCall,
  Mail,
  MapPin,
  AlertCircle
} from 'lucide-react';

export const NewAdmissionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-800 flex flex-col font-sans">
      {/* Top Ocean/Teal Header */}
      <header className="bg-[#007399] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(-1)}>
            <div className="w-12 h-12 rounded-full border-2 border-white/60 bg-white flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/logo.png"
                alt="IIIT Pune Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-wide text-white">
                IIIT PUNE ADMISSION CELL
              </h1>
              <p className="text-[11px] text-sky-100 font-medium">
                New Admission Guidelines & Information
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-white/15 hover:bg-white/25 border border-white/30 text-xs font-semibold text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Important Notice */}
        <div className="p-5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Notice: Online New Admission Registration is Not Available</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed pl-7">
            Please note that provisional semester registration on this ERP portal is strictly for existing enrolled IIIT Pune students. All newly admitted B.Tech candidates must complete their admission reporting physically at the institute campus as per JoSAA/CSAB official guidelines.
          </p>
        </div>

        {/* Procedures Card */}
        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5 shadow-xs">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Building className="w-5 h-5 text-[#007399]" />
              Official Offline Admission Procedure (AY 2026-2027)
            </h2>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-1">
              <span className="font-bold text-[#007399]">Step 1: Physical Reporting at IIIT Pune Campus</span>
              <p className="text-slate-600 leading-relaxed">
                Candidates must report physically to the Academic Section, IIIT Pune Main Campus, Ambegaon BK, Pune during scheduled reporting dates with all original certificates.
              </p>
            </div>

            <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-1">
              <span className="font-bold text-[#007399]">Step 2: Document Verification & Certificate Check</span>
              <p className="text-slate-600 leading-relaxed">
                Verify JoSAA/CSAB Seat Allotment Letter, Class 10/12 Marksheets, Category/PWD Certificates, JEE Main Scorecard, Aadhaar Card, Transfer & Migration Certificates.
              </p>
            </div>

            <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-1">
              <span className="font-bold text-[#007399]">Step 3: Fee Balance Payment & Roll Number Allocation</span>
              <p className="text-slate-600 leading-relaxed">
                Pay the remaining Institute fees via official State Bank Collect link. Upon verification, institutional MIS Roll Numbers and Student ERP accounts will be issued by the Academic Office.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4 shadow-xs">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-[#007399]" />
              Official Admission Cell Contact Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-1.5">
              <p className="font-bold text-slate-800">Academic Section</p>
              <p className="text-slate-600 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                admissions@iiitp.ac.in
              </p>
              <p className="text-slate-600 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-slate-400" />
                +91 020 2695 0400
              </p>
            </div>

            <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-1.5">
              <p className="font-bold text-slate-800">Campus Address</p>
              <p className="text-slate-600 flex items-center gap-2 leading-relaxed">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                IIIT Pune Campus, Survey No. 9/1, Ambegaon BK, Pune - 411046, Maharashtra, India.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 space-y-1 mt-auto">
        <p className="font-medium text-slate-700">© 2026 Indian Institute of Information Technology Pune (IIIT Pune). All Rights Reserved.</p>
        <p className="text-slate-500 text-[11px]">Academic Section • Admission Cell</p>
      </footer>
    </div>
  );
};
