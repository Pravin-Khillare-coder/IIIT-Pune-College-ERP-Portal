import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import {
  Users,
  Building2,
  Clock,
  CheckCircle2,
  Download,
  Search,
  Eye,
  Printer
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, regRes] = await Promise.all([
          api.get('/admin/dashboard-stats'),
          api.get('/admin/registrations'),
        ]);
        setStats(statsRes.data);
        setRegistrations(regRes.data);
      } catch {
        // Fallback mock data
        setStats({
          total_students: 4,
          total_users: 9,
          pending_staff_reviews: 1,
          pending_warden_reviews: 1,
          pending_advisor_reviews: 1,
          returned_for_correction: 0,
          approved_registrations: 1,
          total_dues_pending: 500.0,
          active_semester: 'Monsoon 2026',
        });

        setRegistrations([
          {
            id: '1',
            application_number: 'REG-2026-CSE-1042',
            status: 'APPROVED',
            created_at: '2026-10-09T14:30:00Z',
            student: {
              user: { full_name: 'Aditya Ramesh Varma' },
              mis_number: '112203045',
              department: 'Computer Science & Engineering',
              current_semester: 5,
            },
            payment_receipt: { transaction_id: 'SBIN2026100918234', amount: 70000, status: 'VERIFIED' },
          },
          {
            id: '2',
            application_number: 'REG-2026-ECE-2018',
            status: 'PENDING_HOSTEL_STAFF',
            created_at: '2026-10-10T09:15:00Z',
            student: {
              user: { full_name: 'Priya Sundaram' },
              mis_number: '112204012',
              department: 'Electronics & Communication',
              current_semester: 3,
            },
            payment_receipt: { transaction_id: 'HDFC202610109923', amount: 70000, status: 'PENDING' },
          },
          {
            id: '3',
            application_number: 'REG-2026-AIDS-3004',
            status: 'PENDING_FACULTY',
            created_at: '2026-10-10T10:45:00Z',
            student: {
              user: { full_name: 'Rohan Deshmukh' },
              mis_number: '112205089',
              department: 'Artificial Intelligence & Data Science',
              current_semester: 5,
            },
            payment_receipt: { transaction_id: 'ICIC202610103341', amount: 45000, status: 'VERIFIED' },
          },
        ]);
      }
    };

    fetchAdminData();
  }, []);

  const handleExportCSV = () => {
    if (!registrations || registrations.length === 0) return;

    const headers = ['Application Number', 'Student Name', 'MIS Number', 'Department', 'Semester', 'Status', 'Transaction ID', 'Amount Paid'];
    const rows = registrations.map((r) => [
      r.application_number || '',
      r.student?.user?.full_name || '',
      r.student?.mis_number || '',
      r.student?.department || '',
      r.student?.current_semester || '',
      r.status || '',
      r.payment_receipt?.transaction_id || '',
      r.payment_receipt?.amount || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IIIT_Pune_Semester_Registrations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch =
      r.student?.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.student?.mis_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.application_number?.toLowerCase().includes(search.toLowerCase());

    const matchesBranch =
      selectedBranch === 'ALL' ||
      r.student?.department?.toUpperCase().includes(selectedBranch);

    const matchesStatus =
      selectedStatus === 'ALL' || r.status === selectedStatus;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-800 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 max-w-7xl space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-[#007399] uppercase tracking-wider">
                  System Administration Overview • Active Semester: {stats?.active_semester || 'Monsoon 2026'}
                </span>
                <h1 className="text-xl font-bold text-slate-800 mt-0.5">
                  IIIT Pune ERP Administrative Dashboard
                </h1>
                <p className="text-xs text-slate-500">
                  Real-time tracking of semester registrations, review workflows, receipt verifications, and user records.
                </p>
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#007399] hover:bg-[#005c7a] text-white text-xs font-semibold shadow-xs transition self-start md:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV Data</span>
              </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Total Enrolled Students</span>
                  <Users className="w-4 h-4 text-[#007399]" />
                </div>
                <p className="text-2xl font-bold text-slate-800">{stats?.total_students || 4}</p>
                <p className="text-[11px] text-slate-500">Academic Year 2026-2027</p>
              </div>

              <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Pending Staff Reviews</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-amber-700">{stats?.pending_staff_reviews || 1}</p>
                <p className="text-[11px] text-slate-500">Awaiting hostel clearance</p>
              </div>

              <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Pending Warden Reviews</span>
                  <Building2 className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-700">{stats?.pending_warden_reviews || 1}</p>
                <p className="text-[11px] text-slate-500">Awaiting warden signoff</p>
              </div>

              <div className="p-4 rounded-md bg-[#f8fafc] border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Approved Registrations</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-emerald-700">{stats?.approved_registrations || 1}</p>
                <p className="text-[11px] text-slate-500">Completed & printable</p>
              </div>
            </div>
          </div>

          {/* Registration Filter & Records Table */}
          <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Student Registration Applications</h2>
                <p className="text-xs text-slate-500">Search, filter, and inspect student applications across departments</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Name / MIS..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#007399]"
                  />
                </div>

                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#007399]"
                >
                  <option value="ALL">All Departments</option>
                  <option value="COMPUTER">Computer Science (CSE)</option>
                  <option value="ELECTRONICS">Electronics (ECE)</option>
                  <option value="ARTIFICIAL">AI & Data Science</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#007399]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="APPROVED">Approved (Verified by Faculty)</option>
                  <option value="PENDING_HOSTEL_STAFF">Under Verification of Hostel Staff</option>
                  <option value="PENDING_WARDEN">Verified by Staff • Under Warden</option>
                  <option value="PENDING_FACULTY">Verified by Warden • Under Faculty Advisor</option>
                  <option value="RETURNED_FOR_CORRECTION">Discrepancy Raised (Student Action)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Ref Application #</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">MIS Number</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-center">Semester</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredRegistrations.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-[#007399]">{r.application_number}</td>
                      <td className="p-3 font-semibold text-slate-900">{r.student?.user?.full_name}</td>
                      <td className="p-3 font-mono text-slate-700">{r.student?.mis_number}</td>
                      <td className="p-3 text-slate-700">{r.student?.department}</td>
                      <td className="p-3 text-center font-bold text-slate-800">Sem {r.student?.current_semester}</td>
                      <td className="p-3 text-center">
                        <StatusBadge status={r.status} isHosteller={r.is_hosteller} />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/registration/view/${r.id}`)}
                            className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="View Registration Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {r.status === 'APPROVED' && (
                            <button
                              onClick={() => navigate(`/registration/print/${r.id}`)}
                              className="p-1.5 rounded-md bg-sky-100 hover:bg-sky-200 text-[#007399] transition"
                              title="Print Official Slip"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
