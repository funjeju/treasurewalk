'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/lib/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { GameMapDynamic } from '@/components/map/GameMapDynamic';
import { ProximityMeter } from '@/components/map/ProximityMeter';
import { Hud } from '@/components/hud/Hud';
import { ChildSwitcher } from '@/components/child/ChildSwitcher';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useStepCounter } from '@/lib/hooks/useStepCounter';
import { listActiveTreasures } from '@/lib/firebase/treasures';
import { updateChild } from '@/lib/firebase/families';
import { createFoundClaim } from '@/lib/firebase/claims';
import { distanceM } from '@/lib/geo/haversine';
import { isInside } from '@/lib/geo/geofence';
import { heat, hapticPattern } from '@/lib/geo/proximity';
import type { GeoPoint, Treasure } from '@/lib/types';

// 기본 뷰 — 제주도 전체 (내 위치 버튼으로 확대)
const JEJU_CENTER: GeoPoint = { lat: 33.3846, lng: 126.5535 };
const JEJU_ZOOM = 10;

export default function ChildMapPage() {
  const t = useTranslations('map');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const router = useRouter();
  const { family, children, activeChildId, refreshFamily } = useAuth();

  const child = useMemo(
    () => children.find((c) => c.id === activeChildId) ?? null,
    [children, activeChildId],
  );

  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const locationEnabled = child?.locationEnabled ?? false;

  const { position, status } = useGeolocation(locationEnabled);
  const { steps, start: startSteps } = useStepCounter(child?.id ?? null);
  const triggered = useRef<Set<string>>(new Set());
  const lastVibrate = useRef(0);
  // 기본 뷰는 제주도 전체. 내 위치 확대는 사용자가 📍 버튼으로.
  const [recenter, setRecenter] = useState<GeoPoint | null>(null);

  // active 보물 로드
  const loadTreasures = useCallback(async () => {
    if (!family || !child) return;
    try {
      setTreasures(await listActiveTreasures(family.id, child.id));
    } catch (e) {
      console.error(e);
    }
  }, [family, child]);

  useEffect(() => {
    loadTreasures();
  }, [loadTreasures]);

  // 가장 가까운 보물
  const nearest = useMemo(() => {
    if (!position || treasures.length === 0) return null;
    let best: { t: Treasure; d: number } | null = null;
    for (const tr of treasures) {
      const d = distanceM(position, tr.location);
      if (!best || d < best.d) best = { t: tr, d };
    }
    return best;
  }, [position, treasures]);

  // 지오펜스 진입 감지 → 발견 (docs/03 §5, docs/04 §3.2)
  useEffect(() => {
    if (!position || !family || !child) return;
    for (const tr of treasures) {
      if (triggered.current.has(tr.id)) continue;
      if (isInside(position, tr.location, tr.radiusM)) {
        triggered.current.add(tr.id);
        // 강한 햅틱
        navigator.vibrate?.([60, 30, 120]);
        createFoundClaim(family.id, tr, child, position, steps)
          .then(() => {
            router.push(`/discover/${tr.id}`);
          })
          .catch((e) => {
            console.error('createFoundClaim failed', e);
            triggered.current.delete(tr.id);
          });
        break;
      }
    }
  }, [position, treasures, family, child, steps, router]);

  // 근접 햅틱 (가까울수록 자주)
  useEffect(() => {
    if (!nearest) return;
    const h = heat(nearest.d);
    if (h < 0.4) return;
    const now = Date.now();
    const interval = 1500 - h * 1200;
    if (now - lastVibrate.current > interval) {
      lastVibrate.current = now;
      navigator.vibrate?.(hapticPattern(h));
    }
  }, [nearest]);

  async function enableLocation() {
    if (!family || !child) return;
    await updateChild(family.id, child.id, { locationEnabled: true });
    await startSteps(); // 사용자 제스처 컨텍스트에서 만보기 권한 요청
    await refreshFamily();
  }

  // 자녀 미선택
  if (!child) {
    return (
      <div className="glass p-6 text-center">
        <p className="mb-3 text-[var(--g-dim)]">{tc('loading')}</p>
        <Link href="/dashboard" className="g-btn g-btn-glass">
          {tn('dashboard')}
        </Link>
      </div>
    );
  }

  const mapCenter = JEJU_CENTER; // 기본은 제주도 전체

  return (
    <div className="space-y-3">
      {/* 탐험가 선택 + HUD */}
      <div className="flex items-center justify-between gap-2">
        <ChildSwitcher />
      </div>
      <Hud child={child} steps={steps} />

      {/* 위치 사용 중 인디케이터 (docs/07 A.2-1) */}
      {locationEnabled && (
        <div className="flex items-center gap-2 rounded-full border border-[var(--g-line)] bg-[rgba(55,213,154,0.14)] px-3 py-2 text-sm font-extrabold text-[var(--g-green)]">
          <span className="tq-pulse inline-block h-2.5 w-2.5 rounded-full bg-[var(--g-green)]" />
          {t('locationActive')}
        </div>
      )}

      {/* 지도 — 게임 월드 프레임 */}
      <div className="tq-map-frame">
        <div className="h-[55vh] w-full">
          <GameMapDynamic
            center={mapCenter}
            zoom={JEJU_ZOOM}
            recenter={recenter}
            treasures={treasures}
            userLocation={position}
            onLocate={
              position ? () => setRecenter({ ...position }) : undefined
            }
          />
        </div>
      </div>

      {/* 위치 OFF 안내 */}
      {!locationEnabled && (
        <div className="glass p-5 text-center">
          <p className="text-lg font-extrabold">🔒 {t('locationOff')}</p>
          <p className="mt-1 text-[var(--g-dim)]">{t('locationOffHint')}</p>
          <button type="button" className="g-btn g-btn-gold mt-4" onClick={enableLocation}>
            🧭 {t('enableLocation')}
          </button>
        </div>
      )}

      {/* 권한 거부/미지원 */}
      {locationEnabled && status === 'denied' && (
        <p className="rounded-[14px] border border-[var(--g-line)] bg-[rgba(255,106,95,0.14)] p-3 text-sm font-bold text-[var(--g-red)]">
          {t('locationDenied')}
        </p>
      )}
      {locationEnabled && status === 'unsupported' && (
        <p className="rounded-[14px] border border-[var(--g-line)] bg-[rgba(255,106,95,0.14)] p-3 text-sm font-bold text-[var(--g-red)]">
          {t('locationUnsupported')}
        </p>
      )}

      {/* 근접 미터 (보물찾기) */}
      {locationEnabled && nearest && (
        <ProximityMeter distanceM={nearest.d} />
      )}

      {locationEnabled && treasures.length === 0 && (
        <p className="py-4 text-center text-[var(--g-dim)]">{t('noTreasures')}</p>
      )}
    </div>
  );
}
