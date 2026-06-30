'use client';

import { useMemo } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GeoPoint, Treasure } from '@/lib/types';
import { circlePolygon } from '@/lib/geo/circle';

const DEMO_STYLE = 'https://demotiles.maplibre.org/style.json';

export interface GameMapProps {
  center: GeoPoint;
  zoom?: number;
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
  className?: string;
}

export function GameMap({
  center,
  zoom = 16,
  treasures = [],
  userLocation,
  pickMode = false,
  pickRadiusM = 40,
  onPick,
  onTreasureClick,
  className,
}: GameMapProps) {
  const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEMO_STYLE;

  const pickCircle = useMemo(
    () => (pickMode ? circlePolygon(center, pickRadiusM) : null),
    [pickMode, center, pickRadiusM],
  );

  return (
    <div className={className ?? 'h-full w-full'}>
      <Map
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom,
        }}
        mapStyle={styleUrl}
        style={{ width: '100%', height: '100%', borderRadius: 18 }}
        onClick={(e) => {
          if (pickMode && onPick) {
            onPick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          }
        }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* 보물별 발견 반경 (게임 월드 느낌) */}
        {treasures.map((t) => {
          const poly = circlePolygon(t.location, t.radiusM);
          return (
            <Source
              key={`circle-${t.id}`}
              id={`circle-${t.id}`}
              type="geojson"
              data={poly}
            >
              <Layer
                id={`circle-fill-${t.id}`}
                type="fill"
                paint={{ 'fill-color': '#E8B23A', 'fill-opacity': 0.18 }}
              />
              <Layer
                id={`circle-line-${t.id}`}
                type="line"
                paint={{ 'line-color': '#B97A2E', 'line-width': 2 }}
              />
            </Source>
          );
        })}

        {/* 보물 핀 */}
        {treasures.map((t) => (
          <Marker
            key={t.id}
            longitude={t.location.lng}
            latitude={t.location.lat}
            anchor="bottom"
            onClick={() => onTreasureClick?.(t)}
          >
            <button
              type="button"
              aria-label={t.title ?? 'treasure'}
              className="grid place-items-center text-2xl drop-shadow"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {t.status === 'found' ? '✅' : '📍'}
              <span className="text-xl">🎁</span>
            </button>
          </Marker>
        ))}

        {/* 자녀 위치 */}
        {userLocation && (
          <Marker
            longitude={userLocation.lng}
            latitude={userLocation.lat}
            anchor="center"
          >
            <span
              className="block h-4 w-4 rounded-full border-2 border-white bg-[var(--tq-sapphire)] shadow"
              aria-label="me"
            />
          </Marker>
        )}

        {/* pickMode: 화면 중앙 고정 핀 + 반경 미리보기 */}
        {pickMode && pickCircle && (
          <Source id="pick-circle" type="geojson" data={pickCircle}>
            <Layer
              id="pick-fill"
              type="fill"
              paint={{ 'fill-color': '#1D9E75', 'fill-opacity': 0.2 }}
            />
            <Layer
              id="pick-line"
              type="line"
              paint={{ 'line-color': '#1D9E75', 'line-width': 2 }}
            />
          </Source>
        )}
        {pickMode && (
          <Marker longitude={center.lng} latitude={center.lat} anchor="bottom">
            <span className="text-3xl drop-shadow" aria-label="pin">📍</span>
          </Marker>
        )}
      </Map>
    </div>
  );
}
