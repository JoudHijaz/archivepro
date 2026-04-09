import React from 'react';
import { X, Download, ExternalLink, Tag, Calendar, HardDrive, User } from 'lucide-react';
import { ArchiveFile } from '../../types';
import { formatBytes } from '../../services/files.service';
import { format } from 'date-fns';

interface Props {
  file: ArchiveFile;
  onClose: () => void;
}

export function FilePreview({ file, onClose }: Props) {
  const ts = (file.createdAt as any)?.toDate ? (file.createdAt as any).toDate() : new Date();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold truncate flex-1 mr-4">{file.name}</h2>
          <div className="flex items-center gap-2">
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
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
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

          {/* Metadata sidebar */}
          <div className="w-56 border-l border-slate-700 p-4 overflow-y-auto space-y-4 shrink-0">
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

            {file.description && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Description</p>
                <p className="text-xs text-slate-400 leading-relaxed">{file.description}</p>
              </div>
            )}

            {file.tags.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {file.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 text-slate-300 text-xs rounded">
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
