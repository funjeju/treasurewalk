'use client';

import { useEffect, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useAuth } from './AuthProvider';

/** 미인증 시 로그인으로 리다이렉트. 로딩 중엔 스플래시. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations('common');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-[var(--tq-ink-soft)]">
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl tq-pop" aria-hidden>🗺️</span>
          <span>{t('loading')}</span>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
