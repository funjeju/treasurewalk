/** 미터 → 사람이 읽는 거리 문자열. */
export function formatDistanceM(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(m < 10000 ? 2 : 1)}km`;
}
