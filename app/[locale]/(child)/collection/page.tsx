'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';
import { ChildSwitcher } from '@/components/child/ChildSwitcher';
import { listTreasures } from '@/lib/firebase/treasures';
import { listClaimsForFamily } from '@/lib/firebase/claims';
import type { Claim, Treasure } from '@/lib/types';
import {
  GlassInset,
  GCard,
  CardThumb,
  Stars,
  Segmented,
  SectionTitle,
  type Rarity,
} from '@/components/kit';

/** 보상 금액 → 의사 희귀도/별점 (P1: 데이터 없이 변주). */
function rarityOf(amount: number): { rarity: Rarity; stars: number } {
  if (amount >= 5000) return { rarity: 'legend', stars: 3 };
  if (amount >= 2000) return { rarity: 'epic', stars: 3 };
  if (amount >= 1000) return { rarity: 'rare', stars: 2 };
  return { rarity: 'common', stars: 1 };
}

export default function CollectionPage() {
  const t = useTranslations('collection');
  const tc = useTranslations('common');
  const { family, children, activeChildId } = useAuth();
  const child = children.find((c) => c.id === activeChildId) ?? null;

  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [seg, setSeg] = useState<'all' | 'region' | 'set'>('all');

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

  const visible = useMemo(
    () => treasures.filter((tr) => !tr.assignedChildId || tr.assignedChildId === child?.id),
    [treasures, child],
  );
  const foundCount = visible.filter((tr) => foundIds.has(tr.id)).length;
  const pct = visible.length ? Math.round((foundCount / visible.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <SectionTitle action={<ChildSwitcher />}>📖 {t('title')}</SectionTitle>

      {/* 완성도 요약 */}
      <GlassInset className="flex items-center justify-around p-3 text-center">
        <div>
          <p className="text-xl font-black text-[var(--g-gold)]">
            {foundCount} / {visible.length}
          </p>
          <p className="text-[0.7rem] text-[var(--g-dim)]">{t('found')}</p>
        </div>
        <div>
          <p className="text-xl font-black">{pct}%</p>
          <p className="text-[0.7rem] text-[var(--g-dim)]">{t('title')}</p>
        </div>
        <div>
          <p className="text-xl font-black text-[var(--g-cyan)]">+10%</p>
          <p className="text-[0.7rem] text-[var(--g-dim)]">SET</p>
        </div>
      </GlassInset>

      <Segmented
        value={seg}
        onChange={setSeg}
        options={[
          { value: 'all', label: '전체' },
          { value: 'region', label: '지역별' },
          { value: 'set', label: '세트' },
        ]}
      />

      {loading ? (
        <p className="text-[var(--g-dim)]">{tc('loading')}</p>
      ) : visible.length === 0 ? (
        <p className="py-10 text-center text-[var(--g-dim)]">{t('empty')}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2.5">
          {visible.map((tr) => {
            const found = foundIds.has(tr.id);
            const { rarity, stars } = rarityOf(tr.reward.amount);
            return (
              <li key={tr.id}>
                <GCard rarity={found ? rarity : 'common'} locked={!found}>
                  <CardThumb>
                    {found ? (
                      tr.hintPhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={tr.hintPhotoUrl}
                          alt=""
                          className="h-full w-full rounded-[14px] object-cover"
                        />
                      ) : (
                        '🎁'
                      )
                    ) : (
                      '🔒'
                    )}
                  </CardThumb>
                  <p className="mt-2 truncate text-center text-xs font-bold">
                    {found ? tr.title || t('found') : '???'}
                  </p>
                  <div className="mt-1 flex justify-center">
                    {found ? (
                      <Stars value={stars} />
                    ) : (
                      <span className="text-[0.62rem] text-[var(--g-dim)]">{t('locked')}</span>
                    )}
                  </div>
                </GCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
