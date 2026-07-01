/**
 * 이동 거리 목표 → 용돈 차등 보상 (GPS 거리 기준, 흔들기 무관).
 * 부모가 가족 단위로 목표/금액을 설정. 자녀가 목표 도달 시 용돈 요청.
 * StepGoal.steps 필드는 이제 "미터(distance)" 를 의미한다(하위호환 위해 필드명 유지).
 */
export interface StepGoal {
  steps: number; // 실제 의미: 미터
  amount: number; // KRW
}

export const DEFAULT_STEP_GOALS: StepGoal[] = [
  { steps: 1000, amount: 500 },
  { steps: 3000, amount: 1000 },
  { steps: 5000, amount: 2000 },
];

/** 목표를 걸음수 오름차순 정규화. */
export function normalizeGoals(goals: StepGoal[] | undefined): StepGoal[] {
  const g = (goals && goals.length ? goals : DEFAULT_STEP_GOALS)
    .filter((x) => x.steps > 0 && x.amount >= 0)
    .sort((a, b) => a.steps - b.steps);
  return g.length ? g : DEFAULT_STEP_GOALS;
}

export interface StepStatus {
  goals: StepGoal[];
  /** 도달한 최고 목표 인덱스 (-1 = 아직) */
  reachedIndex: number;
  /** 현재 획득 가능한 금액 (도달 최고 목표) */
  earnedAmount: number;
  /** 다음 목표 (없으면 null) */
  next: StepGoal | null;
  /** 다음 목표까지 진행도 0~1 */
  progress: number;
}

export function stepStatus(steps: number, goals?: StepGoal[]): StepStatus {
  const g = normalizeGoals(goals);
  let reachedIndex = -1;
  for (let i = 0; i < g.length; i += 1) if (steps >= g[i].steps) reachedIndex = i;

  const earnedAmount = reachedIndex >= 0 ? g[reachedIndex].amount : 0;
  const next = reachedIndex + 1 < g.length ? g[reachedIndex + 1] : null;

  let progress = 1;
  if (next) {
    const prevSteps = reachedIndex >= 0 ? g[reachedIndex].steps : 0;
    progress = Math.max(0, Math.min(1, (steps - prevSteps) / (next.steps - prevSteps)));
  }
  return { goals: g, reachedIndex, earnedAmount, next, progress };
}
