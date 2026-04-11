import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { searchFiles } from '../../services/files.service';
import { fetchUserActivity } from '../../services/activity.service';
import { ArchiveFile, ActivityLog } from '../../types';
import { formatBytes } from '../../services/files.service';
import { formatDistanceToNow } from 'date-fns';

const ACTION_LABELS: Record<string, string> = {
  upload: 'Uploaded',
  delete: 'Deleted',
  rename: 'Renamed',
  login: 'Logged in',
  logout: 'Logged out',
  register: 'Registered',
  download: 'Downloaded',
  share: 'Shared',
  move: 'Moved',
};

export function Navbar() {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArchiveFile[]>([]);
  const [searching, setSearching] = useState(false);

  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<ActivityLog[]>([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const found = await searchFiles(currentUser!.uid, value, isAdmin);
      setResults(found.slice(0, 6));
    } finally {
      setSearching(false);
    }
  }

  async function openBell() {
    setBellOpen((v) => !v);
    if (!bellOpen && currentUser) {
      setLoadingNotif(true);
      try {
        const logs = await fetchUserActivity(currentUser.uid, 8);
        setNotifications(logs);
      } finally {
        setLoadingNotif(false);
      }
    }
  }

  // Close bell on outside click
  useEffect(() => {
    if (!bellOpen) return;
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center px-4 gap-4">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search files, tags..."
          className="w-full pl-9 pr-8 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Search dropdown */}
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden">
            {searching && (
              <div className="px-4 py-2 text-xs text-slate-400">Searching...</div>
            )}
            {results.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  navigate(`/files?preview=${f.id}`);
                  setQuery('');
                  setResults([]);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-slate-700 transition-colors"
              >
                <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center text-xs text-slate-300 shrink-0">
                  {f.category === 'image' ? '🖼' : f.category === 'document' ? '📄' : f.category === 'spreadsheet' ? '📊' : '📁'}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm text-white truncate">{f.name}</p>
                  <p className="text-xs text-slate-400">{formatBytes(f.size)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bell */}
      <div className="ml-auto relative" ref={bellRef}>
        <button
          onClick={openBell}
          className={`relative p-2 rounded-lg transition-colors ${
            bellOpen ? 'text-white bg-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && !bellOpen && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
          )}
        </button>

        {bellOpen && (
          <div className="absolute right-0 top-10 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <span className="text-sm font-medium text-white">Recent Activity</span>
              <button
                onClick={() => { setBellOpen(false); navigate('/activity'); }}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                View all
              </button>
            </div>

            {loadingNotif ? (
              <div className="flex justify-center py-6">
                <span className="w-5 h-5 border-2 border-slate-600 border-t-indigo-400 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No recent activity</p>
            ) : (
              <ul>
                {notifications.map((log) => {
                  const ts = (log.createdAt as any)?.toDate?.() ?? new Date();
                  return (
                    <li key={log.id} className="flex items-start gap-3 px-4 py-3 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/40 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 text-xs mt-0.5">
                        {log.action === 'upload' ? '⬆️' : log.action === 'delete' ? '🗑️' : log.action === 'rename' ? '✏️' : log.action === 'login' ? '🔑' : '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white">
                          <span className="font-medium">{ACTION_LABELS[log.action] ?? log.action}</span>
                          {log.targetName && (
                            <span className="text-slate-400"> · {log.targetName}</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDistanceToNow(ts, { addSuffix: true })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
