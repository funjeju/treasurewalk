'use client';

import dynamic from 'next/dynamic';
import type { GameMapProps } from './GameMap';

/** SSR 비활성 래퍼 — maplibre는 브라우저 전용. */
const GameMapInner = dynamic(
  () => import('./GameMap').then((m) => m.GameMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center rounded-[18px] bg-[var(--tq-surface-2)] text-[var(--tq-ink-soft)]">
        🗺️
      </div>
    ),
  },
);

export function GameMapDynamic(props: GameMapProps) {
  return <GameMapInner {...props} />;
}
