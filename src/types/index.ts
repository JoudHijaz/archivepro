import { Timestamp } from 'firebase/firestore';

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  storageUsed: number; // bytes
  fileCount: number;
}

// ─── File / Document ─────────────────────────────────────────────────────────

export type FileCategory = 'image' | 'document' | 'spreadsheet' | 'other';

export interface ArchiveFile {
  id: string;
  name: string;
  originalName: string;
  storagePath: string;
  downloadURL: string;
  thumbnailURL?: string;
  size: number; // bytes
  mimeType: string;
  category: FileCategory;
  tags: string[];
  folderId?: string;
  folderPath: string; // e.g. "/invoices/2024"
  uploadedBy: string; // uid
  uploadedByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  description?: string;
  isPublic: boolean;
  sharedWith: string[]; // uids
  metadata: Record<string, string>; // custom key-value pairs
}

// ─── Folder ───────────────────────────────────────────────────────────────────

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  path: string;
  createdBy: string;
  createdAt: Timestamp;
  color?: string;
  icon?: string;
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export type ActivityAction =
  | 'upload'
  | 'delete'
  | 'download'
  | 'share'
  | 'move'
  | 'rename'
  | 'login'
  | 'logout'
  | 'register';

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: ActivityAction;
  targetId?: string;    // file or folder id
  targetName?: string;
  details?: string;
  createdAt: Timestamp;
  ipAddress?: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DailyUploadStat {
  date: string; // "YYYY-MM-DD"
  count: number;
  size: number; // bytes
}

export interface FileCategoryStat {
  category: FileCategory;
  count: number;
  size: number;
}

export interface DashboardStats {
  totalFiles: number;
  totalSize: number;
  totalUsers: number;
  uploadsToday: number;
  recentActivity: ActivityLog[];
  dailyUploads: DailyUploadStat[];
  byCategory: FileCategoryStat[];
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
  result?: ArchiveFile;
}

// ─── Search / Filter ──────────────────────────────────────────────────────────

export interface FileFilter {
  query: string;
  category?: FileCategory;
  tags: string[];
  folderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  uploadedBy?: string;
}
