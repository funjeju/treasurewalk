'use client';

import { useTranslations } from 'next-intl';
import { heat, heatSegment } from '@/lib/geo/proximity';

const SEGMENTS = 7;
// cool → hot 램프 (docs/05 §3 의미색)
const RAMP = [
  '#85B7EB',
  '#7FB0C9',
  '#A9C08A',
  '#EFCB5A',
  '#EF9F27',
  '#D85A30',
  '#A32D2D',
];

/** 뜨거워/차가워 미터 (docs/05 §5, docs/03 §5). distance(m) 바인딩. */
export function ProximityMeter({ distanceM }: { distanceM: number }) {
  const t = useTranslations('proximity');
  const h = heat(distanceM);
  const active = heatSegment(h, SEGMENTS);

  const label =
    h >= 0.92
      ? t('burning')
      : h >= 0.66
        ? t('hot')
        : h >= 0.4
          ? t('warm')
          : h >= 0.15
            ? t('cold')
            : t('freezing');

  return (
    <div className="glass p-3" role="meter" aria-label={t('label')} aria-valuenow={Math.round(h * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-lg font-black" style={{ color: RAMP[active] }}>
          {label}
        </span>
        <span className="g-chip g-chip-gold text-sm">
          {distanceM < 1000
            ? `${Math.round(distanceM)}m`
            : `${(distanceM / 1000).toFixed(1)}km`}
        </span>
      </div>
      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span
            key={i}
            className="h-3 flex-1 rounded-full transition-all"
            style={{
              background: i <= active ? RAMP[i] : 'rgba(255,255,255,0.12)',
              transform: i === active ? 'scaleY(1.5)' : undefined,
              boxShadow: i <= active ? `0 0 8px ${RAMP[i]}` : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
