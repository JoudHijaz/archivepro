import React, { useEffect, useState } from 'react';
import { Activity, Upload, Trash2, Download, LogIn, LogOut, UserPlus, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserActivity, fetchAllActivity } from '../services/activity.service';
import { exportActivityToExcel } from '../services/export.service';
import { ActivityLog, ActivityAction } from '../types';
import { format } from 'date-fns';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

const ACTION_CONFIG: Record<ActivityAction, { icon: React.ReactNode; label: string; color: string }> = {
  upload: { icon: <Upload className="w-3.5 h-3.5" />, label: 'Uploaded', color: 'text-indigo-400 bg-indigo-400/10' },
  delete: { icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Deleted', color: 'text-red-400 bg-red-400/10' },
  download: { icon: <Download className="w-3.5 h-3.5" />, label: 'Downloaded', color: 'text-emerald-400 bg-emerald-400/10' },
  share: { icon: <Activity className="w-3.5 h-3.5" />, label: 'Shared', color: 'text-blue-400 bg-blue-400/10' },
  move: { icon: <Activity className="w-3.5 h-3.5" />, label: 'Moved', color: 'text-amber-400 bg-amber-400/10' },
  rename: { icon: <Activity className="w-3.5 h-3.5" />, label: 'Renamed', color: 'text-purple-400 bg-purple-400/10' },
  login: { icon: <LogIn className="w-3.5 h-3.5" />, label: 'Logged in', color: 'text-sky-400 bg-sky-400/10' },
  logout: { icon: <LogOut className="w-3.5 h-3.5" />, label: 'Logged out', color: 'text-slate-400 bg-slate-400/10' },
  register: { icon: <UserPlus className="w-3.5 h-3.5" />, label: 'Registered', color: 'text-teal-400 bg-teal-400/10' },
};

export function ActivityPage() {
  const { currentUser, isAdmin } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<ActivityAction | ''>('');

  async function load() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = isAdmin
        ? await fetchAllActivity(200)
        : await fetchUserActivity(currentUser.uid, 100);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [currentUser, isAdmin]);

  const displayed = filterAction ? logs.filter((l) => l.action === filterAction) : logs;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Log</h1>
          <p className="text-slate-400 text-sm mt-0.5">{displayed.length} event(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportActivityToExcel(displayed)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
          >
            Export
          </button>
          <button onClick={load} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterAction('')}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
            filterAction === '' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All
        </button>
        {(['upload', 'delete', 'download', 'login', 'register'] as ActivityAction[]).map((action) => (
          <button
            key={action}
            onClick={() => setFilterAction(action)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors capitalize ${
              filterAction === action ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No activity found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Action</th>
                {isAdmin && <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">User</th>}
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Target</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((log) => {
                const ts = (log.createdAt as any)?.toDate?.() ?? new Date();
                const cfg = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.upload;
                return (
                  <tr key={log.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-300">{log.userName}</span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-400 truncate max-w-[200px] block">
                        {log.targetName ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{format(ts, 'MMM d, yyyy HH:mm')}</span>
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
