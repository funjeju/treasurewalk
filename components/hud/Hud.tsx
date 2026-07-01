'use client';

import { useTranslations, useFormatter } from 'next-intl';
import type { Child, StepGoal } from '@/lib/types';
import { levelProgress } from '@/lib/gamification/levels';
import { stepStatus } from '@/lib/gamification/steps';
import { GlassCard, Avatar, Progress, Icon } from '@/components/kit';

/**
 * 게임 HUD (키트).
 * 상단: 아바타·레벨·XP + (작게) 코인/연속.
 * 하단: 만보기 섹션을 한 줄로 크게 강조 — 오늘 걸음 · 다음 목표 · 목표별 용돈.
 */
export function Hud({
  child,
  steps,
  goals,
  stepsActive,
  needsPermission,
  onStartSteps,
}: {
  child: Child;
  steps: number;
  goals?: StepGoal[];
  stepsActive: boolean;
  needsPermission: boolean;
  onStartSteps: () => void;
}) {
  const t = useTranslations('common');
  const th = useTranslations('hud');
  const format = useFormatter();
  const progress = levelProgress(child.xp);
  const st = stepStatus(steps, goals);

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

      {/* 만보기 섹션 — 강조 */}
      <GlassCard className="p-3">
        <div className="flex items-center gap-3">
          <span className="g-orb g-orb-steps g-orb-lg shrink-0">
            <Icon name="steps" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black leading-none">
                {steps.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-[var(--g-dim)]">{t('steps')}</span>
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
                      steps: format.number(st.next.steps),
                      amount: format.number(st.next.amount),
                    })
                  : th('maxGoal')}
              </span>
            </div>
          </div>
        </div>

        {/* 측정 시작 (iOS 모션 권한은 사용자 제스처 필요) */}
        {!stepsActive && (
          <div className="mt-3">
            <button
              type="button"
              className="g-btn g-btn-gold g-btn-sm g-btn-block"
              onClick={onStartSteps}
            >
              <Icon name="steps" size={16} /> {th('startCounter')}
            </button>
            {needsPermission && (
              <p className="mt-1.5 text-center text-[0.7rem] text-[var(--g-red)]">
                {th('permissionDenied')}
              </p>
            )}
          </div>
        )}
        {stepsActive && (
          <p className="mt-2 flex items-center justify-center gap-1 text-[0.72rem] font-bold text-[var(--g-green)]">
            <span className="tq-pulse inline-block h-2 w-2 rounded-full bg-[var(--g-green)]" />
            {th('counting')}
          </p>
        )}
      </GlassCard>
    </div>
  );
}
