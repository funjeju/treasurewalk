import 'server-only';
import { cookies } from 'next/headers';
import { getTokens } from 'next-firebase-auth-edge';
import { authConfig } from './auth-edge';

export interface ServerUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * 서버 컴포넌트에서 쿠키 세션을 검증해 현재 사용자 반환 (SSR 안전, docs/03 §2).
 * 미인증이거나 env 미설정이면 null.
 */
export async function getServerUser(): Promise<ServerUser | null> {
  if (!authConfig.serviceAccount) return null;
  try {
    const tokens = await getTokens(await cookies(), {
      apiKey: authConfig.apiKey,
      cookieName: authConfig.cookieName,
      cookieSignatureKeys: authConfig.cookieSignatureKeys,
      serviceAccount: authConfig.serviceAccount,
    });
    if (!tokens) return null;
    const d = tokens.decodedToken;
    return {
      uid: d.uid,
      email: d.email,
      name: (d.name as string | undefined) ?? undefined,
      picture: (d.picture as string | undefined) ?? undefined,
    };
  } catch {
    return null;
  }
}
