import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { api } from '../../services/api';
import {
  CreditCard,
  XCircle,
  Eye,
  Search,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const PaymentVerificationPage: React.FC = () => {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipts = async () => {
    try {
      const response = await api.get('/payments/receipts/pending');
      setReceipts(response.data);
    } catch {
      setReceipts([]);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleVerify = async (receiptId: string) => {
    try {
      await api.post(`/payments/receipts/${receiptId}/verify`, {
        action: 'VERIFY'
      });
      fetchReceipts();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed.');
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a mandatory explanation for rejecting the receipt.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post(`/payments/receipts/${selectedReceipt.id}/verify`, {
        action: 'REJECT',
        rejection_reason: rejectionReason
      });
      setRejectionModalOpen(false);
      setSelectedReceipt(null);
      setRejectionReason('');
      fetchReceipts();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Rejection failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReceipts = receipts.filter(
    (r) =>
      r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.mis_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.application_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-800 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 max-w-7xl space-y-6">
          <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-[#007399] uppercase tracking-wider">
                  Financial Review Control Desk
                </span>
                <h1 className="text-xl font-bold text-slate-800 mt-0.5">
                  Payment Receipts Verification Console
                </h1>
                <p className="text-xs text-slate-500">
                  Audit uploaded fee receipts, inspect document files privately, and mark as Verified or Rejected with explanation.
                </p>
              </div>

              <button
                onClick={() => fetchReceipts()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Receipts</span>
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Student, MIS, or App Reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-[#007399] rounded-md pl-9 pr-3.5 py-1.5 text-xs text-slate-800 outline-none"
                />
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Total Receipts Pending Verification: <span className="text-[#007399] font-bold">{receipts.length}</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">App Ref</th>
                    <th className="px-4 py-3">Student & MIS</th>
                    <th className="px-4 py-3">Fee Category</th>
                    <th className="px-4 py-3">Amount Due</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Uploaded File</th>
                    <th className="px-4 py-3 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p>No submitted receipts currently awaiting verification.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-[#007399]">
                          {r.application_number}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{r.student_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{r.mis_number}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px]">
                            {r.fee_category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">
                          ₹ {r.amount_due?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              r.verification_status === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : r.verification_status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {r.verification_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`http://localhost:8000/api/v1/documents/${r.document_id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#007399] hover:underline font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View File</span>
                          </a>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleVerify(r.id)}
                            className="px-3 py-1 rounded-md bg-[#007399] hover:bg-[#005c7a] text-white font-semibold text-xs shadow-xs transition"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReceipt(r);
                              setRejectionModalOpen(true);
                            }}
                            className="px-3 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {rejectionModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-md p-6 max-w-md w-full space-y-5 shadow-lg">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Reject Payment Receipt</h3>
                <p className="text-xs text-slate-500">App: {selectedReceipt.application_number} ({selectedReceipt.student_name})</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Mandatory Rejection Explanation / Reason
              </label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Transaction reference illegible, payment amount mismatched, or duplicate receipt uploaded."
                className="w-full bg-white border border-slate-300 focus:border-rose-500 rounded-md p-2.5 text-xs text-slate-800 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setRejectionModalOpen(false);
                  setSelectedReceipt(null);
                }}
                className="px-3.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={submitting}
                className="px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
