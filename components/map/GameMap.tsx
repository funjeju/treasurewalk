'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Map, {
  Marker,
  Source,
  Layer,
  NavigationControl,
  type MapRef,
} from 'react-map-gl/maplibre';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GeoPoint, Treasure } from '@/lib/types';
import { circlePolygon } from '@/lib/geo/circle';
import { Icon } from '@/components/kit';

/**
 * 기본 지도 스타일 — 키 없이 쓰는 CARTO 다크 베이스맵 (다크 프리미엄 톤).
 * 게임 스킨(커스텀 벡터, docs/05 §6)은 NEXT_PUBLIC_MAP_STYLE_URL 로 교체.
 */
const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    basemap: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap © CARTO',
      maxzoom: 20,
    },
  },
  layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
};

export interface GameMapProps {
  center: GeoPoint;
  zoom?: number;
  /** 카메라를 이 좌표로 이동(flyTo). 값이 바뀔 때마다 이동. */
  recenter?: GeoPoint | null;
  /** 이동 동선(폴리라인) */
  path?: GeoPoint[];
  /** path 전체가 보이도록 카메라 맞춤 */
  fitPath?: boolean;
  /** 보물 핀들 */
  treasures?: Treasure[];
  /** 자녀 현재 위치 마커 */
  userLocation?: GeoPoint | null;
  /** 부모 보물 숨기기: 중앙 고정 핀 + 클릭으로 위치 선택 */
  pickMode?: boolean;
  /** pickMode일 때 표시할 반경(m) */
  pickRadiusM?: number;
  /** pickMode 위치 선택 콜백 */
  onPick?: (p: GeoPoint) => void;
  /** 보물 핀 클릭 */
  onTreasureClick?: (t: Treasure) => void;
  /** 내 위치 버튼 (제공 시 우하단에 버튼 표시) */
  onLocate?: () => void;
  className?: string;
}

export function GameMap({
  center,
  zoom = 16,
  recenter,
  path,
  fitPath = false,
  treasures = [],
  userLocation,
  pickMode = false,
  pickRadiusM = 40,
  onPick,
  onTreasureClick,
  onLocate,
  className,
}: GameMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapStyle: string | StyleSpecification =
    process.env.NEXT_PUBLIC_MAP_STYLE_URL || OSM_STYLE;

  const pickCircle = useMemo(
    () => (pickMode ? circlePolygon(center, pickRadiusM) : null),
    [pickMode, center, pickRadiusM],
  );

  const pathLine = useMemo<GeoJSON.Feature<GeoJSON.LineString> | null>(() => {
    if (!path || path.length < 2) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: path.map((p) => [p.lng, p.lat]) },
    };
  }, [path]);

  // path 전체가 보이도록 카메라 맞춤 (지도 로드 완료 후에도 재시도)
  useEffect(() => {
    if (!fitPath || !mapReady || !path || path.length < 2) return;
    const m = mapRef.current;
    if (!m) return;
    let minLng = 180,
      minLat = 90,
      maxLng = -180,
      maxLat = -90;
    for (const p of path) {
      minLng = Math.min(minLng, p.lng);
      maxLng = Math.max(maxLng, p.lng);
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
    }
    m.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 50, duration: 600, maxZoom: 17 },
    );
  }, [fitPath, path, mapReady]);

  // recenter 값이 바뀌면 카메라 이동 (initialViewState 는 최초 1회만 적용되므로)
  useEffect(() => {
    if (!recenter) return;
    const m = mapRef.current;
    if (!m) return;
    const z = m.getZoom();
    m.flyTo({
      center: [recenter.lng, recenter.lat],
      zoom: z < 14 ? 16 : z,
      duration: 800,
    });
  }, [recenter]);

  return (
    <div className={className ?? 'relative h-full w-full'}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: center.lng, latitude: center.lat, zoom }}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setMapReady(true)}
        onClick={(e) => {
          if (pickMode && onPick) onPick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* 이동 동선 */}
        {pathLine && (
          <Source id="route-line" type="geojson" data={pathLine}>
            <Layer
              id="route-line-glow"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': '#f2c75a', 'line-width': 9, 'line-opacity': 0.25, 'line-blur': 4 }}
            />
            <Layer
              id="route-line-core"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': '#f2c75a', 'line-width': 4 }}
            />
          </Source>
        )}

        {/* 보물별 발견 반경 — 상태에 따라 색 구분 (active=골드, found=에메랄드) */}
        {treasures.map((t) => {
          const poly = circlePolygon(t.location, t.radiusM);
          const found = t.status === 'found';
          return (
            <Source key={`circle-${t.id}`} id={`circle-${t.id}`} type="geojson" data={poly}>
              <Layer
                id={`circle-fill-${t.id}`}
                type="fill"
                paint={{
                  'fill-color': found ? '#1D9E75' : '#E8B23A',
                  'fill-opacity': found ? 0.12 : 0.2,
                }}
              />
              <Layer
                id={`circle-line-${t.id}`}
                type="line"
                paint={{
                  'line-color': found ? '#1D9E75' : '#B97A2E',
                  'line-width': 2,
                  'line-dasharray': found ? [2, 2] : [1, 0],
                }}
              />
            </Source>
          );
        })}

        {/* 보물 핀 — 깔끔한 글로시 배지 + 포인터 */}
        {treasures.map((t) => (
          <Marker
            key={t.id}
            longitude={t.location.lng}
            latitude={t.location.lat}
            anchor="bottom"
            onClick={() => onTreasureClick?.(t)}
          >
            <TreasurePin found={t.status === 'found'} label={t.title ?? 'treasure'} />
          </Marker>
        ))}

        {/* 자녀 위치 — 파란 점 + 펄스 링 */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <span className="tq-me-dot" aria-label="me" />
          </Marker>
        )}

        {/* pickMode: 중앙 핀 + 반경 미리보기 */}
        {pickMode && pickCircle && (
          <Source id="pick-circle" type="geojson" data={pickCircle}>
            <Layer id="pick-fill" type="fill" paint={{ 'fill-color': '#1D9E75', 'fill-opacity': 0.2 }} />
            <Layer id="pick-line" type="line" paint={{ 'line-color': '#1D9E75', 'line-width': 2 }} />
          </Source>
        )}
        {pickMode && (
          <Marker longitude={center.lng} latitude={center.lat} anchor="bottom">
            <TreasurePin found={false} label="pin" />
          </Marker>
        )}
      </Map>

      {/* 내 위치 버튼 */}
      {onLocate && (
        <button
          type="button"
          onClick={onLocate}
          aria-label="내 위치"
          className="absolute bottom-3 right-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-[var(--tq-border)] bg-[var(--tq-surface)] text-xl shadow-lg active:scale-95"
        >
          📍
        </button>
      )}
    </div>
  );
}

/** 지도 핀 — 원형 글로시 배지 + 아래 포인터. active=골드/🎁, found=에메랄드/🏁 */
function TreasurePin({ found, label }: { found: boolean; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="tq-pin"
      data-found={found}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <span className="tq-pin-badge" aria-hidden>
        <Icon name={found ? 'flag' : 'chest'} size={20} />
      </span>
    </button>
  );
}
