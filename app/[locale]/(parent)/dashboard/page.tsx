'use client';

import { useCallback, useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { listTreasures, deleteTreasure } from '@/lib/firebase/treasures';
import { listAllowanceRequests, payAllowance } from '@/lib/firebase/allowance';
import type { AllowanceRequest, Child, Treasure } from '@/lib/types';

export default function DashboardPage() {
  const t = useTranslations('parent');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const format = useFormatter();
  const { family, children, loading } = useAuth();

  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const [requests, setRequests] = useState<AllowanceRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const childById = (id: string): Child | undefined =>
    children.find((c) => c.id === id);

  const load = useCallback(async () => {
    if (!family) return;
    setDataLoading(true);
    try {
      const [tr, rq] = await Promise.all([
        listTreasures(family.id),
        listAllowanceRequests(family.id),
      ]);
      setTreasures(tr);
      setRequests(rq);
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

  async function handlePay(req: AllowanceRequest) {
    if (!family) return;
    await payAllowance(family.id, req);
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
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t('dashboardTitle')}</h1>
          <p className="text-[var(--tq-ink-soft)]">
            {t('welcome', { name: family.name })}
          </p>
        </div>
        {/* 모바일: 보물 숨기기 전면 + 보조 2개 / 데스크톱: 우측 인라인 */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link
            href="/treasure/new"
            className="tq-btn tq-btn-primary justify-center whitespace-nowrap sm:order-last"
          >
            ➕ {tn('hideTreasure')}
          </Link>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Link
              href="/family"
              className="tq-btn tq-btn-secondary justify-center whitespace-nowrap"
            >
              👨‍👩‍👧 {tn('family')}
            </Link>
            <Link
              href="/map"
              className="tq-btn tq-btn-secondary justify-center whitespace-nowrap"
            >
              🧭 {tn('childMode')}
            </Link>
          </div>
        </div>
      </div>

      {/* 용돈 요청 (보물+걸음 합산) */}
      <section className="tq-panel p-5">
        <h2 className="mb-3 text-lg font-bold">💰 {t('allowanceRequests')}</h2>
        {requests.filter((r) => r.status === 'REQUESTED').length === 0 ? (
          <p className="text-[var(--tq-ink-soft)]">{t('noRequests')}</p>
        ) : (
          <ul className="space-y-2">
            {requests
              .filter((r) => r.status === 'REQUESTED')
              .map((req) => {
                const child = childById(req.childId);
                return (
                  <li
                    key={req.id}
                    className="rounded-[14px] border border-[var(--tq-gold)] bg-[var(--tq-surface-2)] p-3"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold">{child?.displayName ?? '—'}</span>
                      <span className="tq-pill text-base font-extrabold">
                        🪙 {format.number(req.total)} {tc('krw')}
                      </span>
                      <button
                        type="button"
                        className="tq-btn tq-btn-primary ml-auto text-sm"
                        onClick={() => handlePay(req)}
                      >
                        {t('markPaid')}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-[var(--tq-ink-soft)]">
                      🎁 {t('reward')} {format.number(req.treasureAmount)}
                      {tc('krw')}
                      {req.stepAmount > 0 && (
                        <>
                          {' · '}👟 {format.number(req.stepsAtRequest)} {tc('steps')}{' '}
                          {format.number(req.stepAmount)}
                          {tc('krw')}
                        </>
                      )}
                    </p>
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
          <p className="text-xs text-[var(--tq-ink-soft)]">
            {t('assignedTo')}: {child?.displayName ?? t('anyChild')}
            {found && (
              <span className="font-bold text-[var(--tq-jewel)]"> · {t('statusFound')}</span>
            )}
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
