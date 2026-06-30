import type { GeoPoint } from '@/lib/types';
import { distanceM } from './haversine';

/** 반경 진입 판정 (docs/03 §5). */
export const isInside = (cur: GeoPoint, target: GeoPoint, radiusM: number): boolean =>
  distanceM(cur, target) <= radiusM;
