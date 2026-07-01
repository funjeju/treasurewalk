import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { authMiddleware } from 'next-firebase-auth-edge';
import { routing } from './lib/i18n/routing';
import { authConfig, LOGIN_PATH, LOGOUT_PATH } from './lib/firebase/auth-edge';

const intlMiddleware = createIntlMiddleware(routing);

/**
 * 인증 미들웨어(쿠키 세션 갱신) → next-intl(로케일 라우팅) 체이닝 (docs/06 §1.2).
 * 라우트 보호(미로그인 → 로그인 리다이렉트)는 서버 레이아웃에서 getTokens 로 수행.
 */
export async function middleware(request: NextRequest) {
  return authMiddleware(request, {
    loginPath: LOGIN_PATH,
    logoutPath: LOGOUT_PATH,
    apiKey: authConfig.apiKey,
    cookieName: authConfig.cookieName,
    cookieSignatureKeys: authConfig.cookieSignatureKeys,
    cookieSerializeOptions: authConfig.cookieSerializeOptions,
    serviceAccount: authConfig.serviceAccount,
    handleValidToken: async () => intlMiddleware(request),
    handleInvalidToken: async () => intlMiddleware(request),
    handleError: async () => intlMiddleware(request),
  });
}

export const config = {
  matcher: [
    '/api/login',
    '/api/logout',
    // api, _next, 정적 파일 제외한 모든 경로 (로케일 라우팅 대상)
    '/((?!api|_next|.*\\..*).*)',
  ],
};
