/**
 * 근접 정규화 (docs/03 §5).
 * 0 = 차가움(멀다) … 1 = 뜨거움(가깝다).
 */
export const heat = (d: number, near = 10, far = 300): number =>
  Math.max(0, Math.min(1, (far - d) / (far - near)));

/** heat(0~1) → 7세그 근접 미터 인덱스(0~6). */
export const heatSegment = (h: number, segments = 7): number =>
  Math.min(segments - 1, Math.max(0, Math.round(h * (segments - 1))));

/**
 * 근접도 → 햅틱 진동 패턴(ms). 가까울수록 짧고 잦게.
 * navigator.vibrate(pattern) 에 그대로 전달.
 */
export const hapticPattern = (h: number): number[] => {
  if (h <= 0) return [];
  const pulse = Math.round(20 + h * 60); // 20~80ms
  const gap = Math.round(400 - h * 360); // 400~40ms
  return [pulse, gap];
};
