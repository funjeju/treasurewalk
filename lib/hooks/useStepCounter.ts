'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 간이 만보기 (docs/04 §3.2). DeviceMotion 가속도 피크 검출.
 * 백그라운드 추적 없음. 미지원/미허용 시 0 유지.
 * 오늘 걸음 수는 날짜+childId 키로 localStorage 에 누적.
 */
const today = () => new Date().toISOString().slice(0, 10);
const key = (childId: string) => `tq.steps.${childId}.${today()}`;

interface MotionWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export function useStepCounter(childId: string | null) {
  const [steps, setSteps] = useState(0);
  const [active, setActive] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const lastPeak = useRef(0);
  const lastMag = useRef(0);

  // 저장된 오늘 걸음 복원
  useEffect(() => {
    if (!childId || typeof window === 'undefined') return;
    const saved = Number(localStorage.getItem(key(childId)) ?? '0');
    setSteps(Number.isFinite(saved) ? saved : 0);
  }, [childId]);

  const persist = useCallback(
    (n: number) => {
      if (childId && typeof window !== 'undefined') {
        localStorage.setItem(key(childId), String(n));
      }
    },
    [childId],
  );

  const onMotion = useCallback(
    (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      const now = Date.now();
      // 피크 임계 + 디바운스(>300ms) — 흔들기 노이즈 억제
      if (mag - lastMag.current > 3.2 && now - lastPeak.current > 300) {
        lastPeak.current = now;
        setSteps((s) => {
          const n = s + 1;
          persist(n);
          return n;
        });
      }
      lastMag.current = mag;
    },
    [persist],
  );

  const start = useCallback(async () => {
    if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') {
      return;
    }
    const dm = DeviceMotionEvent as unknown as MotionWithPermission;
    if (typeof dm.requestPermission === 'function') {
      try {
        const res = await dm.requestPermission();
        if (res !== 'granted') {
          setNeedsPermission(true);
          return;
        }
      } catch {
        setNeedsPermission(true);
        return;
      }
    }
    window.addEventListener('devicemotion', onMotion);
    setActive(true);
  }, [onMotion]);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', onMotion);
    }
    setActive(false);
  }, [onMotion]);

  useEffect(() => () => stop(), [stop]);

  return { steps, active, needsPermission, start, stop };
}
