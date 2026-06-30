import type { RewardType } from '@/lib/types';

/**
 * 보상 경제 (docs/02 §4). P1은 FIXED만 실제 동작.
 * 확장 enum: FIXED → DISTANCE_SCALED → STREAK_BONUS.
 */

/** 발견 1건당 적립 코인 (게임 내 화폐). */
export const COIN_PER_FIND = 100;
/** 발견 1건당 적립 XP. */
export const XP_PER_FIND = 50;
/** 걷기 보너스 XP (100걸음당). */
export const XP_PER_100_STEPS = 1;

/**
 * 현실 용돈 금액 계산. P1은 FIXED를 그대로 반환.
 * P2에서 distanceM/streakDays 를 받아 SCALED/BONUS 를 켠다(자리만).
 */
export function computeAllowance(
  type: RewardType,
  baseAmount: number,
  ctx?: { distanceM?: number; streakDays?: number },
): number {
  void ctx; // P2 에서 SCALED/BONUS 계산에 사용 (자리만)
  switch (type) {
    case 'FIXED':
      return baseAmount;
    // TODO(P2): DISTANCE_SCALED / STREAK_BONUS — reward.type 교체만으로 활성.
    case 'DISTANCE_SCALED':
    case 'STREAK_BONUS':
    default:
      return baseAmount;
  }
}

/** 발견 시 적립 묶음. */
export function findReward(stepsToday = 0) {
  return {
    coins: COIN_PER_FIND,
    xp: XP_PER_FIND + Math.floor(stepsToday / 100) * XP_PER_100_STEPS,
  };
}
