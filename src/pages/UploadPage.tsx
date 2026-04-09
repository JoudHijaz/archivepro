import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUploader } from '../components/Files/FileUploader';
import { ArrowLeft } from 'lucide-react';

export function UploadPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate('/files')}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to files
        </button>
        <h1 className="text-2xl font-bold text-white">Upload Files</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload images, documents, spreadsheets, and more to your archive
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <FileUploader onUploaded={() => navigate('/files')} />
      </div>

      {/* Tips */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-medium text-slate-300 mb-3">Tips</h2>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">•</span>
            Add tags to make files easier to search and filter
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">•</span>
            You can upload multiple files at once by dragging them all into the dropzone
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">•</span>
            Maximum file size is 50 MB per file
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">•</span>
            Supported formats: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX, XLS, XLSX, CSV
          </li>
        </ul>
      </div>
    </div>
  );
}
