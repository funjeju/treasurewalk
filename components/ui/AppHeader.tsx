'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/lib/i18n/navigation';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { useAuth } from '@/components/auth/AuthProvider';

export function AppHeader() {
  const t = useTranslations('nav');
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--g-line)] bg-[rgba(8,12,22,0.7)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center gap-1.5 px-3 py-2 sm:gap-2 sm:px-4">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2 font-black text-[var(--g-ink)]"
        >
          <span aria-hidden className="text-xl">🗺️</span>
          <span className="hidden sm:inline">
            Treasure<span className="text-[var(--g-gold)]">Quest</span>
          </span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LocaleSwitcher />
          {user && (
            <button
              type="button"
              aria-label={t('logout')}
              className="g-btn g-btn-glass g-btn-sm shrink-0"
              onClick={async () => {
                await logout();
                router.replace('/login');
              }}
            >
              <span aria-hidden className="sm:hidden">🚪</span>
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
