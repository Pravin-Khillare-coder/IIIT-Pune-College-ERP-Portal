import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, ArrowLeft, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({
        email,
        password,
        expected_role: 'ADMIN',
      });
      navigate('/dashboard/admin');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Login failed. Please check credentials.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickSelect = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-800 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md space-y-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#007399] hover:underline transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to IIIT Pune Portal</span>
        </button>

        <div className="bg-white border border-slate-200 rounded-md p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
            <div className="w-11 h-11 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">System Admin Login</h2>
              <p className="text-xs text-slate-500">ERP & Fee Verification Console</p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="admin@iiitp.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-[#007399] rounded-md pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-[#007399] rounded-md pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-md bg-[#007399] hover:bg-[#005c7a] text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Verifying...' : 'Sign In as Administrator'}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#007399]" />
              <span>Demo Quick-Fill Accounts</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickSelect('admin@iiitp.ac.in', 'Admin@123')}
                className="p-2 rounded-md bg-slate-50 border border-slate-200 hover:border-[#007399] text-left transition flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800">System Administrator</p>
                  <p className="text-[11px] text-slate-500">admin@iiitp.ac.in</p>
                </div>
                <span className="text-[10px] font-bold text-[#007399]">Use Credentials</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
