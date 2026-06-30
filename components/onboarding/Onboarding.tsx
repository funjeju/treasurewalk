'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';
import { createFamily, createChild } from '@/lib/firebase/families';
import type { AgeTier } from '@/lib/types';

const TIERS: AgeTier[] = ['T1', 'T2', 'T3', 'T4'];

/** 최초 로그인 가족 생성 → 첫 자녀 등록(동의 게이트). docs/04 §3.1, docs/07 §A.3 */
export function Onboarding() {
  const t = useTranslations('onboarding');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { user, family, setFamily, refreshFamily } = useAuth();

  const [step, setStep] = useState<'family' | 'child'>(family ? 'child' : 'family');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // family form
  const [familyName, setFamilyName] = useState('');
  const [familyLocale, setFamilyLocale] = useState(locale);

  // child form
  const [childName, setChildName] = useState('');
  const [ageTier, setAgeTier] = useState<AgeTier>('T2');
  const [consent, setConsent] = useState(false);

  async function handleCreateFamily() {
    if (!user || !familyName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const fam = await createFamily(user.uid, familyName.trim(), familyLocale);
      setFamily(fam);
      setStep('child');
    } catch (e) {
      console.error(e);
      setError(tc('error'));
    } finally {
      setBusy(false);
    }
  }

  async function handleAddChild() {
    if (!family || !childName.trim()) return;
    if (!consent) {
      setError(t('consentRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createChild(family.id, {
        displayName: childName.trim(),
        ageTier,
        guardianConsent: true,
      });
      await refreshFamily();
    } catch (e) {
      console.error(e);
      setError(tc('error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="tq-panel p-6 tq-pop">
        {step === 'family' ? (
          <>
            <h1 className="text-xl font-extrabold">{t('createFamilyTitle')}</h1>
            <p className="mt-1 text-sm text-[var(--tq-ink-soft)]">
              {t('createFamilySubtitle')}
            </p>

            <label className="mt-5 block text-sm font-bold">{t('familyName')}</label>
            <input
              className="tq-input mt-1"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder={t('familyNamePlaceholder')}
              autoFocus
            />

            <label className="mt-4 block text-sm font-bold">
              {t('defaultLanguage')}
            </label>
            <select
              className="tq-input mt-1"
              value={familyLocale}
              onChange={(e) => setFamilyLocale(e.target.value)}
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>

            <button
              type="button"
              className="tq-btn tq-btn-primary mt-6 w-full"
              onClick={handleCreateFamily}
              disabled={busy || !familyName.trim()}
            >
              {t('createFamily')}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-extrabold">{t('addChildTitle')}</h1>
            <p className="mt-1 text-sm text-[var(--tq-ink-soft)]">
              {t('addChildSubtitle')}
            </p>

            <label className="mt-5 block text-sm font-bold">{t('childName')}</label>
            <input
              className="tq-input mt-1"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder={t('childNamePlaceholder')}
              autoFocus
            />

            <label className="mt-4 block text-sm font-bold">{t('ageTier')}</label>
            <div className="mt-2 grid grid-cols-1 gap-2">
              {TIERS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setAgeTier(tier)}
                  className={`tq-btn justify-start ${
                    ageTier === tier ? 'tq-btn-primary' : 'tq-btn-secondary'
                  }`}
                  aria-pressed={ageTier === tier}
                >
                  {t(`tier${tier}`)}
                </button>
              ))}
            </div>

            <label className="mt-5 flex items-start gap-3 rounded-[14px] border border-[var(--tq-border)] bg-[var(--tq-surface-2)] p-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span className="text-sm">
                <span className="font-bold">{t('consentTitle')}</span>
                <br />
                {t('consentText')}
              </span>
            </label>
            <p className="mt-2 text-xs text-[var(--tq-ink-soft)]">
              🔒 {t('locationNote')}
            </p>

            <button
              type="button"
              className="tq-btn tq-btn-primary mt-5 w-full"
              onClick={handleAddChild}
              disabled={busy || !childName.trim() || !consent}
            >
              {t('addChild')}
            </button>
          </>
        )}

        {error && (
          <p className="mt-3 text-sm font-semibold text-[var(--tq-ruby)]">{error}</p>
        )}
      </div>
    </div>
  );
}
