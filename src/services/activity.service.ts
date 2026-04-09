import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ActivityAction, ActivityLog } from '../types';

const ACTIVITY_COLLECTION = 'activity';

export async function logActivity(
  userId: string,
  userName: string,
  action: ActivityAction,
  targetId?: string,
  targetName?: string,
  details?: string
): Promise<void> {
  await addDoc(collection(db, ACTIVITY_COLLECTION), {
    userId,
    userName,
    action,
    targetId: targetId ?? null,
    targetName: targetName ?? null,
    details: details ?? null,
    createdAt: serverTimestamp(),
  });
}

export async function fetchUserActivity(userId: string, pageLimit = 50): Promise<ActivityLog[]> {
  const q = query(
    collection(db, ACTIVITY_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(pageLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog));
}

export async function fetchAllActivity(pageLimit = 100): Promise<ActivityLog[]> {
  const q = query(
    collection(db, ACTIVITY_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(pageLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog));
}
