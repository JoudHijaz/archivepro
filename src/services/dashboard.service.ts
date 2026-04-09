import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { DashboardStats, DailyUploadStat, FileCategoryStat, FileCategory } from '../types';
import { format, subDays } from 'date-fns';

export async function fetchDashboardStats(
  userId: string,
  isAdmin: boolean
): Promise<DashboardStats> {
  const filesRef = collection(db, 'files');
  const activityRef = collection(db, 'activity');

  const filesQ = isAdmin
    ? query(filesRef, orderBy('createdAt', 'desc'))
    : query(filesRef, where('uploadedBy', '==', userId), orderBy('createdAt', 'desc'));

  const [filesSnap, activitySnap, usersSnap] = await Promise.all([
    getDocs(filesQ),
    getDocs(query(activityRef, orderBy('createdAt', 'desc'), limit(20))),
    isAdmin ? getDocs(collection(db, 'users')) : Promise.resolve(null),
  ]);

  const files = filesSnap.docs.map((d) => d.data());
  const today = format(new Date(), 'yyyy-MM-dd');

  // Totals
  const totalFiles = files.length;
  const totalSize = files.reduce((sum, f) => sum + (f.size ?? 0), 0);
  const uploadsToday = files.filter((f) => {
    const d = f.createdAt instanceof Timestamp ? f.createdAt.toDate() : new Date(f.createdAt);
    return format(d, 'yyyy-MM-dd') === today;
  }).length;

  // Daily uploads – last 14 days
  const dailyMap: Record<string, DailyUploadStat> = {};
  for (let i = 13; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
    dailyMap[d] = { date: d, count: 0, size: 0 };
  }
  for (const f of files) {
    const d = f.createdAt instanceof Timestamp ? f.createdAt.toDate() : new Date(f.createdAt);
    const key = format(d, 'yyyy-MM-dd');
    if (dailyMap[key]) {
      dailyMap[key].count += 1;
      dailyMap[key].size += f.size ?? 0;
    }
  }

  // By category
  const catMap: Record<string, FileCategoryStat> = {
    image: { category: 'image', count: 0, size: 0 },
    document: { category: 'document', count: 0, size: 0 },
    spreadsheet: { category: 'spreadsheet', count: 0, size: 0 },
    other: { category: 'other', count: 0, size: 0 },
  };
  for (const f of files) {
    const cat = (f.category as FileCategory) ?? 'other';
    catMap[cat].count += 1;
    catMap[cat].size += f.size ?? 0;
  }

  return {
    totalFiles,
    totalSize,
    totalUsers: usersSnap ? usersSnap.size : 0,
    uploadsToday,
    recentActivity: activitySnap.docs.map((d) => ({ id: d.id, ...d.data() } as any)),
    dailyUploads: Object.values(dailyMap),
    byCategory: Object.values(catMap),
  };
}
