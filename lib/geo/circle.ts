import type { GeoPoint } from '@/lib/types';

/**
 * 중심 + 반경(미터)으로 근사 원형 폴리곤 GeoJSON 생성 (지오펜스 시각화).
 * turf 없이 단순 구면 근사.
 */
export function circlePolygon(
  center: GeoPoint,
  radiusM: number,
  steps = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const dLat = radiusM / 111320; // 위도 1도 ≈ 111.32km
  const dLng = radiusM / (111320 * Math.cos((center.lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i += 1) {
    const theta = (i / steps) * 2 * Math.PI;
    coords.push([
      center.lng + dLng * Math.cos(theta),
      center.lat + dLat * Math.sin(theta),
    ]);
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coords] },
  };
}
