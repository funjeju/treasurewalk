import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './client';
import type { GeoPoint } from '@/lib/types';

/**
 * 일자별 이동 동선(GPS 트랙).
 * families/{fid}/children/{cid}/tracks/{YYYY-MM-DD}
 *   points: {lat,lng,t}[]   distanceM: number
 */
export interface TrackPoint {
  lat: number;
  lng: number;
  t: number;
}

export interface Track {
  date: string;
  points: TrackPoint[];
  distanceM: number;
}

const trackRef = (fid: string, cid: string, date: string) =>
  doc(db, 'families', fid, 'children', cid, 'tracks', date);

/** 유효 이동 포인트 추가 + 거리 누적. 최초 호출 시 문서 생성. */
export async function appendTrackPoint(
  fid: string,
  cid: string,
  date: string,
  point: GeoPoint,
  deltaM: number,
): Promise<void> {
  const ref = trackRef(fid, cid, date);
  const snap = await getDoc(ref);
  const p: TrackPoint = { lat: point.lat, lng: point.lng, t: Date.now() };
  if (!snap.exists()) {
    await setDoc(ref, {
      points: [p],
      distanceM: 0,
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, {
      points: arrayUnion(p),
      distanceM: increment(Math.round(deltaM)),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function getTrack(
  fid: string,
  cid: string,
  date: string,
): Promise<Track | null> {
  const snap = await getDoc(trackRef(fid, cid, date));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    date,
    points: (d.points as TrackPoint[]) ?? [],
    distanceM: (d.distanceM as number) ?? 0,
  };
}

/** 트랙이 존재하는 날짜 목록 (최신순). */
export async function listTrackDates(
  fid: string,
  cid: string,
): Promise<{ date: string; distanceM: number }[]> {
  const snap = await getDocs(
    collection(db, 'families', fid, 'children', cid, 'tracks'),
  );
  return snap.docs
    .map((d) => ({ date: d.id, distanceM: (d.data().distanceM as number) ?? 0 }))
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // 최신 날짜 먼저

}
