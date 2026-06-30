import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './client';
import type { AgeTier, Child, Family, ThemeSkin } from '@/lib/types';

const millis = (v: unknown): number =>
  v && typeof (v as { toMillis?: () => number }).toMillis === 'function'
    ? (v as { toMillis: () => number }).toMillis()
    : typeof v === 'number'
      ? v
      : Date.now();

/** owner(부모)의 가족을 찾는다. 없으면 null. */
export async function getFamilyForOwner(uid: string): Promise<Family | null> {
  const q = query(collection(db, 'families'), where('ownerUid', '==', uid), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    ownerUid: data.ownerUid,
    name: data.name,
    locale: data.locale,
    createdAt: millis(data.createdAt),
    updatedAt: millis(data.updatedAt),
  };
}

/** 최초 로그인 시 가족 생성. */
export async function createFamily(
  uid: string,
  name: string,
  locale: string,
): Promise<Family> {
  const ref = doc(collection(db, 'families'));
  await setDoc(ref, {
    ownerUid: uid,
    name,
    locale,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const now = Date.now();
  return { id: ref.id, ownerUid: uid, name, locale, createdAt: now, updatedAt: now };
}

const SKIN_FOR_TIER: Record<AgeTier, ThemeSkin> = {
  T1: 'island',
  T2: 'adventure',
  T3: 'dark',
  T4: 'neon',
};

export interface NewChildInput {
  displayName: string;
  ageTier: AgeTier;
  /** docs/07: 부모 법정대리인 동의 필수. */
  guardianConsent: boolean;
}

// TODO(decision): 정식 출시용 법정대리인 동의 확인 강화 — 본인인증/카드/문자 등 (개인정보보호법 §22의2, docs/07 A.1).
//   P1 은 부모가 자녀 프로필 생성 시 동의 체크(guardianConsent)만. 사업자 등록도 미결.
/** 자녀 프로필 생성. 위치는 기본 OFF (docs/07 A.2-1). */
export async function createChild(
  familyId: string,
  input: NewChildInput,
): Promise<Child> {
  const ref = doc(collection(db, 'families', familyId, 'children'));
  const skin = SKIN_FOR_TIER[input.ageTier];
  const today = new Date().toISOString().slice(0, 10);
  await setDoc(ref, {
    displayName: input.displayName,
    ageTier: input.ageTier,
    avatar: { skin, hat: null },
    themeSkin: skin,
    level: 1,
    xp: 0,
    coins: 0,
    streakDays: 0,
    lastActiveDate: today,
    locationEnabled: false, // ❗기본 OFF
    guardianConsent: input.guardianConsent,
    createdAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    displayName: input.displayName,
    ageTier: input.ageTier,
    avatar: { skin, hat: null },
    themeSkin: skin,
    level: 1,
    xp: 0,
    coins: 0,
    streakDays: 0,
    lastActiveDate: today,
    locationEnabled: false,
    guardianConsent: input.guardianConsent,
    createdAt: Date.now(),
  };
}

export async function listChildren(familyId: string): Promise<Child[]> {
  const snap = await getDocs(collection(db, 'families', familyId, 'children'));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      displayName: data.displayName,
      ageTier: data.ageTier,
      avatar: data.avatar ?? { skin: 'adventure', hat: null },
      themeSkin: data.themeSkin ?? 'adventure',
      level: data.level ?? 1,
      xp: data.xp ?? 0,
      coins: data.coins ?? 0,
      streakDays: data.streakDays ?? 0,
      lastActiveDate: data.lastActiveDate ?? '',
      locationEnabled: data.locationEnabled ?? false,
      guardianConsent: data.guardianConsent ?? false,
      createdAt: millis(data.createdAt),
    } satisfies Child;
  });
}

export async function getChild(
  familyId: string,
  childId: string,
): Promise<Child | null> {
  const d = await getDoc(doc(db, 'families', familyId, 'children', childId));
  if (!d.exists()) return null;
  const data = d.data();
  return {
    id: d.id,
    displayName: data.displayName,
    ageTier: data.ageTier,
    avatar: data.avatar ?? { skin: 'adventure', hat: null },
    themeSkin: data.themeSkin ?? 'adventure',
    level: data.level ?? 1,
    xp: data.xp ?? 0,
    coins: data.coins ?? 0,
    streakDays: data.streakDays ?? 0,
    lastActiveDate: data.lastActiveDate ?? '',
    locationEnabled: data.locationEnabled ?? false,
    guardianConsent: data.guardianConsent ?? false,
    createdAt: millis(data.createdAt),
  };
}

export async function updateChild(
  familyId: string,
  childId: string,
  patch: Partial<Pick<Child, 'locationEnabled' | 'level' | 'xp' | 'coins' | 'streakDays' | 'lastActiveDate' | 'themeSkin' | 'displayName'>>,
): Promise<void> {
  await updateDoc(doc(db, 'families', familyId, 'children', childId), patch);
}
