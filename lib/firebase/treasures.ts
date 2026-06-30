import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './client';
import type { GeoPoint, Treasure, TreasureStatus } from '@/lib/types';

const millis = (v: unknown): number =>
  v && typeof (v as { toMillis?: () => number }).toMillis === 'function'
    ? (v as { toMillis: () => number }).toMillis()
    : typeof v === 'number'
      ? v
      : Date.now();

function mapTreasure(id: string, data: Record<string, unknown>): Treasure {
  return {
    id,
    location: data.location as GeoPoint,
    radiusM: (data.radiusM as number) ?? 40,
    reward: (data.reward as Treasure['reward']) ?? {
      type: 'FIXED',
      amount: 0,
      currency: 'KRW',
    },
    hintPhotoUrl: (data.hintPhotoUrl as string) ?? '',
    title: (data.title as string) ?? null,
    note: (data.note as string) ?? null,
    createdByUid: (data.createdByUid as string) ?? '',
    status: (data.status as TreasureStatus) ?? 'active',
    assignedChildId: (data.assignedChildId as string) ?? null,
    locationSource: 'MAP_PICK',
    verification: (data.verification as Treasure['verification']) ?? ['LIVE_GEOFENCE'],
    timeWindow: null,
    chainId: null,
    collectionTag: null,
    createdAt: millis(data.createdAt),
    updatedAt: millis(data.updatedAt),
  };
}

/** 힌트 사진 업로드 → 가족 스코프 경로 (docs/07 §B). */
export async function uploadHintPhoto(
  familyId: string,
  file: File,
): Promise<string> {
  const path = `families/${familyId}/hints/${Date.now()}-${file.name}`;
  const r = storageRef(storage, path);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}

export interface NewTreasureInput {
  location: GeoPoint;
  radiusM: number; // 30~50
  amount: number;
  currency?: string;
  hintPhotoUrl: string;
  title?: string;
  note?: string;
  assignedChildId?: string | null;
  createdByUid: string;
}

export async function createTreasure(
  familyId: string,
  input: NewTreasureInput,
): Promise<string> {
  const ref = doc(collection(db, 'families', familyId, 'treasures'));
  await setDoc(ref, {
    location: input.location,
    radiusM: input.radiusM,
    reward: { type: 'FIXED', amount: input.amount, currency: input.currency ?? 'KRW' },
    hintPhotoUrl: input.hintPhotoUrl,
    title: input.title ?? null,
    note: input.note ?? null,
    createdByUid: input.createdByUid,
    status: 'active',
    assignedChildId: input.assignedChildId ?? null,
    // ── 확장 자리 (P1 기본값) ──
    locationSource: 'MAP_PICK',
    verification: ['LIVE_GEOFENCE'],
    timeWindow: null,
    chainId: null,
    collectionTag: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listTreasures(familyId: string): Promise<Treasure[]> {
  const q = query(
    collection(db, 'families', familyId, 'treasures'),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapTreasure(d.id, d.data()));
}

/** 자녀 지도용: active 보물 (옵션: 특정 자녀 대상). 인덱스: status + assignedChildId. */
export async function listActiveTreasures(
  familyId: string,
  childId?: string,
): Promise<Treasure[]> {
  const q = query(
    collection(db, 'families', familyId, 'treasures'),
    where('status', '==', 'active'),
  );
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => mapTreasure(d.id, d.data()));
  if (!childId) return all;
  return all.filter((t) => !t.assignedChildId || t.assignedChildId === childId);
}

export async function getTreasure(
  familyId: string,
  treasureId: string,
): Promise<Treasure | null> {
  const d = await getDoc(doc(db, 'families', familyId, 'treasures', treasureId));
  if (!d.exists()) return null;
  return mapTreasure(d.id, d.data());
}

export async function setTreasureStatus(
  familyId: string,
  treasureId: string,
  status: TreasureStatus,
): Promise<void> {
  await updateDoc(doc(db, 'families', familyId, 'treasures', treasureId), {
    status,
    updatedAt: serverTimestamp(),
  });
}
