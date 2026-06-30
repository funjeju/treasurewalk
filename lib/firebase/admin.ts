import 'server-only';
import { getApps, getApp, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin 싱글톤 (서버 전용).
 * Admin SDK는 보안규칙을 우회하므로 — 모든 쿼리는 인증된 uid로 직접 스코프할 것.
 */
function buildAdminApp(): App {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // env 미설정 시(로컬 첫 셋업) 초기화를 건너뛰되, 호출 시점에 명확히 실패하게 둔다.
    throw new Error(
      'Firebase Admin 환경변수 누락: FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY (.env.local 참고)',
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let _db: Firestore | null = null;

export function adminDb(): Firestore {
  if (!_db) _db = getFirestore(buildAdminApp());
  return _db;
}
