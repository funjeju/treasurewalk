'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { ChildSwitcher } from '@/components/child/ChildSwitcher';
import { listTreasures } from '@/lib/firebase/treasures';
import { listClaimsForFamily } from '@/lib/firebase/claims';
import type { Claim, Treasure } from '@/lib/types';

export default function CollectionPage() {
  const t = useTranslations('collection');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const { family, children, activeChildId } = useAuth();
  const child = children.find((c) => c.id === activeChildId) ?? null;

  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!family) return;
    setLoading(true);
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
      setLoading(false);
    }
  }, [family]);

  useEffect(() => {
    load();
  }, [load]);

  const foundIds = useMemo(() => {
    const set = new Set<string>();
    claims
      .filter((c) => !child || c.childId === child.id)
      .forEach((c) => set.add(c.treasureId));
    return set;
  }, [claims, child]);

  // 자녀 대상(또는 공통) 보물만 도감에 노출
  const visible = useMemo(
    () =>
      treasures.filter(
        (tr) => !tr.assignedChildId || tr.assignedChildId === child?.id,
      ),
    [treasures, child],
  );

  const foundCount = visible.filter((tr) => foundIds.has(tr.id)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-extrabold">📖 {t('title')}</h1>
        <ChildSwitcher />
        <div className="ml-auto">
          <Link href="/map" className="tq-btn tq-btn-secondary text-sm">
            🧭 {tn('map')}
          </Link>
        </div>
      </div>

      {visible.length > 0 && (
        <p className="tq-pill">
          {t('total', { found: foundCount, total: visible.length })}
        </p>
      )}

      {loading ? (
        <p className="text-[var(--tq-ink-soft)]">{tc('loading')}</p>
      ) : visible.length === 0 ? (
        <p className="text-center text-[var(--tq-ink-soft)]">{t('empty')}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((tr) => {
            const found = foundIds.has(tr.id);
            return (
              <li
                key={tr.id}
                className={`tq-panel relative aspect-[3/4] overflow-hidden p-0 ${
                  found ? '' : 'opacity-70'
                }`}
              >
                {found && tr.hintPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tr.hintPhotoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-[var(--tq-surface-2)] text-4xl">
                    {found ? '🎁' : '❓'}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/45 p-2 text-center text-sm font-bold text-white">
                  {found ? (
                    <span>✓ {tr.title || t('found')}</span>
                  ) : (
                    <span>🔒 {t('locked')}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
