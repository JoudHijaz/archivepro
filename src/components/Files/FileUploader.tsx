import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle, Loader2, CloudUpload } from 'lucide-react';
import {
  uploadFileToStorage,
  saveFileMetadata,
  formatBytes,
} from '../../services/files.service';
import { useAuth } from '../../contexts/AuthContext';
import { UploadTask } from '../../types';
import { TagInput } from '../Common/TagInput';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_TYPES = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff'],
  'application/pdf': ['.pdf'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

// uuid shim if v4 not available
function genId() {
  try { return uuidv4(); } catch { return `${Date.now()}_${Math.random()}`; }
}

interface Props {
  onUploaded?: () => void;
}

export function FileUploader({ onUploaded }: Props) {
  const { currentUser, userProfile } = useAuth();
  const [queue, setQueue] = useState<UploadTask[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  function updateTask(id: string, patch: Partial<UploadTask>) {
    setQueue((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    if (rejected.length) {
      toast.error(`${rejected.length} file(s) rejected — check size/type limits`);
    }
    const newTasks: UploadTask[] = accepted.map((file) => ({
      id: genId(),
      file,
      progress: 0,
      status: 'pending',
    }));
    setQueue((prev) => [...prev, ...newTasks]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  async function startUpload() {
    if (!currentUser || !userProfile) return;
    setUploading(true);

    for (const task of queue.filter((t) => t.status === 'pending')) {
      updateTask(task.id, { status: 'uploading', progress: 0 });

      try {
        const { task: fbTask, pathRef } = uploadFileToStorage(
          task.file,
          currentUser.uid,
          'root',
          (pct) => updateTask(task.id, { progress: pct })
        );

        await new Promise<void>((resolve, reject) => {
          fbTask.on('state_changed', null, reject, resolve);
        });

        const { getDownloadURL } = await import('firebase/storage');
        const { ref } = await import('firebase/storage');
        const { storage } = await import('../../firebase/config');
        const url = await getDownloadURL(ref(storage, pathRef));

        const result = await saveFileMetadata(
          task.file,
          pathRef,
          url,
          currentUser.uid,
          userProfile.displayName,
          'root',
          tags,
          description
        );

        updateTask(task.id, { status: 'success', result });
      } catch (err: any) {
        updateTask(task.id, { status: 'error', error: err.message ?? 'Upload failed' });
      }
    }

    setUploading(false);
    const success = queue.filter((t) => t.status !== 'error').length;
    if (success > 0) {
      toast.success(`${success} file(s) uploaded successfully`);
      onUploaded?.();
    }
  }

  function removeTask(id: string) {
    setQueue((prev) => prev.filter((t) => t.id !== id));
  }

  const pendingCount = queue.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-600 hover:border-slate-400 bg-slate-900'
        }`}
      >
        <input {...getInputProps()} />
        <CloudUpload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-indigo-400' : 'text-slate-500'}`} />
        <p className="text-white font-medium">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-slate-400 text-sm mt-1">
          or <span className="text-indigo-400">click to browse</span>
        </p>
        <p className="text-slate-500 text-xs mt-3">
          Images, PDFs, Word, Excel, CSV · Max 50 MB per file
        </p>
      </div>

      {/* Metadata */}
      {queue.length > 0 && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Tags</label>
            <TagInput tags={tags} onChange={setTags} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional description for these files..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>
      )}

      {/* Queue */}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-700 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{task.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">{formatBytes(task.file.size)}</span>
                  {task.status === 'uploading' && (
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  )}
                  {task.status === 'error' && (
                    <span className="text-xs text-red-400">{task.error}</span>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                {task.status === 'pending' && (
                  <button onClick={() => removeTask(task.id)} className="text-slate-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
                {task.status === 'uploading' && (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                )}
                {task.status === 'success' && (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
                {task.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {pendingCount > 0 && (
        <button
          onClick={startUpload}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload {pendingCount} file{pendingCount > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
