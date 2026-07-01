import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

/**
 * 자녀 참여 코드 → 커스텀 토큰.
 * 코드로 joinCodes/{code} 매핑을 찾아 role='child' 커스텀 토큰을 발급.
 * 클라이언트가 signInWithCustomToken 으로 로그인 → 아이 모드.
 */
export async function POST(req: Request) {
  let code: string | undefined;
  try {
    const body = await req.json();
    code = String(body?.code ?? '')
      .trim()
      .toUpperCase();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  if (!code || code.length < 4) {
    return NextResponse.json({ error: 'bad_code' }, { status: 400 });
  }

  try {
    const snap = await adminDb().doc(`joinCodes/${code}`).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'invalid_code' }, { status: 404 });
    }
    const { familyId, childId } = snap.data() as {
      familyId: string;
      childId: string;
    };
    if (!familyId || !childId) {
      return NextResponse.json({ error: 'invalid_code' }, { status: 404 });
    }
    const token = await adminAuth().createCustomToken(`child:${childId}`, {
      role: 'child',
      familyId,
      childId,
    });
    return NextResponse.json({ token });
  } catch (e) {
    console.error('child-login failed', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
