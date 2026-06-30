'use client';

import { useEffect, useState } from 'react';
import { useRive } from '@rive-app/react-canvas';

/**
 * 보물 상자 (docs/05 §5, §7).
 * 에셋(/assets/chest/chest.riv)이 있으면 Rive 상태머신, 없으면 CSS 폴백.
 * docs/05: 이미지 에셋은 사용자가 공급 → placeholder 위에 조립.
 */
const RIVE_SRC = '/assets/chest/chest.riv';

export function TreasureChest({
  opened,
  onOpen,
}: {
  opened: boolean;
  onOpen: () => void;
}) {
  const [assetReady, setAssetReady] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(RIVE_SRC, { method: 'HEAD' })
      .then((r) => alive && setAssetReady(r.ok))
      .catch(() => alive && setAssetReady(false));
    return () => {
      alive = false;
    };
  }, []);

  if (assetReady === true) {
    return <RiveChest opened={opened} onOpen={onOpen} />;
  }
  return <CssChest opened={opened} onOpen={onOpen} />;
}

function RiveChest({ opened, onOpen }: { opened: boolean; onOpen: () => void }) {
  const { RiveComponent, rive } = useRive({
    src: RIVE_SRC,
    autoplay: true,
    stateMachines: 'State Machine 1',
  });

  useEffect(() => {
    if (opened && rive) {
      const inputs = rive.stateMachineInputs('State Machine 1');
      inputs?.find((i) => i.name === 'open')?.fire?.();
    }
  }, [opened, rive]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="grid h-64 w-64 place-items-center"
      aria-label="treasure chest"
    >
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </button>
  );
}

function CssChest({ opened, onOpen }: { opened: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={opened}
      className="relative grid h-64 w-64 place-items-center"
      aria-label="treasure chest"
      style={{ background: 'none', border: 'none' }}
    >
      <span
        aria-hidden
        className="select-none transition-transform duration-300"
        style={{
          fontSize: 150,
          transform: opened ? 'scale(1.15) rotate(-4deg)' : 'scale(1)',
          filter: opened
            ? 'drop-shadow(0 0 24px var(--tq-gold))'
            : 'drop-shadow(0 6px 10px rgba(0,0,0,.25))',
        }}
      >
        {opened ? '🎉' : '🎁'}
      </span>
      {!opened && (
        <span
          className="absolute -bottom-2 animate-bounce text-sm font-bold text-[var(--tq-gold-deep)]"
          aria-hidden
        >
          ▲
        </span>
      )}
    </button>
  );
}
