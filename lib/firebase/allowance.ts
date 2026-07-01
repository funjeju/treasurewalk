import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './client';
import type {
  AllowanceRequest,
  AllowanceStatus,
  Child,
  Claim,
  StepGoal,
  Treasure,
} from '@/lib/types';
import { stepStatus } from '@/lib/gamification/steps';

const millis = (v: unknown): number =>
  v && typeof (v as { toMillis?: () => number }).toMillis === 'function'
    ? (v as { toMillis: () => number }).toMillis()
    : typeof v === 'number'
      ? v
      : Date.now();

const today = () => new Date().toISOString().slice(0, 10);

export interface WalletLine {
  treasureId: string;
  claimId: string;
  title: string;
  amount: number;
}

export interface Wallet {
  lines: WalletLine[]; // 발견했지만 미지급인 보물
  treasureAmount: number;
  stepEarned: number; // 오늘 걸음으로 도달한 총 금액
  stepAlreadyClaimed: number; // 오늘 이미 청구한 걸음 금액
  stepClaimable: number; // 지금 청구 가능한 걸음 금액
  total: number; // 청구 가능한 합계
  currency: string;
}

/**
 * 지갑 합산: 미지급 보물 용돈 + 오늘 걸음 용돈(중복 제외).
 * FOUND(미청구) claim + 걸음 목표 도달분을 모은다.
 */
export async function computeWallet(
  familyId: string,
  child: Child,
  todaySteps: number,
  goals?: StepGoal[],
): Promise<Wallet> {
  // 미지급 보물: FOUND claim (collectionGroup 회피 — 보물별 순회)
  const treasuresSnap = await getDocs(
    collection(db, 'families', familyId, 'treasures'),
  );
  const treasureById = new Map<string, Treasure>();
  treasuresSnap.docs.forEach((d) => {
    const data = d.data();
    treasureById.set(d.id, {
      id: d.id,
      location: data.location,
      radiusM: data.radiusM,
      reward: data.reward,
      hintPhotoUrl: data.hintPhotoUrl ?? '',
      title: data.title ?? null,
      createdByUid: data.createdByUid,
      status: data.status,
      assignedChildId: data.assignedChildId ?? null,
      rewardMode: data.rewardMode ?? 'FIXED',
      roulette: data.roulette ?? null,
      locationSource: 'MAP_PICK',
      verification: data.verification ?? ['LIVE_GEOFENCE'],
      createdAt: millis(data.createdAt),
      updatedAt: millis(data.updatedAt),
    } as Treasure);
  });

  const lines: WalletLine[] = [];
  let treasureAmount = 0;
  for (const [tid, tr] of treasureById) {
    const claimsSnap = await getDocs(
      query(
        collection(db, 'families', familyId, 'treasures', tid, 'claims'),
        where('childId', '==', child.id),
      ),
    );
    claimsSnap.docs.forEach((c) => {
      const cd = c.data() as Partial<Claim>;
      if (cd.status === 'FOUND') {
        // 룰렛 당첨 금액이 있으면 그것, 룰렛인데 아직 안 뽑았으면 0, 아니면 단순 용돈
        const amt =
          cd.wonAmount != null
            ? cd.wonAmount
            : tr.rewardMode === 'ROULETTE'
              ? 0
              : (tr.reward?.amount ?? 0);
        treasureAmount += amt;
        lines.push({
          treasureId: tid,
          claimId: c.id,
          title: tr.title || tid.slice(0, 6),
          amount: amt,
        });
      }
    });
  }

  // 걸음 용돈 (오늘 도달분에서 이미 청구분 제외)
  const st = stepStatus(todaySteps, goals);
  const stepEarned = st.earnedAmount;
  const stepAlreadyClaimed =
    child.stepRewardClaimedDate === today() ? (child.stepRewardClaimedAmount ?? 0) : 0;
  const stepClaimable = Math.max(0, stepEarned - stepAlreadyClaimed);

  const currency = 'KRW';
  return {
    lines,
    treasureAmount,
    stepEarned,
    stepAlreadyClaimed,
    stepClaimable,
    total: treasureAmount + stepClaimable,
    currency,
  };
}

