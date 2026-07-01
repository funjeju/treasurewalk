'use client';

import { useCallback, useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { listTreasures, deleteTreasure } from '@/lib/firebase/treasures';
import { listClaimsForFamily, payClaim } from '@/lib/firebase/claims';
import type { Child, Claim, Treasure } from '@/lib/types';

export default function DashboardPage() {
  const t = useTranslations('parent');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const format = useFormatter();
  const { family, children, loading } = useAuth();

  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const childById = (id: string): Child | undefined =>
    children.find((c) => c.id === id);

  const load = useCallback(async () => {
    if (!family) return;
    setDataLoading(true);
    try {
      const [tr, cl] = await Promise.all([
        listTreasures(family.id),
        listClaimsForFamily(family.id),
      ]);
      setTreasures(tr);
      setClaims(cl);
    } catch (e) {
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  }, [family]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-[var(--tq-ink-soft)]">{tc('loading')}</p>;
  }

  // 가족/자녀 미생성 → 온보딩
  if (!family || children.length === 0) {
    return <Onboarding />;
  }

  const activeTreasures = treasures.filter((t) => t.status === 'active');
  const foundTreasures = treasures.filter((t) => t.status === 'found');

  async function handlePay(claim: Claim) {
    if (!family) return;
    await payClaim(family.id, claim.treasureId, claim.id, claim.childId);
    await load();
  }

  async function handleDelete(treasureId: string) {
    if (!family) return;
    if (!window.confirm(t('deleteConfirm'))) return;
    await deleteTreasure(family.id, treasureId);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t('dashboardTitle')}</h1>
          <p className="text-[var(--tq-ink-soft)]">
            {t('welcome', { name: family.name })}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href="/family" className="tq-btn tq-btn-secondary">
            👨‍👩‍👧 {tn('family')}
          </Link>
          <Link href="/map" className="tq-btn tq-btn-secondary">
            🧭 {tn('childMode')}
          </Link>
          <Link href="/treasure/new" className="tq-btn tq-btn-primary">
            ➕ {tn('hideTreasure')}
          </Link>
        </div>
      </div>

      {/* 발견 · 요청 현황 */}
      <section className="tq-panel p-5">
        <h2 className="mb-3 text-lg font-bold">{t('claims')}</h2>
        {claims.length === 0 ? (
          <p className="text-[var(--tq-ink-soft)]">{t('noClaims')}</p>
        ) : (
          <ul className="space-y-2">
            {claims.map((claim) => {
              const child = childById(claim.childId);
              const treasure = treasures.find((tr) => tr.id === claim.treasureId);
              const statusLabel =
                claim.status === 'PAID'
                  ? t('statusPaid')
                  : claim.status === 'REQUESTED'
                    ? t('statusRequested')
                    : t('statusFound');
              return (
                <li
                  key={claim.id}
                  className="flex flex-wrap items-center gap-3 rounded-[14px] border border-[var(--tq-border)] bg-[var(--tq-surface-2)] p-3"
                >
                  <span className="font-bold">
                    {child?.displayName ?? '—'}
                  </span>
                  <span className="text-sm text-[var(--tq-ink-soft)]">
                    {treasure?.title || treasure?.id?.slice(0, 6) || '—'}
                  </span>
                  {treasure && (
                    <span className="tq-pill text-sm">
                      🪙{' '}
                      {format.number(treasure.reward.amount)} {tc('krw')}
                    </span>
                  )}
                  <span
                    className={`tq-pill text-sm ${
                      claim.status === 'PAID'
                        ? 'text-[var(--tq-jewel)]'
                        : claim.status === 'REQUESTED'
                          ? 'text-[var(--tq-ruby)]'
                          : ''
                    }`}
                  >
                    {statusLabel}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    {claim.certificateUrl && (
                      <a
                        href={claim.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tq-btn tq-btn-ghost text-sm"
                      >
                        🧾 {t('viewCertificate')}
                      </a>
                    )}
                    {claim.status === 'REQUESTED' && (
                      <button
                        type="button"
                        className="tq-btn tq-btn-primary text-sm"
                        onClick={() => handlePay(claim)}
                      >
                        {t('markPaid')}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 숨겨둔(활성) 보물 — 수정/삭제 가능 */}
      <section className="tq-panel p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <span aria-hidden>🎁</span> {t('activeTreasures')}
          <span className="tq-pill text-xs">{activeTreasures.length}</span>
        </h2>
        {dataLoading ? (
          <p className="text-[var(--tq-ink-soft)]">{tc('loading')}</p>
        ) : activeTreasures.length === 0 ? (
          <p className="text-[var(--tq-ink-soft)]">{t('noTreasures')}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {activeTreasures.map((tr) => (
              <TreasureCard
                key={tr.id}
                tr={tr}
                child={tr.assignedChildId ? childById(tr.assignedChildId) : undefined}
                found={false}
                onDelete={() => handleDelete(tr.id)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* 찾은 보물 — 구분해서 표시 */}
      <section className="tq-panel p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <span aria-hidden>🏁</span> {t('foundTreasures')}
          <span className="tq-pill text-xs">{foundTreasures.length}</span>
        </h2>
        {foundTreasures.length === 0 ? (
          <p className="text-[var(--tq-ink-soft)]">{t('noFoundTreasures')}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {foundTreasures.map((tr) => (
              <TreasureCard
                key={tr.id}
                tr={tr}
                child={tr.assignedChildId ? childById(tr.assignedChildId) : undefined}
                found
                onDelete={() => handleDelete(tr.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );

  function TreasureCard({
    tr,
    child,
    found,
    onDelete,
  }: {
    tr: Treasure;
    child?: Child;
    found: boolean;
    onDelete: () => void;
  }) {
    return (
      <li
        className={`flex gap-3 rounded-[14px] border p-3 ${
          found
            ? 'border-[var(--tq-border)] opacity-80'
            : 'border-[var(--tq-gold)] bg-[var(--tq-surface-2)]'
        }`}
      >
        {tr.hintPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tr.hintPhotoUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-[10px] object-cover"
          />
        ) : (
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[10px] bg-[var(--tq-surface-2)] text-2xl">
            {found ? '🏁' : '🎁'}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate font-bold">{tr.title || tr.id.slice(0, 6)}</p>
          <p className="text-sm text-[var(--tq-ink-soft)]">
            {t('reward')}: {format.number(tr.reward.amount)} {tc('krw')} · {t('radius')}:{' '}
            {tr.radiusM}m
          </p>
          <p className="text-xs">
            <span className="text-[var(--tq-ink-soft)]">
              {t('assignedTo')}: {child?.displayName ?? t('anyChild')}
            </span>{' '}
            <span
              className={`font-bold ${
                found ? 'text-[var(--tq-jewel)]' : 'text-[var(--tq-gold-deep)]'
              }`}
            >
              · {found ? t('statusFound') : t('activeTreasures')}
            </span>
          </p>
          <div className="mt-2 flex gap-2">
            {!found && (
              <Link
                href={`/treasure/${tr.id}/edit`}
                className="tq-btn tq-btn-secondary text-xs"
              >
                ✏️ {t('edit')}
              </Link>
            )}
            <button
              type="button"
              className="tq-btn tq-btn-ghost text-xs text-[var(--tq-ruby)]"
              onClick={onDelete}
            >
              🗑️ {t('delete')}
            </button>
          </div>
        </div>
      </li>
    );
  }
}
