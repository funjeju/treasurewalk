'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';
import { Onboarding } from '@/components/onboarding/Onboarding';
import {
  generateJoinCode,
  updateChild,
  updateStepGoals,
} from '@/lib/firebase/families';
import { listActivity } from '@/lib/firebase/activity';
import { normalizeGoals } from '@/lib/gamification/steps';
import { NumberField } from '@/components/kit';
import type { ActivityEvent, StepGoal } from '@/lib/types';

export default function FamilyPage() {
  const t = useTranslations('family');
  const tc = useTranslations('common');
  const { family, children, refreshFamily, loading } = useAuth();
  const th = useTranslations('hud');
  const [feed, setFeed] = useState<ActivityEvent[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [codeBusy, setCodeBusy] = useState<string | null>(null);

  async function issueCode(childId: string, prev?: string | null) {
    if (!family) return;
    setCodeBusy(childId);
    try {
      await generateJoinCode(family.id, childId, prev);
      await refreshFamily();
    } finally {
      setCodeBusy(null);
    }
  }

  const [copied, setCopied] = useState<string | null>(null);
  async function shareCode(childName: string, code: string) {
    const url =
      typeof window !== 'undefined' ? window.location.origin : 'treasurewalk-beta.vercel.app';
    const text = t('shareText', { name: childName, code, url });
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    try {
      if (nav.share) {
        await nav.share({ title: t('joinCode'), text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(code);
        setTimeout(() => setCopied(null), 1800);
      }
    } catch {
      /* 취소/실패 무시 */
    }
  }
  const [goals, setGoals] = useState<StepGoal[]>([]);
  const [goalsSaving, setGoalsSaving] = useState(false);

  useEffect(() => {
    if (family) setGoals(normalizeGoals(family.stepGoals));
  }, [family]);

  async function saveGoals() {
    if (!family) return;
    setGoalsSaving(true);
    try {
      await updateStepGoals(family.id, normalizeGoals(goals));
      await refreshFamily();
    } finally {
      setGoalsSaving(false);
    }
  }
  function setGoal(i: number, key: 'steps' | 'amount', v: number) {
    setGoals((gs) => gs.map((g, idx) => (idx === i ? { ...g, [key]: v } : g)));
  }

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

              {/* 자녀 참여 코드 */}
              <div className="w-full rounded-[14px] border border-[var(--tq-border)] bg-[var(--tq-surface-2)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">🔑 {t('joinCode')}</span>
                  {c.joinCode ? (
                    <span className="tq-pill select-all text-lg font-black tracking-[0.2em]">
                      {c.joinCode}
                    </span>
                  ) : (
                    <span className="text-sm text-[var(--tq-ink-soft)]">
                      {t('joinCodeNone')}
                    </span>
                  )}
                  {c.joinCode && (
                    <button
                      type="button"
                      className="tq-btn tq-btn-primary ml-auto text-sm"
                      onClick={() => shareCode(c.displayName, c.joinCode!)}
                    >
                      📤 {copied === c.joinCode ? t('joinCodeCopied') : t('joinCodeShare')}
                    </button>
                  )}
                  <button
                    type="button"
                    className={`tq-btn tq-btn-secondary text-sm ${c.joinCode ? '' : 'ml-auto'}`}
                    onClick={() => issueCode(c.id, c.joinCode)}
                    disabled={codeBusy === c.id}
                  >
                    {c.joinCode ? t('joinCodeRegen') : t('joinCodeIssue')}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-[var(--tq-ink-soft)]">
                  {t('joinCodeHint')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 걸음 목표 보상 */}
      <section className="tq-panel p-5">
        <h2 className="text-lg font-bold">👟 {th('stepGoalsTitle')}</h2>
        <p className="mb-3 mt-1 text-sm text-[var(--tq-ink-soft)]">{th('stepGoalsDesc')}</p>
        <div className="space-y-2">
          <div className="flex gap-2 text-xs font-bold text-[var(--tq-ink-soft)]">
            <span className="flex-1">{th('goalSteps')}</span>
            <span className="flex-1">{th('goalAmount')} ({tc('krw')})</span>
          </div>
          {goals.map((g, i) => (
            <div key={i} className="flex items-center gap-2">
              <NumberField
                value={g.steps}
                step={1000}
                onChange={(n) => setGoal(i, 'steps', n)}
                className="tq-input flex-1"
                ariaLabel={`${th('goalSteps')} ${i + 1}`}
              />
              <span className="text-[var(--tq-ink-soft)]">→</span>
              <NumberField
                value={g.amount}
                step={100}
                onChange={(n) => setGoal(i, 'amount', n)}
                className="tq-input flex-1"
                ariaLabel={`${th('goalAmount')} ${i + 1}`}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="tq-btn tq-btn-primary mt-3"
          onClick={saveGoals}
          disabled={goalsSaving}
        >
          {tc('save')}
        </button>
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
