'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GeoPoint } from '@/lib/types';
import { distanceM as dist } from '@/lib/geo/haversine';
import { appendTrackPoint, getTrack } from '@/lib/firebase/tracks';

const today = () => new Date().toISOString().slice(0, 10);

// GPS 노이즈/점프 필터
const NOISE_FLOOR_M = 4; // 이보다 작으면 지터로 보고 무시
const JUMP_MAX_M = 150; // 한 틱에 이보다 크면 오류로 보고 무시
const PERSIST_EVERY_M = 12; // 이만큼 이동할 때마다 서버에 기록

/**
 * GPS 거리·동선 트래커. 흔들기 무관(실제 이동만 카운트).
 * position(useGeolocation) 변화를 받아 거리 누적 + 동선 기록 + 서버 저장.
 */
export function useRouteTracker(
  familyId: string | null,
  childId: string | null,
  position: GeoPoint | null,
  enabled: boolean,
) {
  const [distanceM, setDistanceM] = useState(0);
  const [path, setPath] = useState<GeoPoint[]>([]);

  const lastPoint = useRef<GeoPoint | null>(null);
  const lastPersisted = useRef<GeoPoint | null>(null);
  const pendingM = useRef(0);
  const loadedFor = useRef<string>('');

  // 오늘 트랙 복원
  useEffect(() => {
    if (!familyId || !childId) return;
    const k = `${familyId}/${childId}/${today()}`;
    if (loadedFor.current === k) return;
    loadedFor.current = k;
    getTrack(familyId, childId, today())
      .then((tr) => {
        if (tr) {
          setDistanceM(tr.distanceM);
          setPath(tr.points.map((p) => ({ lat: p.lat, lng: p.lng })));
          const last = tr.points[tr.points.length - 1];
          if (last) lastPersisted.current = { lat: last.lat, lng: last.lng };
        }
      })
      .catch(console.error);
  }, [familyId, childId]);

  useEffect(() => {
    if (!enabled || !position || !familyId || !childId) return;
    const prev = lastPoint.current;
    lastPoint.current = position;
    if (!prev) {
      setPath((p) => (p.length ? p : [position]));
      return;
    }
    const d = dist(prev, position);
    if (d < NOISE_FLOOR_M || d > JUMP_MAX_M) return; // 지터/점프 무시

    setDistanceM((v) => v + d);
    setPath((p) => [...p, position]);

    // 서버 저장(스로틀)
    pendingM.current += d;
    const base = lastPersisted.current;
    if (!base || dist(base, position) >= PERSIST_EVERY_M) {
      const delta = pendingM.current;
      pendingM.current = 0;
      lastPersisted.current = position;
      appendTrackPoint(familyId, childId, today(), position, delta).catch(
        console.error,
      );
    }
  }, [position, enabled, familyId, childId]);

  const reset = useCallback(() => {
    setDistanceM(0);
    setPath([]);
    lastPoint.current = null;
    lastPersisted.current = null;
    pendingM.current = 0;
  }, []);

  return { distanceM, path, reset };
}
