import React, { useEffect, useState, useCallback } from 'react';
import {
  Grid3X3,
  List,
  Filter,
  Download,
  Trash2,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserFiles, fetchAllFiles, deleteFile, formatBytes } from '../services/files.service';
import { exportFilesToExcel, exportFilesToCSV } from '../services/export.service';
import { ArchiveFile, FileCategory, FileFilter } from '../types';
import { FileCard } from '../components/Files/FileCard';
import { FilePreview } from '../components/Files/FilePreview';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const CATEGORIES: Array<{ value: FileCategory | ''; label: string }> = [
  { value: '', label: 'All Types' },
  { value: 'image', label: 'Images' },
  { value: 'document', label: 'Documents' },
  { value: 'spreadsheet', label: 'Spreadsheets' },
  { value: 'other', label: 'Other' },
];

export function FilesPage() {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const [files, setFiles] = useState<ArchiveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<ArchiveFile | null>(null);
  const [filter, setFilter] = useState<FileFilter>({ query: '', tags: [] });

  const loadFiles = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { files: data } = isAdmin
        ? await fetchAllFiles(filter)
        : await fetchUserFiles(currentUser.uid, filter);
      setFiles(data);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isAdmin, filter.category, filter.folderId]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(files.map((f) => f.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function handleDelete(file: ArchiveFile) {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    try {
      await deleteFile(file.id, file.storagePath, currentUser!.uid, userProfile!.displayName, file.name);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      toast.success('File deleted');
    } catch {
      toast.error('Failed to delete file');
    }
  }

  async function handleBulkDelete() {
    if (!selected.size || !window.confirm(`Delete ${selected.size} file(s)?`)) return;
    const toDelete = files.filter((f) => selected.has(f.id));
    try {
      for (const f of toDelete) {
        await deleteFile(f.id, f.storagePath, currentUser!.uid, userProfile!.displayName, f.name);
      }
      setFiles((prev) => prev.filter((f) => !selected.has(f.id)));
      setSelected(new Set());
      toast.success(`${toDelete.length} file(s) deleted`);
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  // Client-side text search on loaded files
  const displayFiles = filter.query
    ? files.filter(
        (f) =>
          f.name.toLowerCase().includes(filter.query.toLowerCase()) ||
          f.tags.some((t) => t.toLowerCase().includes(filter.query.toLowerCase()))
      )
    : files;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{isAdmin ? 'All Files' : 'My Files'}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{displayFiles.length} file(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportFilesToExcel(displayFiles)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={loadFiles} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-900 border border-slate-700 rounded-xl">
        <div className="flex-1 min-w-[200px]">
          <input
            value={filter.query}
            onChange={(e) => setFilter({ ...filter, query: e.target.value })}
            placeholder="Search by name or tag..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilter({ ...filter, category: cat.value as FileCategory || undefined })}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                filter.category === (cat.value || undefined)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'text-white bg-slate-700' : 'text-slate-500 hover:text-white'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'text-white bg-slate-700' : 'text-slate-500 hover:text-white'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-600/20 border border-indigo-500/40 rounded-xl">
          <span className="text-sm text-indigo-300">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => exportFilesToCSV(files.filter((f) => selected.has(f.id)))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-300 hover:text-white hover:bg-indigo-600/40 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-white hover:bg-red-600/40 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete selected
            </button>
            <button onClick={clearSelection} className="text-xs text-slate-400 hover:text-white px-2 py-1.5">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* File grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : displayFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <SlidersHorizontal className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 text-lg font-medium">No files found</p>
          <p className="text-slate-500 text-sm mt-1">Try adjusting filters or upload some files</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {displayFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              selected={selected.has(file.id)}
              onSelect={toggleSelect}
              onDelete={handleDelete}
              onPreview={setPreview}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Size</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Uploaded</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Tags</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {displayFiles.map((file) => {
                const ts = (file.createdAt as any)?.toDate?.() ?? new Date();
                return (
                  <tr
                    key={file.id}
                    className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => setPreview(file)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm text-white truncate max-w-[200px]">{file.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400 capitalize">{file.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">{formatBytes(file.size)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">{ts.toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {file.tags.slice(0, 2).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">{t}</span>
                        ))}
                        {file.tags.length > 2 && <span className="text-xs text-slate-500">+{file.tags.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleDelete(file)} className="text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview modal */}
      {preview && <FilePreview file={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
