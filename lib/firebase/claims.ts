import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './client';
import type { Child, Claim, ClaimStatus, GeoPoint, Treasure } from '@/lib/types';
import { findReward } from '@/lib/gamification/economy';
import { levelFromXp } from '@/lib/gamification/levels';

const millis = (v: unknown): number =>
  v && typeof (v as { toMillis?: () => number }).toMillis === 'function'
    ? (v as { toMillis: () => number }).toMillis()
    : typeof v === 'number'
      ? v
      : Date.now();

function mapClaim(id: string, data: Record<string, unknown>): Claim {
  return {
    id,
    treasureId: (data.treasureId as string) ?? '',
    childId: (data.childId as string) ?? '',
    status: (data.status as ClaimStatus) ?? 'FOUND',
    foundAt: millis(data.foundAt),
    foundLocation: (data.foundLocation as GeoPoint) ?? { lat: 0, lng: 0 },
    stepsToday: (data.stepsToday as number) ?? 0,
    wonLabel: (data.wonLabel as string) ?? null,
    wonAmount: (data.wonAmount as number) ?? null,
    certificateUrl: (data.certificateUrl as string) ?? null,
    notifyChannel: (data.notifyChannel as Claim['notifyChannel']) ?? 'KAKAO_SHARE',
    requestedAt: data.requestedAt ? millis(data.requestedAt) : null,
    paidAt: data.paidAt ? millis(data.paidAt) : null,
  };
}

async function addActivity(
  familyId: string,
  type: 'FOUND' | 'PAID' | 'LEVEL_UP' | 'STREAK',
  childId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await addDoc(collection(db, 'families', familyId, 'activity'), {
    type,
    childId,
    payload,
    createdAt: serverTimestamp(),
  });
}

/**
 * 지오펜스 진입 → 발견 claim 생성 (status: FOUND).
 * 코인/XP 적립·도감 반영은 FOUND 시점 (docs/04 §4).
 * 같은 자녀가 이미 발견한 보물이면 기존 claim 반환(중복 방지).
 */
export async function createFoundClaim(
  familyId: string,
  treasure: Treasure,
  child: Child,
  foundLocation: GeoPoint,
  stepsToday: number,
): Promise<{ claimId: string; leveledUp: boolean }> {
  const claimsCol = collection(
    db,
    'families',
    familyId,
    'treasures',
    treasure.id,
    'claims',
  );
  const existing = await getDocs(
    query(claimsCol, where('childId', '==', child.id)),
  );
  if (!existing.empty) {
    return { claimId: existing.docs[0].id, leveledUp: false };
  }

  const claimRef = doc(claimsCol);
  await setDoc(claimRef, {
    familyId, // collectionGroup 쿼리용
    treasureId: treasure.id,
    childId: child.id,
    status: 'FOUND' satisfies ClaimStatus,
    foundAt: serverTimestamp(),
    foundLocation,
    stepsToday,
    certificateUrl: null,
    notifyChannel: 'KAKAO_SHARE',
    requestedAt: null,
    paidAt: null,
  });

  // 보물 상태 갱신
  await updateDoc(doc(db, 'families', familyId, 'treasures', treasure.id), {
    status: 'found',
    updatedAt: serverTimestamp(),
  });

  // 코인/XP 적립
  const reward = findReward(stepsToday);
  const prevLevel = levelFromXp(child.xp);
  const newLevel = levelFromXp(child.xp + reward.xp);
  const leveledUp = newLevel > prevLevel;
  await updateDoc(doc(db, 'families', familyId, 'children', child.id), {
    coins: increment(reward.coins),
    xp: increment(reward.xp),
    level: newLevel,
    lastActiveDate: new Date().toISOString().slice(0, 10),
  });

  // 가족 피드
  await addActivity(familyId, 'FOUND', child.id, {
    treasureId: treasure.id,
    title: treasure.title ?? null,
    coins: reward.coins,
  });
  if (leveledUp) {
    await addActivity(familyId, 'LEVEL_UP', child.id, { level: newLevel });
  }

  return { claimId: claimRef.id, leveledUp };
}

