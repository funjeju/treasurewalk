'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type { RouletteItem } from '@/lib/types';
import { GButton, Icon } from '@/components/kit';

const COLORS = ['#E8B23A', '#1D9E75', '#4D8DFF', '#9B6CFF', '#D85A30', '#43D6C4'];
const R = 95;
const CX = 100;
const CY = 100;

// 시계각(0=위, 시계방향) → SVG 좌표
function pt(theta: number, radius = R) {
  const rad = (theta * Math.PI) / 180;
  return [CX + radius * Math.sin(rad), CY - radius * Math.cos(rad)] as const;
}

function slicePath(a1: number, a2: number) {
  const [x1, y1] = pt(a1);
  const [x2, y2] = pt(a2);
  const large = a2 - a1 > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
}

/**
 * 룰렛 휠 — 상품 3~6칸. 돌리면 무작위 당첨.
 * predetermined 가 있으면(이미 뽑은 경우) 애니메이션 없이 그 칸을 위에 고정.
 */
export function Roulette({
  items,
  predetermined,
  onResult,
}: {
  items: RouletteItem[];
  predetermined?: number | null;
  onResult: (index: number) => void;
}) {
  const t = useTranslations('discover');
  const format = useFormatter();
  const tc = useTranslations('common');
  const n = items.length;
  const seg = 360 / n;

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(predetermined != null);
  const chosen = useRef<number | null>(predetermined ?? null);

  // 이미 뽑은 경우: 해당 칸을 위(0°)에 오도록 고정
  useEffect(() => {
    if (predetermined != null) {
      const center = predetermined * seg + seg / 2;
      setRotation(-center);
      chosen.current = predetermined;
      setDone(true);
    }
  }, [predetermined, seg]);

  const endedRef = useRef(false);

  function finish() {
    if (endedRef.current) return;
    endedRef.current = true;
    setSpinning(false);
    setDone(true);
    if (chosen.current != null) onResult(chosen.current);
  }

  function spin() {
    if (spinning || done) return;
    const winner = Math.floor(Math.random() * n);
    chosen.current = winner;
    endedRef.current = false;
    const center = winner * seg + seg / 2;
    // 최종 회전: 여러 바퀴 + 당첨 칸을 위로
    const target = 360 * 6 - center + (Math.random() * seg * 0.5 - seg * 0.25);
    setSpinning(true); // 먼저 transition 활성화
    // 다음 프레임에 회전값 변경 → CSS transition 이 실제로 발동
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setRotation((r) => {
          const base = ((r % 360) + 360) % 360;
          return r - base + target;
        }),
      ),
    );
    // 안전장치: transitionend 누락 대비 (transition 4s)
    window.setTimeout(finish, 4300);
  }

  function handleEnd() {
    finish();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 260, height: 260 }}>
        {/* 포인터 */}
        <div
          aria-hidden
          className="absolute left-1/2 top-[-2px] z-10 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: '20px solid var(--g-gold)',
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.5))',
          }}
        />
        <svg
          viewBox="0 0 200 200"
          width={260}
          height={260}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.15,0.6,0.2,1)' : 'none',
            filter: 'drop-shadow(0 6px 16px rgba(0,0,0,.5))',
          }}
          onTransitionEnd={handleEnd}
        >
          <circle cx={CX} cy={CY} r={R + 3} fill="#f6d98a" />
          {items.map((it, i) => {
            const a1 = i * seg;
            const a2 = (i + 1) * seg;
            const [lx, ly] = pt(a1 + seg / 2, R * 0.62);
            const color = COLORS[i % COLORS.length];
            return (
              <g key={i}>
                <path d={slicePath(a1, a2)} fill={color} stroke="#fff" strokeWidth={1.5} />
                <text
                  x={lx}
                  y={ly}
                  fill="#fff"
                  fontSize={n > 4 ? 9 : 11}
                  fontWeight="800"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${a1 + seg / 2}, ${lx}, ${ly})`}
                  style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,.35)', strokeWidth: 2 }}
                >
                  {it.label.length > 6 ? it.label.slice(0, 6) : it.label}
                </text>
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r={12} fill="#fff" stroke="#c9a13a" strokeWidth={3} />
        </svg>
      </div>

      {!done ? (
        <GButton variant="gold" onClick={spin} disabled={spinning}>
          <Icon name="target" size={18} /> {spinning ? t('spinning') : t('spin')}
        </GButton>
      ) : (
        chosen.current != null && (
          <div className="tq-pop text-center">
            <p className="text-sm font-bold text-[var(--g-dim)]">{t('youWon')}</p>
            <p className="text-2xl font-black text-[var(--g-gold)]">
              {items[chosen.current].label}
            </p>
            {items[chosen.current].amount > 0 && (
              <p className="g-chip g-chip-gold mt-1">
                <Icon name="coin" size={13} /> +
                {format.number(items[chosen.current].amount)}
                {tc('krw')}
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}
