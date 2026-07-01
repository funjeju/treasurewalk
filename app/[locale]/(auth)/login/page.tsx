'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  async function handleLogin() {
    setBusy(true);
    setError(null);
    try {
      await loginWithGoogle();
      router.replace('/dashboard');
    } catch (e) {
      console.error(e);
      setError(t('loginFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LocaleSwitcher />
      </div>

      <div className="tq-panel w-full max-w-md p-8 text-center tq-pop">
        <div className="mb-3 text-5xl" aria-hidden>🗺️</div>
        <h1 className="text-2xl font-extrabold text-[var(--tq-gold-deep)]">
          {tc('appName')}
        </h1>
        <p className="mt-1 text-[var(--tq-ink-soft)]">{tc('tagline')}</p>

        <hr className="my-6 border-[var(--tq-border)]" />

        <h2 className="text-lg font-bold">{t('loginTitle')}</h2>
        <p className="mt-2 text-sm text-[var(--tq-ink-soft)]">
          {t('loginSubtitle')}
        </p>

        <button
          type="button"
          className="tq-btn tq-btn-primary mt-6 w-full"
          onClick={handleLogin}
          disabled={busy}
        >
          <span aria-hidden>🔑</span>
          {busy ? t('signingIn') : t('googleLogin')}
        </button>

        {error && (
          <p className="mt-3 text-sm font-semibold text-[var(--tq-ruby)]">{error}</p>
        )}

        <p className="mt-6 text-xs leading-relaxed text-[var(--tq-ink-soft)]">
          {t('guardianOnly')}
        </p>
      </div>
    </main>
  );
}
