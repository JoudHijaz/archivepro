import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserProfile } from '../types';

interface AuthContextValue {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(uid: string) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        setUserProfile({ ...snap.data(), uid } as UserProfile);
      }
    } catch {
      // Firestore rules not yet deployed — profile loads as null
    }
  }

  async function login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Non-critical Firestore updates — don't block or fail login if they error
    updateDoc(doc(db, 'users', cred.user.uid), {
      lastLoginAt: serverTimestamp(),
    }).catch(() => {});
    setDoc(doc(db, 'activity', `${cred.user.uid}_${Date.now()}`), {
      userId: cred.user.uid,
      userName: cred.user.displayName ?? email,
      action: 'login',
      createdAt: serverTimestamp(),
    }).catch(() => {});
  }

  async function register(email: string, password: string, displayName: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });

    const profile: Omit<UserProfile, 'uid'> = {
      email,
      displayName,
      role: 'user',
      createdAt: serverTimestamp() as any,
      lastLoginAt: serverTimestamp() as any,
      storageUsed: 0,
      fileCount: 0,
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
    await setDoc(doc(db, 'activity', `${cred.user.uid}_${Date.now()}`), {
      userId: cred.user.uid,
      userName: displayName,
      action: 'register',
      createdAt: serverTimestamp(),
    });
  }

  async function logout() {
    if (currentUser) {
      await setDoc(doc(db, 'activity', `${currentUser.uid}_${Date.now()}`), {
        userId: currentUser.uid,
        userName: currentUser.displayName ?? currentUser.email,
        action: 'logout',
        createdAt: serverTimestamp(),
      });
    }
    await signOut(auth);
    setUserProfile(null);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const value: AuthContextValue = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    resetPassword,
    isAdmin: userProfile?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
