import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { searchFiles } from '../../services/files.service';
import { ArchiveFile } from '../../types';
import { formatBytes } from '../../services/files.service';

export function Navbar() {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArchiveFile[]>([]);
  const [searching, setSearching] = useState(false);

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

        {/* Dropdown */}
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

      <div className="ml-auto flex items-center gap-2">
        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
