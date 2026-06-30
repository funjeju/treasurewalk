'use client';

import { useTranslations } from 'next-intl';
import type { Child } from '@/lib/types';
import { levelProgress } from '@/lib/gamification/levels';

/** 코인·레벨·스트릭·걸음 pill 묶음 (docs/05 §5). */
export function Hud({ child, steps }: { child: Child; steps: number }) {
  const t = useTranslations('common');
  const progress = levelProgress(child.xp);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="tq-pill" title={t('level')}>
        <span aria-hidden>⭐</span>
        {t('level')} {child.level}
        <span
          className="ml-1 h-1.5 w-10 overflow-hidden rounded-full bg-[var(--tq-fog)]"
          aria-hidden
        >
          <span
            className="block h-full bg-[var(--tq-gold)]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </span>
      </span>
      <span className="tq-pill" title={t('coin')}>
        <span aria-hidden>🪙</span>
        {child.coins.toLocaleString()}
      </span>
      <span className="tq-pill" title={t('streak')}>
        <span aria-hidden>🔥</span>
        {child.streakDays}
      </span>
      <span className="tq-pill" title={t('steps')}>
        <span aria-hidden>👟</span>
        {steps.toLocaleString()} {t('steps')}
      </span>
    </div>
  );
}
