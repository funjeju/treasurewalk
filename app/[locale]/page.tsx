'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function IndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations('common');

  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/dashboard' : '/login');
  }, [user, loading, router]);

  return (
    <main className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-3 text-[var(--tq-ink-soft)]">
        <span className="text-4xl tq-pop" aria-hidden>🗺️</span>
        <span className="font-extrabold text-[var(--tq-gold-deep)]">
          {t('appName')}
        </span>
        <span>{t('loading')}</span>
      </div>
    </main>
  );
}
