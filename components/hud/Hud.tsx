'use client';

import { useTranslations } from 'next-intl';
import type { Child } from '@/lib/types';
import { levelProgress } from '@/lib/gamification/levels';

/** 코인·레벨·스트릭·걸음 pill 묶음 (docs/05 §5). */
export function Hud({ child, steps }: { child: Child; steps: number }) {
  const t = useTranslations('common');
  const progress = levelProgress(child.xp);

  return (
    <div className="tq-hud-bar">
      <span className="tq-stat" title={t('level')}>
        <span className="tq-stat-ico tq-ico-level" aria-hidden>
          ⭐
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[0.65rem] font-bold text-[var(--tq-ink-soft)]">
            {t('level')}
          </span>
          <span className="flex items-center gap-1">
            {child.level}
            <span
              className="h-1.5 w-9 overflow-hidden rounded-full bg-[var(--tq-fog)]"
              aria-hidden
            >
              <span
                className="block h-full rounded-full bg-[var(--tq-gold)]"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </span>
          </span>
        </span>
      </span>

      <span className="tq-stat" title={t('coin')}>
        <span className="tq-stat-ico tq-ico-coin" aria-hidden>
          🪙
        </span>
        {child.coins.toLocaleString()}
      </span>

      <span className="tq-stat" title={t('streak')}>
        <span className="tq-stat-ico tq-ico-streak" aria-hidden>
          🔥
        </span>
        {child.streakDays}
      </span>

      <span className="tq-stat" title={t('steps')}>
        <span className="tq-stat-ico tq-ico-steps" aria-hidden>
          👟
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[0.65rem] font-bold text-[var(--tq-ink-soft)]">
            {t('steps')}
          </span>
          {steps.toLocaleString()}
        </span>
      </span>
    </div>
  );
}
