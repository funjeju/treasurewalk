'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/lib/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { GameMapDynamic } from '@/components/map/GameMapDynamic';
import { ProximityMeter } from '@/components/map/ProximityMeter';
import { StepMilestone, type Milestone } from '@/components/hud/StepMilestone';
import { ChildSwitcher } from '@/components/child/ChildSwitcher';
import { Avatar, Icon, Progress } from '@/components/kit';
import { stepStatus } from '@/lib/gamification/steps';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useStepCounter } from '@/lib/hooks/useStepCounter';
import { useRouteTracker } from '@/lib/hooks/useRouteTracker';
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
  const th = useTranslations('hud');
  const format = useFormatter();
  const router = useRouter();
  const { family, children, activeChildId, refreshFamily } = useAuth();

  const child = useMemo(
    () => children.find((c) => c.id === activeChildId) ?? null,
    [children, activeChildId],
  );

  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const locationEnabled = child?.locationEnabled ?? false;

  const { position, status } = useGeolocation(locationEnabled);
  // 걸음수(가속도) — HUD/보상 기준
  const {
    steps,
    active: stepsActive,
    start: startSteps,
  } = useStepCounter(child?.id ?? null);
  // GPS 동선 — 지도에 경로 표시 + 일자별 기록 (보상엔 미사용)
  const { path } = useRouteTracker(
    family?.id ?? null,
    child?.id ?? null,
    position,
    locationEnabled,
  );
  const triggered = useRef<Set<string>>(new Set());
  const lastVibrate = useRef(0);
  // 기본 뷰는 제주도 전체. 내 위치 확대는 사용자가 📍 버튼으로.
  const [recenter, setRecenter] = useState<GeoPoint | null>(null);

  // 걸음 목표 달성 축하 팝업
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const lastReached = useRef(-1);
  useEffect(() => {
    const st = stepStatus(steps, family?.stepGoals);
    if (lastReached.current < 0) {
      lastReached.current = st.reachedIndex; // 최초 로드 시 기준만 잡고 팝업 X
      return;
    }
    if (st.reachedIndex > lastReached.current) {
      const g = st.goals[st.reachedIndex];
      lastReached.current = st.reachedIndex;
      setMilestone({ steps: g.steps, amount: g.amount });
    }
  }, [steps, family?.stepGoals]);

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
    await startSteps(); // 사용자 제스처에서 만보기 권한 요청
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
  const st = stepStatus(steps, family?.stepGoals);

  return (
    <>
      <StepMilestone milestone={milestone} onDone={() => setMilestone(null)} />

      {/* 맵 우선 — 전체 지도 위에 컨트롤이 떠 있음 */}
      <div className="fixed inset-x-0 bottom-0 top-[52px] z-0">
        <GameMapDynamic
          className="absolute inset-0"
          center={mapCenter}
          zoom={JEJU_ZOOM}
          recenter={recenter}
          path={path}
          treasures={treasures}
          userLocation={position}
        />

        {/* 상단 상태바 */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start gap-2">
          <div className="glass pointer-events-auto flex flex-1 items-center gap-2 rounded-2xl px-3 py-2">
            <Avatar size={34} level={child.level}>
              <Icon name="avatar" size={18} />
            </Avatar>
            <span className="min-w-0 flex-1 truncate font-extrabold">
              {child.displayName}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-bold">
              <Icon name="coin" size={15} /> {child.coins.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-bold">
              <Icon name="steps" size={15} /> {steps.toLocaleString()}
            </span>
          </div>
          {children.length > 1 && (
            <div className="pointer-events-auto">
              <ChildSwitcher />
            </div>
          )}
        </div>

        {locationEnabled && (
          <div className="glass absolute left-3 top-[68px] z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold text-[var(--g-green)]">
            <span className="tq-pulse inline-block h-2 w-2 rounded-full bg-[var(--g-green)]" />
            {t('locationActive')}
          </div>
        )}

        {/* 좌측 플로팅 컨트롤 */}
        <div className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
          <Link
            href="/routes"
            aria-label={tn('routes')}
            className="glass grid h-11 w-11 place-items-center rounded-full active:scale-95"
          >
            <Icon name="map" size={20} />
          </Link>
          {position && (
            <button
              type="button"
              onClick={() => setRecenter({ ...position })}
              aria-label="내 위치"
              className="glass grid h-11 w-11 place-items-center rounded-full active:scale-95"
            >
              <Icon name="pin" size={20} />
            </button>
          )}
        </div>

        {/* 하단 시트 (탭바 위) */}
        <div className="absolute inset-x-3 bottom-24 z-10 space-y-2">
          {locationEnabled && nearest && <ProximityMeter distanceM={nearest.d} />}

          {locationEnabled &&
            (status === 'denied' || status === 'unsupported') && (
              <p className="glass rounded-xl p-2 text-center text-xs font-bold text-[var(--g-red)]">
                {status === 'denied' ? t('locationDenied') : t('locationUnsupported')}
              </p>
            )}

          {/* 걸음 요약 */}
          <div className="glass p-3">
            <div className="flex items-center gap-3">
              <span className="g-orb g-orb-steps g-orb-lg shrink-0">
                <Icon name="steps" size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black leading-none">
                    {steps.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-[var(--g-dim)]">
                    {tc('steps')}
                  </span>
                  {st.earnedAmount > 0 && (
                    <span className="g-chip g-chip-gold ml-auto">
                      <Icon name="coin" size={12} /> +{format.number(st.earnedAmount)}
                      {tc('krw')}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={st.progress} className="flex-1" />
                  <span className="shrink-0 text-[0.65rem] font-bold text-[var(--g-dim)]">
                    {st.next
                      ? th('nextReward', {
                          steps: format.number(st.next.steps),
                          amount: format.number(st.next.amount),
                        })
                      : th('maxGoal')}
                  </span>
                </div>
              </div>
            </div>
            {!stepsActive && (
              <button
                type="button"
                className="g-btn g-btn-gold g-btn-sm g-btn-block mt-2"
                onClick={startSteps}
              >
                <Icon name="steps" size={14} /> {th('startCounter')}
              </button>
            )}
          </div>

          {locationEnabled && treasures.length === 0 && (
            <p className="glass rounded-full px-3 py-1.5 text-center text-xs text-[var(--g-dim)]">
              {t('noTreasures')}
            </p>
          )}
        </div>

        {/* 위치 OFF 오버레이 */}
        {!locationEnabled && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/45 p-6 backdrop-blur-sm">
            <div className="glass max-w-xs p-6 text-center">
              <p className="text-lg font-extrabold">🔒 {t('locationOff')}</p>
              <p className="mt-1 text-[var(--g-dim)]">{t('locationOffHint')}</p>
              <button
                type="button"
                className="g-btn g-btn-gold g-btn-block mt-4"
                onClick={enableLocation}
              >
                🧭 {t('enableLocation')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
