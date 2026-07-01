'use client';

import { useTranslations } from 'next-intl';
import type { Child } from '@/lib/types';
import { levelProgress, levelFromXp, xpForLevel } from '@/lib/gamification/levels';
import { GlassCard, Avatar, Progress, Stat, Icon } from '@/components/kit';

/** 게임 HUD (키트) — 아바타·레벨·XP바 + 코인/스트릭/걸음 (docs/05 §5). */
export function Hud({ child, steps }: { child: Child; steps: number }) {
  const t = useTranslations('common');
  const progress = levelProgress(child.xp);
  const level = levelFromXp(child.xp);
  const nextXp = xpForLevel(level);

  return (
    <GlassCard className="p-3">
      <div className="flex items-center gap-3">
        <Avatar size={46} level={child.level}>
          <Icon name="avatar" size={26} />
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold">{child.displayName}</p>
          <div className="mt-1 flex items-center gap-2">
            <Progress value={progress} className="flex-1" />
            <span className="shrink-0 text-[0.65rem] text-[var(--g-dim)]">
              {child.xp.toLocaleString()}/{nextXp.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Stat variant="gold" icon={<Icon name="coin" size={17} />} value={child.coins.toLocaleString()} />
        <Stat variant="streak" icon={<Icon name="streak" size={17} />} label={t('streak')} value={child.streakDays} />
        <Stat variant="steps" icon={<Icon name="steps" size={17} />} label={t('steps')} value={steps.toLocaleString()} />
      </div>
    </GlassCard>
  );
}
