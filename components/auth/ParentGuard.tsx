'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { useAuth } from './AuthProvider';

/** 부모 전용 화면 가드 — 자녀 세션이면 아이 모드로 돌려보냄. */
export function ParentGuard({ children }: { children: ReactNode }) {
  const { loading, isChild } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isChild) router.replace('/map');
  }, [loading, isChild, router]);

  if (isChild) return null;
  return <>{children}</>;
}
