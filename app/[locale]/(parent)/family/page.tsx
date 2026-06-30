'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { updateChild } from '@/lib/firebase/families';
import { listActivity } from '@/lib/firebase/activity';
import type { ActivityEvent } from '@/lib/types';

export default function FamilyPage() {
  const t = useTranslations('family');
  const tc = useTranslations('common');
  const { family, children, refreshFamily, loading } = useAuth();
  const [feed, setFeed] = useState<ActivityEvent[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  const childName = (id: string) =>
    children.find((c) => c.id === id)?.displayName ?? '—';

  const loadFeed = useCallback(async () => {
    if (!family) return;
    try {
      setFeed(await listActivity(family.id));
    } catch (e) {
      console.error(e);
    }
  }, [family]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  if (loading) return <p className="text-[var(--tq-ink-soft)]">{tc('loading')}</p>;
  if (!family || children.length === 0) return <Onboarding />;

  async function toggleLocation(childId: string, next: boolean) {
    if (!family) return;
    setSaving(childId);
    try {
      await updateChild(family.id, childId, { locationEnabled: next });
      await refreshFamily();
    } finally {
      setSaving(null);
    }
  }

  function feedLine(e: ActivityEvent): string {
    const name = childName(e.childId);
    switch (e.type) {
      case 'FOUND':
        return t('feedFound', { name });
      case 'PAID':
        return t('feedPaid', { name });
      case 'LEVEL_UP':
        return t('feedLevelUp', { name, level: Number(e.payload.level ?? 0) });
      case 'STREAK':
        return t('feedStreak', { name, days: Number(e.payload.days ?? 0) });
      default:
        return name;
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">{t('title')}</h1>

      {/* 탐험가 + 안전 설정 */}
      <section className="tq-panel p-5">
        <h2 className="mb-3 text-lg font-bold">{t('children')}</h2>
        <ul className="space-y-3">
          {children.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-3 rounded-[14px] border border-[var(--tq-border)] p-3"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--tq-surface-2)] text-xl">
                🧭
              </span>
              <div className="min-w-0">
                <p className="font-bold">{c.displayName}</p>
                <p className="text-xs text-[var(--tq-ink-soft)]">
                  {c.ageTier} ·{' '}
                  {c.guardianConsent ? (
                    <span className="text-[var(--tq-jewel)]">✓ {t('consentOk')}</span>
                  ) : (
                    <span className="text-[var(--tq-ruby)]">⚠ {t('consentMissing')}</span>
                  )}
                </p>
              </div>

              {/* 위치 토글 — 기본 OFF (docs/07 A.2-1) */}
              <label className="ml-auto flex items-center gap-2">
                <span className="text-sm">
                  <span className="font-bold">{t('locationEnabled')}</span>
                  <br />
                  <span className="text-xs text-[var(--tq-ink-soft)]">
                    {t('locationOnDesc')}
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="h-6 w-6"
                  checked={c.locationEnabled}
                  disabled={saving === c.id}
                  onChange={(e) => toggleLocation(c.id, e.target.checked)}
                  aria-label={`${c.displayName} ${t('locationEnabled')}`}
                />
              </label>
            </li>
          ))}
        </ul>
      </section>

      {/* 가족 피드 (CD5) */}
      <section className="tq-panel p-5">
        <h2 className="mb-3 text-lg font-bold">{t('feed')}</h2>
        {feed.length === 0 ? (
          <p className="text-[var(--tq-ink-soft)]">{t('noFeed')}</p>
        ) : (
          <ul className="space-y-2">
            {feed.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-2 rounded-[14px] bg-[var(--tq-surface-2)] px-3 py-2"
              >
                <span aria-hidden>
                  {e.type === 'FOUND'
                    ? '🎁'
                    : e.type === 'PAID'
                      ? '🪙'
                      : e.type === 'LEVEL_UP'
                        ? '⭐'
                        : '🔥'}
                </span>
                <span>{feedLine(e)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
