'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GeoPoint } from '@/lib/types';

export type GeoStatus = 'idle' | 'watching' | 'denied' | 'unsupported' | 'error';

export interface GeoState {
  position: GeoPoint | null;
  accuracy: number | null;
  status: GeoStatus;
}

/**
 * 포그라운드 watchPosition (docs/03 §5). enabled=true 일 때만 시작.
 * 백그라운드 추적 안 함 (docs/07 A.4).
 * TODO(verify): 백그라운드 위치 OS별 동작·배터리·정책 — 출시 시 실측 필요.
 */
export function useGeolocation(enabled: boolean): GeoState {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [status, setStatus] = useState<GeoStatus>('idle');
  const watchId = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      setStatus('idle');
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      return;
    }
    setStatus('watching');
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
        setStatus('watching');
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
    return stop;
  }, [enabled, stop]);

  return { position, accuracy, status };
}
