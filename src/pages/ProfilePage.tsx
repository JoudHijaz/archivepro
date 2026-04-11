import React, { useState } from 'react';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { formatBytes } from '../services/files.service';
import { User, Lock, HardDrive, Files } from 'lucide-react';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [name, setName] = useState(userProfile?.displayName ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [savingPass, setSavingPass] = useState(false);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    setSavingProfile(true);
    try {
      await updateProfile(currentUser, { displayName: name });
      await updateDoc(doc(db, 'users', currentUser.uid), { displayName: name });
      await refreshProfile();
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwords.next.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!currentUser?.email) return;
    setSavingPass(true);
    try {
      const cred = EmailAuthProvider.credential(currentUser.email, passwords.current);
      await reauthenticateWithCredential(currentUser, cred);
      await updatePassword(currentUser, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
      toast.success('Password changed');
    } catch (err: any) {
      toast.error(err.code === 'auth/wrong-password' ? 'Current password is incorrect' : 'Failed to change password');
    } finally {
      setSavingPass(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Profile Settings</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Files className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-slate-400">Files Uploaded</span>
          </div>
          <p className="text-xl font-bold text-white">{userProfile?.fileCount ?? 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Storage Used</span>
          </div>
          <p className="text-xl font-bold text-white">{formatBytes(userProfile?.storageUsed ?? 0)}</p>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-medium text-white">Personal Info</h2>
        </div>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              value={currentUser?.email ?? ''}
              disabled
              className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
            <div className="px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg">
              <span className={`text-sm capitalize ${userProfile?.role === 'admin' ? 'text-indigo-400' : 'text-slate-300'}`}>
                {userProfile?.role}
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
          >
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-medium text-white">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {(['current', 'next', 'confirm'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                {field === 'current' ? 'Current Password' : field === 'next' ? 'New Password' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                value={passwords[field]}
                onChange={(e) => setPasswords({ ...passwords, [field]: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={savingPass}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
          >
            {savingPass ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
