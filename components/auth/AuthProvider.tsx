'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/client';
import { getFamilyForOwner, listChildren } from '@/lib/firebase/families';
import type { Child, Family } from '@/lib/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  family: Family | null;
  children: Child[];
  activeChildId: string | null;
  setActiveChildId: (id: string | null) => void;
  setFamily: (f: Family | null) => void;
  refreshFamily: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

const ACTIVE_CHILD_KEY = 'tq.activeChildId';

export function AuthProvider({ children: kids }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [activeChildId, setActiveChildIdState] = useState<string | null>(null);

  const setActiveChildId = useCallback((id: string | null) => {
    setActiveChildIdState(id);
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem(ACTIVE_CHILD_KEY, id);
      else localStorage.removeItem(ACTIVE_CHILD_KEY);
    }
  }, []);

  const loadFamily = useCallback(async (u: User | null) => {
    if (!u) {
      setFamily(null);
      setChildren([]);
      return;
    }
    const fam = await getFamilyForOwner(u.uid);
    setFamily(fam);
    if (fam) {
      const kidsList = await listChildren(fam.id);
      setChildren(kidsList);
      const stored =
        typeof window !== 'undefined'
          ? localStorage.getItem(ACTIVE_CHILD_KEY)
          : null;
      const valid = kidsList.find((c) => c.id === stored);
      setActiveChildIdState(valid ? valid.id : (kidsList[0]?.id ?? null));
    } else {
      setChildren([]);
    }
  }, []);

  const refreshFamily = useCallback(async () => {
    await loadFamily(auth.currentUser);
  }, [loadFamily]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      try {
        await loadFamily(u);
      } catch (e) {
        console.error('loadFamily failed', e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [loadFamily]);

  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const idToken = await cred.user.getIdToken();
    // 쿠키 세션 설정 (SSR 안전, docs/03 §2)
    await fetch('/api/login', {
      method: 'GET',
      headers: { Authorization: `Bearer ${idToken}` },
    });
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/logout', { method: 'GET' });
    await signOut(auth);
    setFamily(null);
    setChildren([]);
    setActiveChildId(null);
  }, [setActiveChildId]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      family,
      children,
      activeChildId,
      setActiveChildId,
      setFamily,
      refreshFamily,
      loginWithGoogle,
      logout,
    }),
    [
      user,
      loading,
      family,
      children,
      activeChildId,
      setActiveChildId,
      refreshFamily,
      loginWithGoogle,
      logout,
    ],
  );

  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
