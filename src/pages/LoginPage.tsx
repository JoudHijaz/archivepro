import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Archive, Mail, Lock, Eye, EyeOff, Shield, User, Zap, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_ACCOUNTS, seedDemoAccounts } from '../utils/seedDemo';
import toast from 'react-hot-toast';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err: any) {
      const code = err.code ?? '';
      const msg =
        code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'Invalid email or password'
          : 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const { created } = await seedDemoAccounts();
      toast.success(
        created.length > 0
          ? `Created: ${created.join(', ')}`
          : 'Demo accounts are ready!'
      );
    } catch {
      toast.error('Could not create demo accounts');
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* ── Left panel (branding) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-r border-slate-800 p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Archive className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">ArchivePro</span>
        </div>

        {/* Hero text */}
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Your documents,<br />
            <span className="text-indigo-400">perfectly organized.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            Upload, tag, and search scanned photos, documents, and spreadsheets — all in one secure place.
          </p>

          {/* Feature pills */}
          <div className="space-y-3">
            {[
              { icon: '🔒', text: 'End-to-end secure file storage' },
              { icon: '🔍', text: 'Instant full-text & tag search' },
              { icon: '📊', text: 'Activity dashboard & analytics' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-lg">{f.icon}</span>
                <span className="text-slate-300 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <p className="text-slate-600 text-xs">© 2025 ArchivePro · Built with React & Firebase</p>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 justify-center mb-8 lg:hidden">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Archive className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-xl">ArchivePro</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-slate-400 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Demo accounts */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-900 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Quick Demo
                </span>
              </div>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-all disabled:opacity-50"
              >
                {seeding ? 'Setting up…' : 'Create accounts'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => setForm({ email: acc.email, password: acc.password })}
                  className={`
                    group relative flex items-center gap-2 p-3 rounded-xl border transition-all text-left
                    ${acc.role === 'admin'
                      ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/40'
                      : 'bg-indigo-500/5 border-indigo-500/20 hover:bg-indigo-500/10 hover:border-indigo-500/40'
                    }
                  `}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    acc.role === 'admin' ? 'bg-amber-500/20' : 'bg-indigo-500/20'
                  }`}>
                    {acc.role === 'admin'
                      ? <Shield className="w-4 h-4 text-amber-400" />
                      : <User className="w-4 h-4 text-indigo-400" />
                    }
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className={`text-xs font-semibold ${acc.role === 'admin' ? 'text-amber-300' : 'text-indigo-300'}`}>
                      {acc.label}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{acc.email}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-600 text-center mt-2.5">
              Click a card → credentials auto-fill below
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600">or sign in manually</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-white text-sm placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-white text-sm placeholder-slate-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
                : 'Sign In'
              }
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            New to ArchivePro?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
