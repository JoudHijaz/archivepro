import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Files,
  HardDrive,
  Users,
  TrendingUp,
  Upload,
  Download,
  Trash2,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchDashboardStats } from '../services/dashboard.service';
import { DashboardStats, ActivityLog } from '../types';
import { formatBytes } from '../services/files.service';
import { format } from 'date-fns';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

const CATEGORY_COLORS: Record<string, string> = {
  image: '#6366f1',
  document: '#22c55e',
  spreadsheet: '#f59e0b',
  other: '#64748b',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  upload: <Upload className="w-3.5 h-3.5 text-indigo-400" />,
  delete: <Trash2 className="w-3.5 h-3.5 text-red-400" />,
  download: <Download className="w-3.5 h-3.5 text-emerald-400" />,
  login: <LogIn className="w-3.5 h-3.5 text-blue-400" />,
};

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">{label}</p>
        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function ActivityItem({ log }: { log: ActivityLog }) {
  const ts = (log.createdAt as any)?.toDate ? (log.createdAt as any).toDate() : new Date();
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
      <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center mt-0.5 shrink-0">
        {ACTION_ICONS[log.action] ?? <Upload className="w-3.5 h-3.5 text-slate-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300">
          <span className="font-medium text-white">{log.userName}</span>{' '}
          {log.action === 'upload' && `uploaded`}
          {log.action === 'delete' && `deleted`}
          {log.action === 'download' && `downloaded`}
          {log.action === 'login' && `logged in`}
          {log.action === 'logout' && `logged out`}
          {log.action === 'register' && `registered`}
          {log.targetName && (
            <span className="text-slate-400"> · {log.targetName}</span>
          )}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{format(ts, 'MMM d, HH:mm')}</p>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { currentUser, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    fetchDashboardStats(currentUser.uid, isAdmin)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [currentUser, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) return null;

  const chartData = stats.dailyUploads.map((d) => ({
    date: format(new Date(d.date), 'MMM d'),
    uploads: d.count,
    size: Math.round(d.size / 1024 / 1024 * 10) / 10,
  }));

  const pieData = stats.byCategory
    .filter((c) => c.count > 0)
    .map((c) => ({ name: c.category, value: c.count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of your archive system</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Files className="w-4 h-4 text-indigo-400" />}
          label="Total Files"
          value={stats.totalFiles.toLocaleString()}
          sub="All time"
          color="bg-indigo-600/20"
        />
        <StatCard
          icon={<HardDrive className="w-4 h-4 text-emerald-400" />}
          label="Storage Used"
          value={formatBytes(stats.totalSize)}
          color="bg-emerald-600/20"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-amber-400" />}
          label="Uploads Today"
          value={stats.uploadsToday.toLocaleString()}
          color="bg-amber-600/20"
        />
        {isAdmin && (
          <StatCard
            icon={<Users className="w-4 h-4 text-pink-400" />}
            label="Total Users"
            value={stats.totalUsers.toLocaleString()}
            color="bg-pink-600/20"
          />
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upload trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Upload Activity – Last 14 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Area
                type="monotone"
                dataKey="uploads"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#uploadGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* File distribution */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4">File Distribution</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[entry.name] ?? '#64748b'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">
              No files yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-medium text-slate-300 mb-3">Recent Activity</h2>
        {stats.recentActivity.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">No activity yet</p>
        ) : (
          <div>
            {stats.recentActivity.slice(0, 10).map((log) => (
              <ActivityItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
