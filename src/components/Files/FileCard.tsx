import React, { useState } from 'react';
import {
  Download,
  Trash2,
  Tag,
  MoreVertical,
  FileText,
  FileSpreadsheet,
  File,
  Image,
} from 'lucide-react';
import { ArchiveFile } from '../../types';
import { formatBytes } from '../../services/files.service';
import { format } from 'date-fns';

interface Props {
  file: ArchiveFile;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (file: ArchiveFile) => void;
  onPreview: (file: ArchiveFile) => void;
}

function CategoryIcon({ category, mimeType }: { category: string; mimeType: string }) {
  if (category === 'image') return <Image className="w-8 h-8 text-indigo-400" />;
  if (category === 'spreadsheet') return <FileSpreadsheet className="w-8 h-8 text-emerald-400" />;
  if (category === 'document') return <FileText className="w-8 h-8 text-blue-400" />;
  return <File className="w-8 h-8 text-slate-400" />;
}

export function FileCard({ file, selected, onSelect, onDelete, onPreview }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ts = (file.createdAt as any)?.toDate ? (file.createdAt as any).toDate() : new Date();

  return (
    <div
      className={`relative group bg-slate-900 border rounded-xl overflow-hidden transition-all cursor-pointer ${
        selected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-700 hover:border-slate-500'
      }`}
      onClick={() => onPreview(file)}
    >
      {/* Checkbox */}
      <div
        className="absolute top-2.5 left-2.5 z-10"
        onClick={(e) => { e.stopPropagation(); onSelect(file.id); }}
      >
        <div
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            selected
              ? 'bg-indigo-500 border-indigo-500'
              : 'border-slate-500 bg-slate-800 opacity-0 group-hover:opacity-100'
          }`}
        >
          {selected && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Thumbnail */}
      <div className="h-36 bg-slate-800 flex items-center justify-center overflow-hidden">
        {file.category === 'image' ? (
          <img
            src={file.downloadURL}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <CategoryIcon category={file.category} mimeType={file.mimeType} />
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm text-white font-medium truncate" title={file.name}>
          {file.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-slate-400">{formatBytes(file.size)}</span>
          <span className="text-xs text-slate-500">{format(ts, 'MMM d, yyyy')}</span>
        </div>

        {/* Tags */}
        {file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {file.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                {tag}
              </span>
            ))}
            {file.tags.length > 3 && (
              <span className="px-1.5 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                +{file.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action menu */}
      <div
        className="absolute top-2.5 right-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-7 h-7 flex items-center justify-center bg-slate-800/80 backdrop-blur-sm rounded-lg text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 w-40 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 py-1">
            <a
              href={file.downloadURL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700"
              onClick={() => setMenuOpen(false)}
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <button
              onClick={() => { setMenuOpen(false); onDelete(file); }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-700 w-full text-left"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
