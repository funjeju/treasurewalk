'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 간이 만보기 (docs/04 §3.2). DeviceMotion 기반.
 * 알고리즘: 가속도 크기 → 중력 저역통과(low-pass) 제거 → 걸음 진동만 남긴 뒤
 * 히스테리시스 피크 검출(위 임계 넘고 다시 아래 임계로 내려오면 1걸음).
 * 연속 샘플 차이만 보던 이전 방식이 부드러운 걸음을 놓치던 문제 수정.
 * 백그라운드 추적 없음. 미지원/미허용 시 0 유지.
 * 오늘 걸음은 날짜+childId 키로 localStorage 누적.
 */
const today = () => new Date().toISOString().slice(0, 10);
const key = (childId: string) => `tq.steps.${childId}.${today()}`;

// 걸음 진동(선형가속도, m/s²) 히스테리시스 임계
const HI = 1.1;
const LO = -0.6;
const MIN_STEP_MS = 250; // 최대 ~4걸음/초

interface MotionWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export function useStepCounter(childId: string | null) {
  const [steps, setSteps] = useState(0);
  const [active, setActive] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);

  const gravity = useRef<number | null>(null);
  const armed = useRef(false);
  const lastStep = useRef(0);

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

      // 중력 저역통과 추정 → 제거 = 걸음 진동
      gravity.current = gravity.current == null ? mag : gravity.current * 0.9 + mag * 0.1;
      const linear = mag - gravity.current;

      const now = Date.now();
      if (!armed.current) {
        if (linear > HI) armed.current = true;
      } else if (linear < LO) {
        // 위 임계 → 아래 임계 하강 = 1걸음 (최소 간격으로 노이즈/중복 제거)
        armed.current = false;
        const dt = now - lastStep.current;
        if (lastStep.current === 0 || dt > MIN_STEP_MS) {
          lastStep.current = now;
          setSteps((s) => {
            const n = s + 1;
            persist(n);
            return n;
          });
        }
      }
    },
    [persist],
  );

  const start = useCallback(async () => {
    if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') {
      setNeedsPermission(true);
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
    setNeedsPermission(false);
    gravity.current = null;
    armed.current = false;
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