/** 인증서 PNG 업로드 → 소유자(부모) uid 스코프 경로. */
export async function uploadCertificate(
  familyId: string,
  blob: Blob,
): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('not authenticated');
  const path = `owners/${uid}/families/${familyId}/certificates/${Date.now()}.png`;
  const r = storageRef(storage, path);
  await uploadBytes(r, blob, { contentType: 'image/png' });
  return getDownloadURL(r);
}

// TODO(decision): 카카오 자동발송(notifyChannel: 'KAKAO_AUTO') — 비즈니스 채널/알림톡 심사 필요.
//   P1 은 OS 공유시트(KAKAO_SHARE)만. enum 자리는 lib/types.ts 에 이미 열려 있음.
/** [용돈 요청하기] → REQUESTED + 인증서 URL 저장. */
export async function requestClaim(
  familyId: string,
  treasureId: string,
  claimId: string,
  certificateUrl: string | null,
): Promise<void> {
  await updateDoc(
    doc(db, 'families', familyId, 'treasures', treasureId, 'claims', claimId),
    {
      status: 'REQUESTED' satisfies ClaimStatus,
      certificateUrl: certificateUrl ?? null,
      requestedAt: serverTimestamp(),
    },
  );
}

// TODO(decision): 실물 용돈 결제/이체 연동 — P1 은 부모 수동 지급(앱 밖). 자동 이체 ❌ (docs/02 §4, docs/04 §7).
/** 부모 [지급완료] → PAID. (현금 이동은 앱 밖에서 부모가 직접) */
export async function payClaim(
  familyId: string,
  treasureId: string,
  claimId: string,
  childId: string,
): Promise<void> {
  await updateDoc(
    doc(db, 'families', familyId, 'treasures', treasureId, 'claims', claimId),
    { status: 'PAID' satisfies ClaimStatus, paidAt: serverTimestamp() },
  );
  await addActivity(familyId, 'PAID', childId, { treasureId });
}

/**
 * 가족 전체 claim.
 * collectionGroup 은 COLLECTION_GROUP 인덱스를 요구하므로 회피 →
 * 보물별 claims 하위 컬렉션(COLLECTION 스코프, 자동 인덱스)을 순회. 인덱스 불필요.
 * 정렬은 클라이언트에서 foundAt desc.
 */
export async function listClaimsForFamily(familyId: string): Promise<Claim[]> {
  const treasuresSnap = await getDocs(
    collection(db, 'families', familyId, 'treasures'),
  );
  const all: Claim[] = [];
  await Promise.all(
    treasuresSnap.docs.map(async (tDoc) => {
      const cs = await getDocs(
        collection(db, 'families', familyId, 'treasures', tDoc.id, 'claims'),
      );
      cs.forEach((c) => all.push(mapClaim(c.id, c.data())));
    }),
  );
  return all.sort((a, b) => b.foundAt - a.foundAt);
}

/** 룰렛 당첨 결과 저장 (1회만 — 이미 있으면 덮어쓰지 않음). */
export async function setClaimWonPrize(
  familyId: string,
  treasureId: string,
  claimId: string,
  won: { label: string; amount: number },
): Promise<void> {
  await updateDoc(
    doc(db, 'families', familyId, 'treasures', treasureId, 'claims', claimId),
    { wonLabel: won.label, wonAmount: won.amount },
  );
}

/** 특정 자녀의 해당 보물 claim (발견 연출 페이지에서 사용). */
export async function getChildClaim(
  familyId: string,
  treasureId: string,
  childId: string,
): Promise<Claim | null> {
  const snap = await getDocs(
    query(
      collection(db, 'families', familyId, 'treasures', treasureId, 'claims'),
      where('childId', '==', childId),
    ),
  );
  if (snap.empty) return null;
  return mapClaim(snap.docs[0].id, snap.docs[0].data());
}

export async function getClaim(
  familyId: string,
  treasureId: string,
  claimId: string,
): Promise<Claim | null> {
  const d = await getDoc(
    doc(db, 'families', familyId, 'treasures', treasureId, 'claims', claimId),
  );
  if (!d.exists()) return null;
  return mapClaim(d.id, d.data());
}
