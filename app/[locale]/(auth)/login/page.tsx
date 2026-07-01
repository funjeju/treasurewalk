'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { signInWithCustomToken } from 'firebase/auth';
import { useRouter } from '@/lib/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { auth } from '@/lib/firebase/client';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const { user, loading, isChild, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 자녀 코드
  const [mode, setMode] = useState<'parent' | 'child'>('parent');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!loading && user) router.replace(isChild ? '/map' : '/dashboard');
  }, [loading, user, isChild, router]);

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

  async function handleChildLogin() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/child-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (!res.ok) {
        setError(t('codeInvalid'));
        return;
      }
      const { token } = await res.json();
      await signInWithCustomToken(auth, token);
      router.replace('/map');
    } catch (e) {
      console.error(e);
      setError(t('codeInvalid'));
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

        {/* 부모 / 자녀 선택 */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('parent');
              setError(null);
            }}
            className={`tq-btn ${mode === 'parent' ? 'tq-btn-primary' : 'tq-btn-secondary'}`}
            aria-pressed={mode === 'parent'}
          >
            👨‍👩‍👧 {t('parentTab')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('child');
              setError(null);
            }}
            className={`tq-btn ${mode === 'child' ? 'tq-btn-primary' : 'tq-btn-secondary'}`}
            aria-pressed={mode === 'child'}
          >
            🧭 {t('childTab')}
          </button>
        </div>

        <hr className="my-6 border-[var(--tq-border)]" />

        {mode === 'parent' ? (
          <>
            <h2 className="text-lg font-bold">{t('loginTitle')}</h2>
            <p className="mt-2 text-sm text-[var(--tq-ink-soft)]">{t('loginSubtitle')}</p>
            <button
              type="button"
              className="tq-btn tq-btn-primary mt-6 w-full"
              onClick={handleLogin}
              disabled={busy}
            >
              <span aria-hidden>🔑</span>
              {busy ? t('signingIn') : t('googleLogin')}
            </button>
            <p className="mt-6 text-xs leading-relaxed text-[var(--tq-ink-soft)]">
              {t('guardianOnly')}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold">{t('childLoginTitle')}</h2>
            <p className="mt-2 text-sm text-[var(--tq-ink-soft)]">{t('childLoginSubtitle')}</p>
            <input
              className="tq-input mt-4 text-center text-2xl font-black tracking-[0.3em]"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              inputMode="text"
              aria-label={t('childLoginTitle')}
            />
            <button
              type="button"
              className="tq-btn tq-btn-primary mt-4 w-full"
              onClick={handleChildLogin}
              disabled={busy || code.trim().length < 4}
            >
              🚀 {busy ? t('signingIn') : t('childLoginBtn')}
            </button>
          </>
        )}

        {error && (
          <p className="mt-3 text-sm font-semibold text-[var(--tq-ruby)]">{error}</p>
        )}
      </div>
    </main>
  );
}
