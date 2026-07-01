'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';
import { ChildSwitcher } from '@/components/child/ChildSwitcher';
import { GameMapDynamic } from '@/components/map/GameMapDynamic';
import { getTrack, listTrackDates, type Track } from '@/lib/firebase/tracks';
import { formatDistanceM } from '@/lib/geo/format';
import { GlassCard, SectionTitle, Icon } from '@/components/kit';
import type { GeoPoint } from '@/lib/types';

const JEJU: GeoPoint = { lat: 33.3846, lng: 126.5535 };

export default function RoutesPage() {
  const t = useTranslations('routes');
  const tc = useTranslations('common');
  const { family, children, activeChildId } = useAuth();
  const child = children.find((c) => c.id === activeChildId) ?? null;

  const [dates, setDates] = useState<{ date: string; distanceM: number }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDates = useCallback(async () => {
    if (!family || !child) return;
    setLoading(true);
    try {
      const ds = await listTrackDates(family.id, child.id);
      setDates(ds);
      setSelected((cur) => cur ?? ds[0]?.date ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [family, child]);

  useEffect(() => {
    loadDates();
  }, [loadDates]);

  useEffect(() => {
    if (!family || !child || !selected) {
      setTrack(null);
      return;
    }
    getTrack(family.id, child.id, selected).then(setTrack).catch(console.error);
  }, [family, child, selected]);

  const path: GeoPoint[] = (track?.points ?? []).map((p) => ({ lat: p.lat, lng: p.lng }));
  const center = path[0] ?? JEJU;
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <SectionTitle action={<ChildSwitcher />}>
        <span className="inline-flex items-center gap-2">
          <Icon name="map" size={22} /> {t('title')}
        </span>
      </SectionTitle>
      <p className="-mt-2 text-sm text-[var(--g-dim)]">{t('subtitle')}</p>

      {/* 날짜 선택 */}
      {dates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dates.map((d) => (
            <button
              key={d.date}
              type="button"
              onClick={() => setSelected(d.date)}
              data-active={selected === d.date}
              className="g-seg-item shrink-0"
            >
              {d.date === todayStr ? t('today') : d.date.slice(5)}
              <span className="ml-1 text-[0.7rem] opacity-80">
                {formatDistanceM(d.distanceM)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 선택 날짜 요약 */}
      {selected && (
        <GlassCard className="flex items-center justify-between p-4">
          <span className="font-extrabold">
            {selected === todayStr ? t('today') : selected}
          </span>
          <span className="inline-flex items-center gap-2">
            <Icon name="steps" size={18} /> {t('distance')}
            <span className="text-xl font-black text-[var(--g-gold)]">
              {formatDistanceM(track?.distanceM ?? 0)}
            </span>
          </span>
        </GlassCard>
      )}

      {/* 동선 지도 */}
      <div className="tq-map-frame">
        <div className="h-[55vh] w-full">
          <GameMapDynamic
            center={center}
            zoom={14}
            path={path}
            fitPath={path.length >= 2}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-[var(--g-dim)]">{tc('loading')}</p>
      ) : dates.length === 0 ? (
        <p className="py-6 text-center text-[var(--g-dim)]">{t('empty')}</p>
      ) : (
        path.length < 2 && (
          <p className="py-2 text-center text-[var(--g-dim)]">{t('noRouteForDay')}</p>
        )
      )}
    </div>
  );
}
