import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const DEMO_ACCOUNTS = [
  {
    email: 'user@demo.com',
    password: 'Demo1234!',
    displayName: 'Demo User',
    role: 'user' as const,
    label: 'User',
    color: 'indigo',
  },
  {
    email: 'admin@demo.com',
    password: 'Admin1234!',
    displayName: 'Demo Admin',
    role: 'admin' as const,
    label: 'Admin',
    color: 'amber',
  },
];

/**
 * Creates both demo accounts in Firebase Auth + Firestore if they don't exist.
 * Call once from a setup page or dev console.
 */
export async function seedDemoAccounts(): Promise<{ created: string[]; skipped: string[] }> {
  const created: string[] = [];
  const skipped: string[] = [];

  for (const account of DEMO_ACCOUNTS) {
    try {
      // Try signing in — if it works, account already exists
      await signInWithEmailAndPassword(auth, account.email, account.password);
      skipped.push(account.email);
    } catch (loginErr: any) {
      if (loginErr.code !== 'auth/user-not-found' && loginErr.code !== 'auth/invalid-credential') {
        skipped.push(account.email);
        continue;
      }
      // Create it
      try {
        const cred = await createUserWithEmailAndPassword(auth, account.email, account.password);
        await updateProfile(cred.user, { displayName: account.displayName });
        await setDoc(doc(db, 'users', cred.user.uid), {
          email: account.email,
          displayName: account.displayName,
          role: account.role,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          storageUsed: 0,
          fileCount: 0,
        });
        created.push(account.email);
      } catch {
        skipped.push(account.email);
      }
    }
  }

  // Sign out after seeding so the page stays on login
  await auth.signOut();
  return { created, skipped };
}
