/**
 * 레벨/XP 곡선 (docs/02 §4). 단순 누적, 확장 자리만.
 */

/** 다음 레벨까지 필요한 누적 XP. */
export const xpForLevel = (level: number): number => 100 * level * (level + 1);

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level)) level += 1;
  return level;
}

/** 현재 레벨 진행도 0~1 (HUD 진행바). */
export function levelProgress(xp: number): number {
  const level = levelFromXp(xp);
  const prev = level > 1 ? xpForLevel(level - 1) : 0;
  const next = xpForLevel(level);
  if (next === prev) return 0;
  return Math.max(0, Math.min(1, (xp - prev) / (next - prev)));
}
