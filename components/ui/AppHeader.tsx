'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/lib/i18n/navigation';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { useAuth } from '@/components/auth/AuthProvider';

export function AppHeader() {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--tq-border)] bg-[var(--tq-surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-1.5 px-3 py-2 sm:gap-2 sm:px-4">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2 font-extrabold text-[var(--tq-gold-deep)]"
        >
          <span aria-hidden className="text-xl">🗺️</span>
          <span className="hidden sm:inline">{tc('appName')}</span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          {user && (
            <button
              type="button"
              aria-label={t('logout')}
              className="tq-btn tq-btn-secondary shrink-0 whitespace-nowrap px-3 text-sm"
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
