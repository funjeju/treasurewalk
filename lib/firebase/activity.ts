import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from './client';
import type { ActivityEvent, ActivityType } from '@/lib/types';

const millis = (v: unknown): number =>
  v && typeof (v as { toMillis?: () => number }).toMillis === 'function'
    ? (v as { toMillis: () => number }).toMillis()
    : typeof v === 'number'
      ? v
      : Date.now();

/** 가족 피드 (CD5). 최신순. */
export async function listActivity(
  familyId: string,
  max = 30,
): Promise<ActivityEvent[]> {
  const q = query(
    collection(db, 'families', familyId, 'activity'),
    orderBy('createdAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      type: data.type as ActivityType,
      childId: data.childId as string,
      payload: (data.payload as Record<string, unknown>) ?? {},
      createdAt: millis(data.createdAt),
    } satisfies ActivityEvent;
  });
}
