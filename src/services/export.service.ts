import * as XLSX from 'xlsx';
import { ArchiveFile, ActivityLog } from '../types';
import { formatBytes } from './files.service';
import { format } from 'date-fns';

function tsToDate(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return format(d, 'yyyy-MM-dd HH:mm');
}

export function exportFilesToExcel(files: ArchiveFile[], filename = 'archive_files'): void {
  const rows = files.map((f) => ({
    Name: f.name,
    Category: f.category,
    Size: formatBytes(f.size),
    Tags: f.tags.join(', '),
    'Folder': f.folderPath,
    'Uploaded By': f.uploadedByName,
    'Upload Date': tsToDate(f.createdAt),
    Description: f.description ?? '',
    Public: f.isPublic ? 'Yes' : 'No',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Files');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportFilesToCSV(files: ArchiveFile[], filename = 'archive_files'): void {
  const rows = files.map((f) => ({
    Name: f.name,
    Category: f.category,
    Size: formatBytes(f.size),
    Tags: f.tags.join('; '),
    Folder: f.folderPath,
    UploadedBy: f.uploadedByName,
    UploadDate: tsToDate(f.createdAt),
    Description: f.description ?? '',
    Public: f.isPublic ? 'Yes' : 'No',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Files');
  XLSX.writeFile(wb, `${filename}.csv`);
}

export function exportActivityToExcel(logs: ActivityLog[], filename = 'activity_log'): void {
  const rows = logs.map((l) => ({
    User: l.userName,
    Action: l.action,
    Target: l.targetName ?? '',
    Details: l.details ?? '',
    Date: tsToDate(l.createdAt),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Activity');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function parseImportedCSV(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(ws));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
