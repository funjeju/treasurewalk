'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

/**
 * 코인 분수 / 콘페티 (docs/05 §7, 1회성).
 * 에셋(/assets/fx/coin-burst.json)이 있으면 Lottie, 없으면 CSS 코인 폴백.
 */
const LOTTIE_SRC = '/assets/fx/coin-burst.json';

export function RewardBurst({ play }: { play: boolean }) {
  const [data, setData] = useState<object | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(LOTTIE_SRC)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (alive) {
          setData(json);
          setChecked(true);
        }
      })
      .catch(() => {
        if (alive) setChecked(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!play) return null;

  if (checked && data) {
    return (
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <Lottie animationData={data} loop={false} style={{ width: 320 }} />
      </div>
    );
  }

  // CSS 폴백: 코인 분수
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="absolute text-2xl tq-float-up"
          style={{
            left: `${10 + (i * 80) / 18}%`,
            bottom: '30%',
            animationDelay: `${(i % 6) * 0.08}s`,
          }}
        >
          🪙
        </span>
      ))}
    </div>
  );
}
