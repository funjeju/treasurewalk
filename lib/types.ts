/**
 * Firestore data model (docs/03 §3).
 *
 * 설계 원칙: P1은 한 칸만 켜되, 확장 필드를 enum/nullable로 미리 열어둔다.
 * → P2~P4에서 마이그레이션이 필요 없도록.
 */

export type AgeTier = 'T1' | 'T2' | 'T3' | 'T4';
export type ThemeSkin = 'island' | 'adventure' | 'dark' | 'neon';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface StepGoal {
  steps: number;
  amount: number; // KRW
}

/** families/{familyId} */
export interface Family {
  id: string;
  ownerUid: string;
  name: string;
  locale: string;
  /** 걸음 목표별 용돈 (부모 설정). 없으면 기본값. */
  stepGoals?: StepGoal[];
  createdAt: number;
  updatedAt: number;
}

/** families/{familyId}/children/{childId} */
export interface Child {
  id: string;
  displayName: string;
  ageTier: AgeTier;
  avatar: { skin: string; hat?: string | null };
  themeSkin: ThemeSkin;
  level: number;
  xp: number;
  coins: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  /** ❗위치 기본 OFF (docs/07 A.2-1) */
  locationEnabled: boolean;
  /** 부모 법정대리인 동의 (docs/07 A.3) */
  guardianConsent: boolean;
  /** 오늘 이미 청구한 걸음 용돈 (중복 방지). */
  stepRewardClaimedDate?: string; // YYYY-MM-DD
  stepRewardClaimedAmount?: number;
  createdAt: number;
}

export type AllowanceStatus = 'REQUESTED' | 'PAID';

/** families/{familyId}/allowanceRequests/{id} — 보물+걸음 용돈 합산 청구 */
export interface AllowanceRequest {
  id: string;
  childId: string;
  /** 포함된 보물 claim 참조 (지급 시 PAID 처리용) */
  claimRefs: { treasureId: string; claimId: string }[];
  treasureAmount: number;
  stepAmount: number;
  stepsAtRequest: number;
  total: number;
  currency: string;
  status: AllowanceStatus;
  createdAt: number;
  paidAt?: number | null;
}

export type RewardType = 'FIXED' | 'DISTANCE_SCALED' | 'STREAK_BONUS';
export type TreasureStatus = 'active' | 'found' | 'expired';
export type LocationSource = 'MAP_PICK' | 'EXIF_EXTRACT' | 'ROADVIEW_PICK';
export type VerificationMethod =
  | 'LIVE_GEOFENCE'
  | 'EXIF_GPS_MATCH'
  | 'EXIF_TIME_WINDOW'
  | 'PARENT_APPROVE';

/** families/{familyId}/treasures/{treasureId} */
export interface Treasure {
  id: string;
  location: GeoPoint;
  radiusM: number; // P1: 30~50
  reward: { type: RewardType; amount: number; currency: string };
  hintPhotoUrl: string;
  title?: string | null;
  note?: string | null;
  createdByUid: string;
  status: TreasureStatus;
  assignedChildId?: string | null;
  // ── 확장 자리 (P1엔 기본값) ──
  locationSource: LocationSource;
  verification: VerificationMethod[];
  timeWindow?: null; // P2 '오늘 외출 인증'
  chainId?: null; // P2 보물 체인
  collectionTag?: null; // P2 도감 세트
  createdAt: number;
  updatedAt: number;
}

export type ClaimStatus = 'FOUND' | 'REQUESTED' | 'PAID';
export type NotifyChannel = 'KAKAO_SHARE' | 'KAKAO_AUTO' | 'IN_APP';

/** families/{familyId}/treasures/{treasureId}/claims/{claimId} */
export interface Claim {
  id: string;
  treasureId: string;
  childId: string;
  status: ClaimStatus;
  foundAt: number;
  foundLocation: GeoPoint;
  stepsToday?: number;
  certificateUrl?: string | null;
  notifyChannel: NotifyChannel;
  requestedAt?: number | null;
  paidAt?: number | null;
}

export type ActivityType = 'FOUND' | 'PAID' | 'LEVEL_UP' | 'STREAK';

/** families/{familyId}/activity/{eventId} — 가족 피드 (CD5) */
export interface ActivityEvent {
  id: string;
  type: ActivityType;
  childId: string;
  payload: Record<string, unknown>;
  createdAt: number;
}
