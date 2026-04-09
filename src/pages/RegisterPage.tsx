import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Archive, Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p),  label: 'One uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p),  label: 'One number' },
];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(form.email, form.password, form.name);
      toast.success('Account created! Welcome 🎉');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(
        err.code === 'auth/email-already-in-use'
          ? 'Email is already registered'
          : 'Registration failed. Try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  const passStrength = RULES.filter((r) => r.test(form.password)).length;

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-r border-slate-800 p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Archive className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">ArchivePro</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Start archiving<br />
            <span className="text-indigo-400">smarter today.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            Join thousands of teams that trust ArchivePro to keep their documents organised, searchable, and secure.
          </p>
          <div className="space-y-3">
            {['Free account setup in seconds', 'Drag-and-drop bulk uploads', 'Role-based access control'].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-slate-300 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs">© 2025 ArchivePro · Built with React & Firebase</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-sm py-8">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 justify-center mb-8 lg:hidden">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Archive className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-xl">ArchivePro</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Create an account</h2>
            <p className="text-slate-400 text-sm">
              Already have one?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-white text-sm placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

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
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 characters"
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

              {/* Password strength */}
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < passStrength
                            ? passStrength === 3 ? 'bg-emerald-500' : passStrength === 2 ? 'bg-amber-500' : 'bg-red-500'
                            : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {RULES.map((r) => (
                      <div key={r.label} className={`flex items-center gap-1 text-xs ${r.test(form.password) ? 'text-emerald-400' : 'text-slate-600'}`}>
                        <CheckCircle className="w-3 h-3 shrink-0" />
                        <span className="truncate">{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  placeholder="Repeat password"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900 border rounded-xl text-white text-sm placeholder-slate-600 outline-none transition-all ${
                    form.confirm && form.confirm !== form.password
                      ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account…</>
                : 'Create Account'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
