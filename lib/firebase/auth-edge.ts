/**
 * next-firebase-auth-edge 공통 설정 (docs/03 §2, docs/07 §B).
 * 비밀키는 서버 환경변수에서만 읽는다.
 */

const serverConfig = {
  serviceAccount:
    process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PROJECT_ID
      ? {
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          // Vercel 등에서 개행이 escape 되어 들어오는 경우 복원.
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }
      : undefined,
};

export const authConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  cookieName: process.env.AUTH_COOKIE_NAME ?? 'TQAuthToken',
  cookieSignatureKeys: [
    process.env.AUTH_COOKIE_SECRET_CURRENT ?? 'dev-secret-current-change-me',
    process.env.AUTH_COOKIE_SECRET_PREVIOUS ?? 'dev-secret-previous-change-me',
  ],
  cookieSerializeOptions: {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 12, // 12 days
  },
  serviceAccount: serverConfig.serviceAccount,
};

export const LOGIN_PATH = '/api/login';
export const LOGOUT_PATH = '/api/logout';
