'use client';

import { useMemo } from 'react';

/**
 * 발견 히어로 연출 (docs/05 §3.3) — 순수 SVG/CSS.
 * 탭하면 상자 뚜껑이 열리고 빛기둥·코인 분수·콘페티가 터진다.
 * Rive/Lottie 에셋이 없어도 단독으로 완성되게 설계.
 */
const CONFETTI_COLORS = ['#E8B23A', '#1D9E75', '#D85A30', '#378ADD', '#F2C75A', '#A9ECCE'];

export function TreasureReveal({
  opened,
  onOpen,
}: {
  opened: boolean;
  onOpen: () => void;
}) {
  // 결정적(deterministic) 파티클 파라미터
  const coins = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const spread = (i / 15 - 0.5) * 300; // -150 ~ 150
        return {
          tx: `${spread}px`,
          peak: `${-90 - (Math.abs(spread) < 60 ? 70 : 30) - (i % 3) * 15}px`,
          d: `${(i % 8) * 0.05}s`,
        };
      }),
    [],
  );
  const confetti = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        cx: `${(i / 21 - 0.5) * 320}px`,
        cy: `${140 + (i % 5) * 30}px`,
        cr: `${(i % 2 ? 1 : -1) * (180 + (i % 4) * 90)}deg`,
        d: `${(i % 6) * 0.06}s`,
      })),
    [],
  );
  const sparks = useMemo(
    () =>
      [
        { x: '18%', y: '26%' },
        { x: '80%', y: '30%' },
        { x: '30%', y: '62%' },
        { x: '72%', y: '58%' },
        { x: '50%', y: '14%' },
        { x: '12%', y: '48%' },
      ].map((p, i) => ({ ...p, d: `${i * 0.18}s` })),
    [],
  );

  return (
    <div className="tq-reveal" data-open={opened}>
      <div className="tq-rays" aria-hidden />
      <div className="tq-glowpool" aria-hidden />

      <button
        type="button"
        className="tq-chest-btn"
        data-open={opened}
        onClick={onOpen}
        aria-label="보물 상자 열기"
      >
        <svg viewBox="0 0 190 170" width="190" height="170" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9a6531" />
              <stop offset="1" stopColor="#5e3a17" />
            </linearGradient>
            <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe08a" />
              <stop offset="0.5" stopColor="#e8b23a" />
              <stop offset="1" stopColor="#b97a2e" />
            </linearGradient>
            <radialGradient id="inner" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#fff8d8" />
              <stop offset="0.6" stopColor="#ffd76a" />
              <stop offset="1" stopColor="#ffd76a" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 상자 몸통 */}
          <rect x="15" y="74" width="160" height="86" rx="12" fill="url(#wood)" stroke="#3f2810" strokeWidth="3" />
          {/* 세로 골드 밴드 */}
          <rect x="44" y="74" width="15" height="86" fill="url(#gold)" stroke="#8a5a1f" strokeWidth="1.5" />
          <rect x="131" y="74" width="15" height="86" fill="url(#gold)" stroke="#8a5a1f" strokeWidth="1.5" />
          {/* 바닥 골드 트림 */}
          <rect x="15" y="150" width="160" height="10" rx="5" fill="url(#gold)" opacity="0.9" />

          {/* 열릴 때 드러나는 내부 */}
          <g className="tq-chest-inner">
            <ellipse cx="95" cy="80" rx="66" ry="20" fill="url(#inner)" />
            <circle cx="72" cy="80" r="9" fill="url(#gold)" stroke="#8a5a1f" strokeWidth="1" />
            <circle cx="95" cy="84" r="10" fill="url(#gold)" stroke="#8a5a1f" strokeWidth="1" />
            <circle cx="118" cy="80" r="9" fill="url(#gold)" stroke="#8a5a1f" strokeWidth="1" />
          </g>

          {/* 자물쇠 */}
          <rect x="82" y="104" width="26" height="30" rx="5" fill="url(#gold)" stroke="#8a5a1f" strokeWidth="2" />
          <circle cx="95" cy="115" r="4" fill="#3f2810" />
          <rect x="93" y="115" width="4" height="10" rx="2" fill="#3f2810" />

          {/* 뚜껑 (열림 시 회전) */}
          <g className="tq-lid">
            <path
              d="M15 78 L15 58 Q15 40 37 40 L153 40 Q175 40 175 58 L175 78 Z"
              fill="url(#wood)"
              stroke="#3f2810"
              strokeWidth="3"
            />
            <rect x="15" y="66" width="160" height="12" fill="url(#gold)" stroke="#8a5a1f" strokeWidth="1.5" />
            <rect x="44" y="40" width="15" height="30" fill="url(#gold)" opacity="0.95" />
            <rect x="131" y="40" width="15" height="30" fill="url(#gold)" opacity="0.95" />
          </g>
        </svg>
      </button>

      {opened && (
        <>
          <div className="tq-fountain" aria-hidden>
            {coins.map((c, i) => (
              <span
                key={i}
                className="tq-coin-x"
                style={{ ['--tx' as string]: c.tx, ['--d' as string]: c.d }}
              >
                <span className="tq-coin-y" style={{ ['--peak' as string]: c.peak, ['--d' as string]: c.d }}>
                  <span className="tq-coin-face" />
                </span>
              </span>
            ))}
          </div>

          <div className="tq-confetti" aria-hidden>
            {confetti.map((c, i) => (
              <span
                key={i}
                className="tq-confetti-piece"
                style={{
                  background: c.color,
                  ['--cx' as string]: c.cx,
                  ['--cy' as string]: c.cy,
                  ['--cr' as string]: c.cr,
                  ['--d' as string]: c.d,
                }}
              />
            ))}
          </div>

          {sparks.map((s, i) => (
            <span
              key={i}
              className="tq-spark"
              aria-hidden
              style={{ left: s.x, top: s.y, ['--d' as string]: s.d }}
            >
              ✨
            </span>
          ))}
        </>
      )}
    </div>
  );
}
