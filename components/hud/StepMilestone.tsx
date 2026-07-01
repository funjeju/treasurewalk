'use client';

import { useEffect } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Icon } from '@/components/kit';
import { formatDistanceM } from '@/lib/geo/format';

export interface Milestone {
  distanceM: number;
  amount: number;
}

/** 걸음 목표 달성 순간 잠깐 뜨는 축하 팝업 (자동 사라짐). */
export function StepMilestone({
  milestone,
  onDone,
}: {
  milestone: Milestone | null;
  onDone: () => void;
}) {
  const th = useTranslations('hud');
  const tc = useTranslations('common');
  const format = useFormatter();

  useEffect(() => {
    if (!milestone) return;
    navigator.vibrate?.([40, 30, 80, 30, 160]);
    const id = setTimeout(onDone, 3200);
    return () => clearTimeout(id);
  }, [milestone, onDone]);

  if (!milestone) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-6">
      <div className="glass tq-pop relative overflow-hidden px-8 py-6 text-center">
        {/* 반짝임 */}
        {['12%', '82%', '20%', '76%'].map((x, i) => (
          <span
            key={i}
            className="tq-spark absolute"
            style={{ left: x, top: i < 2 ? '14%' : '76%', ['--d' as string]: `${i * 0.15}s` }}
            aria-hidden
          >
            ✨
          </span>
        ))}
        <div className="text-5xl">🎉</div>
        <p className="mt-2 text-xl font-black">
          {th('goalReached', { dist: formatDistanceM(milestone.distanceM) })}
        </p>
        <p className="tq-amount mt-1 text-3xl">
          <Icon name="coin" size={22} /> +{format.number(milestone.amount)}
          {tc('krw')}
        </p>
      </div>
    </div>
  );
}
