import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  limit,
  startAfter,
  increment,
  QueryDocumentSnapshot,
  DocumentData,
  writeBatch,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask as FBUploadTask,
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { ArchiveFile, FileCategory, FileFilter } from '../types';
import { logActivity } from './activity.service';

const FILES_COLLECTION = 'files';
const PAGE_SIZE = 24;

// ─── Category Detection ───────────────────────────────────────────────────────

export function detectCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) return 'document';
  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'text/csv'
  )
    return 'spreadsheet';
  return 'other';
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export function uploadFileToStorage(
  file: File,
  userId: string,
  folderId: string,
  onProgress: (pct: number) => void
): { task: FBUploadTask; pathRef: string } {
  const ext = file.name.split('.').pop();
  const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const pathRef = `uploads/${userId}/${folderId}/${uniqueName}`;
  const storageRef = ref(storage, pathRef);
  const task = uploadBytesResumable(storageRef, file);

  task.on('state_changed', (snap) => {
    onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
  });

  return { task, pathRef };
}

export async function saveFileMetadata(
  file: File,
  storagePath: string,
  downloadURL: string,
  userId: string,
  userName: string,
  folderId: string,
  tags: string[],
  description: string
): Promise<ArchiveFile> {
  const category = detectCategory(file.type);
  const data = {
    name: file.name,
    originalName: file.name,
    storagePath,
    downloadURL,
    size: file.size,
    mimeType: file.type,
    category,
    tags,
    folderId: folderId || 'root',
    folderPath: '/',
    uploadedBy: userId,
    uploadedByName: userName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    description,
    isPublic: false,
    sharedWith: [],
    metadata: {},
  };

  const docRef = await addDoc(collection(db, FILES_COLLECTION), data);

  // Update user storage stats (non-blocking)
  updateDoc(doc(db, 'users', userId), {
    fileCount: increment(1),
    storageUsed: increment(file.size),
  }).catch(() => {});

  await logActivity(userId, userName, 'upload', docRef.id, file.name);

  return { id: docRef.id, ...data } as unknown as ArchiveFile;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchUserFiles(
  userId: string,
  filter: FileFilter,
  cursor?: QueryDocumentSnapshot<DocumentData>
): Promise<{ files: ArchiveFile[]; nextCursor: QueryDocumentSnapshot<DocumentData> | null }> {
  let q = query(
    collection(db, FILES_COLLECTION),
    where('uploadedBy', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );

  if (filter.category) {
    q = query(q, where('category', '==', filter.category));
  }
  if (filter.folderId) {
    q = query(q, where('folderId', '==', filter.folderId));
  }
  if (cursor) {
    q = query(q, startAfter(cursor));
  }

  const snap = await getDocs(q);
  const files = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ArchiveFile));
  const nextCursor = snap.docs.length === PAGE_SIZE ? snap.docs[snap.docs.length - 1] : null;

  return { files, nextCursor };
}

export async function fetchAllFiles(
  filter: FileFilter,
  cursor?: QueryDocumentSnapshot<DocumentData>
): Promise<{ files: ArchiveFile[]; nextCursor: QueryDocumentSnapshot<DocumentData> | null }> {
  let q = query(
    collection(db, FILES_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );

  if (filter.category) {
    q = query(q, where('category', '==', filter.category));
  }
  if (cursor) {
    q = query(q, startAfter(cursor));
  }

  const snap = await getDocs(q);
  const files = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ArchiveFile));
  const nextCursor = snap.docs.length === PAGE_SIZE ? snap.docs[snap.docs.length - 1] : null;

  return { files, nextCursor };
}

export async function fetchFileById(fileId: string): Promise<ArchiveFile | null> {
  const snap = await getDoc(doc(db, FILES_COLLECTION, fileId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ArchiveFile;
}

// ─── Update / Delete ──────────────────────────────────────────────────────────

export async function updateFileMetadata(
  fileId: string,
  updates: Partial<Pick<ArchiveFile, 'name' | 'tags' | 'description' | 'folderId' | 'isPublic' | 'metadata'>>
): Promise<void> {
  await updateDoc(doc(db, FILES_COLLECTION, fileId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFile(
  fileId: string,
  storagePath: string,
  userId: string,
  userName: string,
  fileName: string,
  fileSize = 0
): Promise<void> {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
  await deleteDoc(doc(db, FILES_COLLECTION, fileId));

  // Update user storage stats (non-blocking)
  updateDoc(doc(db, 'users', userId), {
    fileCount: increment(-1),
    storageUsed: increment(-fileSize),
  }).catch(() => {});

  await logActivity(userId, userName, 'delete', fileId, fileName);
}

export async function bulkDeleteFiles(
  files: Array<{ id: string; storagePath: string; size?: number }>,
  userId: string,
  userName: string
): Promise<void> {
  const batch = writeBatch(db);
  let totalSize = 0;
  for (const f of files) {
    const storageRef = ref(storage, f.storagePath);
    await deleteObject(storageRef);
    batch.delete(doc(db, FILES_COLLECTION, f.id));
    totalSize += f.size ?? 0;
  }
  await batch.commit();

  // Update user storage stats (non-blocking)
  updateDoc(doc(db, 'users', userId), {
    fileCount: increment(-files.length),
    storageUsed: increment(-totalSize),
  }).catch(() => {});

  await logActivity(userId, userName, 'delete', undefined, `${files.length} files`);
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchFiles(
  userId: string,
  searchQuery: string,
  isAdmin: boolean
): Promise<ArchiveFile[]> {
  const q = isAdmin
    ? query(collection(db, FILES_COLLECTION), orderBy('createdAt', 'desc'), limit(100))
    : query(
        collection(db, FILES_COLLECTION),
        where('uploadedBy', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

  const snap = await getDocs(q);
  const lower = searchQuery.toLowerCase();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ArchiveFile))
    .filter(
      (f) =>
        f.name.toLowerCase().includes(lower) ||
        f.tags.some((t) => t.toLowerCase().includes(lower)) ||
        (f.description ?? '').toLowerCase().includes(lower)
    );
}
