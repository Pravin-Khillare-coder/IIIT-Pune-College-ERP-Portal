import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import { CheckSquare, Search, Eye } from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPendingReviews = async () => {
      try {
        const response = await api.get('/workflow/pending');
        setApplications(response.data);
      } catch {
        setApplications([
          {
            id: '2',
            application_number: 'REG-2026-ECE-2018',
            student_name: 'Priya Sundaram',
            mis_number: '112204012',
            hostel_name: 'Brahmaputra — Boys Hostel',
            status: 'PENDING_HOSTEL_STAFF',
            submitted_at: '2026-10-10T09:15:00Z',
          }
        ]);
      }
    };

    fetchPendingReviews();
  }, []);

  const assignedHostel = user?.assigned_hostels?.[0]?.hostel_name || 'Brahmaputra Hostel';

  const filteredApps = applications.filter((app) =>
    app.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.mis_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.application_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-800 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 max-w-7xl space-y-6">
          <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold text-[#007399] uppercase tracking-wider">
                  Hostel Staff Verification Desk
                </span>
                <h1 className="text-xl font-bold text-slate-800 mt-0.5">
                  Hostel Clearance Applications ({assignedHostel})
                </h1>
                <p className="text-xs text-slate-500">
                  Inspect student hostel fee receipts, verify room occupancy, and grant clearance.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search MIS or Student..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#008ab3] rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Application Ref</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">MIS Number</th>
                    <th className="px-4 py-3">Hostel</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p>No hostel applications currently pending staff verification.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-[#007399]">
                          {app.application_number}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{app.student_name}</td>
                        <td className="px-4 py-3 font-mono">{app.mis_number}</td>
                        <td className="px-4 py-3">{app.hostel_name}</td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate(`/registration/view/${app.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#007399] text-white hover:bg-[#006080] font-semibold text-xs transition shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
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
    </div>
  );
};
