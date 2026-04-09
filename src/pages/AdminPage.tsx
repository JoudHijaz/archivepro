import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserProfile } from '../types';
import { Shield, Users, RefreshCw, ChevronDown } from 'lucide-react';
import { formatBytes } from '../services/files.service';
import { format } from 'date-fns';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export function AdminPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function toggleRole(user: UserProfile) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (user.uid === currentUser?.uid) {
      toast.error("You can't change your own role");
      return;
    }
    setUpdating(user.uid);
    try {
      await updateDoc(doc(db, 'users', user.uid), { role: newRole });
      setUsers((prev) => prev.map((u) => u.uid === user.uid ? { ...u, role: newRole } : u));
      toast.success(`${user.displayName} is now ${newRole}`);
    } catch {
      toast.error('Failed to update role');
    } finally {
      setUpdating(null);
    }
  }

  const totalStorage = users.reduce((s, u) => s + (u.storageUsed ?? 0), 0);
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-indigo-400" />
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <p className="text-xs text-slate-400 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-white">{users.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <p className="text-xs text-slate-400 mb-1">Admins</p>
          <p className="text-2xl font-bold text-white">{adminCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <p className="text-xs text-slate-400 mb-1">Total Storage</p>
          <p className="text-2xl font-bold text-white">{formatBytes(totalStorage)}</p>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-medium text-white">User Management</h2>
          </div>
          <button onClick={loadUsers} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-5 py-3 text-xs text-slate-400 font-medium">User</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400 font-medium">Role</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400 font-medium">Files</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400 font-medium">Storage</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400 font-medium">Joined</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const joined = (user.createdAt as any)?.toDate?.() ?? new Date();
                return (
                  <tr key={user.uid} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-sm text-indigo-400 font-bold shrink-0">
                          {user.displayName?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{user.displayName}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          user.role === 'admin'
                            ? 'bg-indigo-600/20 text-indigo-400'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-slate-400">{user.fileCount ?? 0}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-slate-400">{formatBytes(user.storageUsed ?? 0)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-slate-500">{format(joined, 'MMM d, yyyy')}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleRole(user)}
                        disabled={updating === user.uid || user.uid === currentUser?.uid}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg transition-colors"
                      >
                        {updating === user.uid ? (
                          <span>Updating...</span>
                        ) : (
                          <>
                            Make {user.role === 'admin' ? 'user' : 'admin'}
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
