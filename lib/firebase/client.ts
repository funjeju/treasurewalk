import { getApps, getApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

/**
 * NEXT_PUBLIC_* 은 빌드 타임에 인라인된다. env 미설정으로 빌드(프리렌더)할 때
 * getAuth 가 `auth/invalid-api-key` 로 던지지 않도록 placeholder 폴백을 둔다.
 * 실제 동작은 사용자가 env 를 채워 재빌드하면 활성화된다 (.env.example 참고).
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'placeholder-api-key',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'placeholder-project',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'placeholder.appspot.com',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:placeholder',
};

export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

// 개발 전용: 커스텀 토큰으로 클라 로그인(모바일 UI 점검용). 프로덕션 빌드엔 미포함.
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  import('firebase/auth').then(({ signInWithCustomToken }) => {
    (window as unknown as Record<string, unknown>).__devSignIn = (token: string) =>
      signInWithCustomToken(auth, token);
  });
}
