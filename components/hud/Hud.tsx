'use client';

import { useTranslations, useFormatter } from 'next-intl';
import type { Child, StepGoal } from '@/lib/types';
import { levelProgress } from '@/lib/gamification/levels';
import { stepStatus } from '@/lib/gamification/steps';
import { formatDistanceM } from '@/lib/geo/format';
import { GlassCard, Avatar, Progress, Icon } from '@/components/kit';

/**
 * 게임 HUD (키트).
 * 상단: 아바타·레벨·XP + (작게) 코인/연속.
 * 하단: 오늘 이동거리(GPS) 강조 — 다음 목표까지 진행 + 획득 용돈.
 */
export function Hud({
  child,
  distanceM,
  goals,
}: {
  child: Child;
  distanceM: number;
  goals?: StepGoal[];
}) {
  const t = useTranslations('common');
  const th = useTranslations('hud');
  const format = useFormatter();
  const progress = levelProgress(child.xp);
  const st = stepStatus(distanceM, goals); // goals.steps = 미터

  return (
    <div className="space-y-2">
      {/* 프로필 라인 — 코인/연속은 작게 */}
      <GlassCard className="p-3">
        <div className="flex items-center gap-3">
          <Avatar size={44} level={child.level}>
            <Icon name="avatar" size={24} />
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-extrabold">{child.displayName}</p>
            <Progress value={progress} className="mt-1" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--g-dim)]">
              <Icon name="coin" size={15} /> {child.coins.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--g-dim)]">
              <Icon name="streak" size={15} /> {child.streakDays}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* 오늘 이동거리 — 강조 */}
      <GlassCard className="p-3">
        <div className="flex items-center gap-3">
          <span className="g-orb g-orb-steps g-orb-lg shrink-0">
            <Icon name="steps" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black leading-none">
                {formatDistanceM(distanceM)}
              </span>
              <span className="text-xs font-bold text-[var(--g-dim)]">
                {th('todayDistance')}
              </span>
              {st.earnedAmount > 0 && (
                <span className="g-chip g-chip-gold ml-auto">
                  <Icon name="coin" size={13} /> +{format.number(st.earnedAmount)}
                  {t('krw')}
                </span>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <Progress value={st.progress} className="flex-1" />
              <span className="shrink-0 text-[0.68rem] font-bold text-[var(--g-dim)]">
                {st.next
                  ? th('nextReward', {
                      dist: formatDistanceM(st.next.steps),
                      amount: format.number(st.next.amount),
                    })
                  : th('maxGoal')}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
