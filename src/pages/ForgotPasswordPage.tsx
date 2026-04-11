import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      const msg =
        err.code === 'auth/user-not-found'
          ? 'No account found with that email'
          : 'Failed to send reset email. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-10">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Archive className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-xl">ArchivePro</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              We sent a password reset link to{' '}
              <span className="text-white font-medium">{email}</span>.
              Check your inbox and follow the instructions.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">Reset your password</h2>
              <p className="text-slate-400 text-sm">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-white text-sm placeholder-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