/** [용돈 주세요] — 지갑 합계를 하나의 요청으로. */
export async function requestAllowance(
  familyId: string,
  child: Child,
  wallet: Wallet,
  todaySteps: number,
): Promise<string | null> {
  if (wallet.total <= 0) return null;

  const reqRef = await addDoc(
    collection(db, 'families', familyId, 'allowanceRequests'),
    {
      childId: child.id,
      claimRefs: wallet.lines.map((l) => ({
        treasureId: l.treasureId,
        claimId: l.claimId,
      })),
      treasureAmount: wallet.treasureAmount,
      stepAmount: wallet.stepClaimable,
      stepsAtRequest: todaySteps,
      total: wallet.total,
      currency: wallet.currency,
      status: 'REQUESTED' satisfies AllowanceStatus,
      createdAt: serverTimestamp(),
      paidAt: null,
    },
  );

  // 보물 claim 들을 REQUESTED 로
  const batch = writeBatch(db);
  for (const line of wallet.lines) {
    batch.update(
      doc(db, 'families', familyId, 'treasures', line.treasureId, 'claims', line.claimId),
      { status: 'REQUESTED', requestedAt: serverTimestamp() },
    );
  }
  // 오늘 걸음 청구분 누적
  if (wallet.stepClaimable > 0) {
    batch.update(doc(db, 'families', familyId, 'children', child.id), {
      stepRewardClaimedDate: today(),
      stepRewardClaimedAmount: wallet.stepAlreadyClaimed + wallet.stepClaimable,
    });
  }
  await batch.commit();

  await addDoc(collection(db, 'families', familyId, 'activity'), {
    type: 'FOUND',
    childId: child.id,
    payload: { allowanceRequest: reqRef.id, total: wallet.total },
    createdAt: serverTimestamp(),
  });

  return reqRef.id;
}

function mapReq(id: string, data: Record<string, unknown>): AllowanceRequest {
  return {
    id,
    childId: (data.childId as string) ?? '',
    claimRefs:
      (data.claimRefs as { treasureId: string; claimId: string }[]) ?? [],
    treasureAmount: (data.treasureAmount as number) ?? 0,
    stepAmount: (data.stepAmount as number) ?? 0,
    stepsAtRequest: (data.stepsAtRequest as number) ?? 0,
    total: (data.total as number) ?? 0,
    currency: (data.currency as string) ?? 'KRW',
    status: (data.status as AllowanceStatus) ?? 'REQUESTED',
    createdAt: millis(data.createdAt),
    paidAt: data.paidAt ? millis(data.paidAt) : null,
  };
}

export async function listAllowanceRequests(
  familyId: string,
): Promise<AllowanceRequest[]> {
  const snap = await getDocs(
    query(
      collection(db, 'families', familyId, 'allowanceRequests'),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => mapReq(d.id, d.data()));
}

/** 부모 [지급완료] — 요청 + 포함된 보물 claim 을 PAID 로. */
export async function payAllowance(
  familyId: string,
  req: AllowanceRequest,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'families', familyId, 'allowanceRequests', req.id), {
    status: 'PAID',
    paidAt: serverTimestamp(),
  });

  // 포함된 보물 claim 을 PAID 로 (참조 직접 사용)
  for (const r of req.claimRefs) {
    batch.update(
      doc(db, 'families', familyId, 'treasures', r.treasureId, 'claims', r.claimId),
      { status: 'PAID', paidAt: serverTimestamp() },
    );
  }
  await batch.commit();

  await addDoc(collection(db, 'families', familyId, 'activity'), {
    type: 'PAID',
    childId: req.childId,
    payload: { allowanceRequest: req.id, total: req.total },
    createdAt: serverTimestamp(),
  });
}
