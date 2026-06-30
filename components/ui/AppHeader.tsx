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
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-extrabold text-[var(--tq-gold-deep)]"
        >
          <span aria-hidden className="text-xl">🗺️</span>
          <span className="hidden sm:inline">{tc('appName')}</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          {user && (
            <button
              type="button"
              className="tq-btn tq-btn-secondary text-sm"
              onClick={async () => {
                await logout();
                router.replace('/login');
              }}
            >
              {t('logout')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
