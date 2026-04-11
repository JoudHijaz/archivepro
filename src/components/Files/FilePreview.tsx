import { useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Tag,
  Calendar,
  HardDrive,
  User,
  Edit2,
  Check,
  Globe,
  Lock,
} from 'lucide-react';
import { ArchiveFile } from '../../types';
import { formatBytes, updateFileMetadata } from '../../services/files.service';
import { logActivity } from '../../services/activity.service';
import { useAuth } from '../../contexts/AuthContext';
import { TagInput } from '../Common/TagInput';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Props {
  file: ArchiveFile;
  onClose: () => void;
  onUpdate?: (updated: ArchiveFile) => void;
}

export function FilePreview({ file, onClose, onUpdate }: Props) {
  const { currentUser, userProfile } = useAuth();
  const ts = (file.createdAt as any)?.toDate ? (file.createdAt as any).toDate() : new Date();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(file.name);
  const [tags, setTags] = useState<string[]>(file.tags);
  const [description, setDescription] = useState(file.description ?? '');
  const [isPublic, setIsPublic] = useState(file.isPublic ?? false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!currentUser) return;
    setSaving(true);
    try {
      const trimmedName = name.trim() || file.name;
      const updates: Parameters<typeof updateFileMetadata>[1] = {
        tags,
        description,
        isPublic,
      };
      if (trimmedName !== file.name) {
        updates.name = trimmedName;
        logActivity(
          currentUser.uid,
          userProfile?.displayName ?? '',
          'rename',
          file.id,
          `${file.name} → ${trimmedName}`
        ).catch(() => {});
      }
      await updateFileMetadata(file.id, updates);
      onUpdate?.({ ...file, ...updates, name: trimmedName });
      setEditing(false);
      toast.success('File updated');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setName(file.name);
    setTags(file.tags);
    setDescription(file.description ?? '');
    setIsPublic(file.isPublic ?? false);
    setEditing(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 mr-4 bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
              autoFocus
            />
          ) : (
            <h2 className="text-white font-semibold truncate flex-1 mr-4">{file.name}</h2>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-slate-400 hover:text-white text-sm rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  title="Edit metadata"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <a
                  href={file.downloadURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
                <a
                  href={file.downloadURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Preview panel */}
          <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
            {file.category === 'image' ? (
              <img
                src={file.downloadURL}
                alt={file.name}
                className="max-w-full max-h-full object-contain"
              />
            ) : file.mimeType === 'application/pdf' ? (
              <iframe
                src={file.downloadURL}
                title={file.name}
                className="w-full h-full"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">
                    {file.category === 'spreadsheet' ? '📊' : '📄'}
                  </span>
                </div>
                <p className="text-sm">Preview not available</p>
                <a
                  href={file.downloadURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in new tab
                </a>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-60 border-l border-slate-700 p-4 overflow-y-auto space-y-5 shrink-0">

            {/* Details */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Details</p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-xs text-slate-400">{formatBytes(file.size)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-xs text-slate-400">{format(ts, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-xs text-slate-400 truncate">{file.uploadedByName}</span>
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Visibility</p>
              {editing ? (
                <button
                  type="button"
                  onClick={() => setIsPublic((v) => !v)}
                  className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-xs border transition-colors ${
                    isPublic
                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30 hover:bg-emerald-600/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {isPublic ? 'Public' : 'Private'}
                </button>
              ) : (
                <span className={`flex items-center gap-1.5 text-xs ${file.isPublic ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {file.isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {file.isPublic ? 'Public' : 'Private'}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Description</p>
              {editing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Add a description…"
                  className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-600 outline-none resize-none"
                />
              ) : description ? (
                <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
              ) : (
                <p className="text-xs text-slate-600 italic">No description</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Tags</p>
              {editing ? (
                <TagInput tags={tags} onChange={setTags} />
              ) : tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 text-slate-300 text-xs rounded">
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600 italic">No tags</p>
              )}
            </div>

            {/* Category */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Category</p>
              <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 text-xs rounded capitalize">
                {file.category}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
