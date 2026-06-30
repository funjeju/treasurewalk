# 06 · 다국어(i18n) & 다크모드

## 1. i18n — next-intl v4 (App Router)

### 1.1 라우팅 구조
`[locale]` 동적 세그먼트로 언어별 라우팅. (참고: next-intl 공식 App Router 가이드.)
```
app/[locale]/...        # 모든 페이지가 locale 하위
lib/i18n/routing.ts     # locales 정의
lib/i18n/request.ts     # 메시지 로더
middleware.ts           # next-intl 미들웨어(로케일 감지/리다이렉트)
messages/ko.json, en.json
```

### 1.2 설정 (요지)
```ts
// lib/i18n/routing.ts
import {defineRouting} from 'next-intl/routing';
export const routing = defineRouting({
  locales: ['ko','en'],          // P1: 최소 2개. 확장: ja, zh, es...
  defaultLocale: 'ko'
});
```
```ts
// middleware.ts  (auth 미들웨어와 합성)
import createMiddleware from 'next-intl/middleware';
import {routing} from './lib/i18n/routing';
export default createMiddleware(routing);
export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] };
```
> next-firebase-auth-edge 인증 미들웨어와 함께 쓸 때는 두 미들웨어를 **체이닝**(인증 검사 → next-intl)으로 합성. 충돌 시 locale 라우팅이 먼저 경로를 정규화하도록 순서 주의.

### 1.3 정적 렌더링
`[locale]` 레이아웃/페이지에 `generateStaticParams()` + `setRequestLocale(locale)` 사용(next-intl v4). 서버 컴포넌트에서 `useTranslations` 사용 시 정적화를 위해 필요.
```ts
export function generateStaticParams(){ return routing.locales.map(locale=>({locale})); }
```

### 1.4 메시지 카탈로그 컨벤션
- **네임스페이스 = 기능 단위:** `auth`, `parent`, `child`, `map`, `discover`, `collection`, `hud`, `common`.
- 키는 의미 기반(`map.locationOffHint`), UI 문자열 하드코딩 절대 금지.
- 숫자/통화/날짜는 next-intl 포맷터 사용(`useFormatter`) → 로케일별 자동.

```jsonc
// messages/ko.json (발췌)
{
  "common": { "coin": "코인", "steps": "걸음", "level": "레벨" },
  "discover": { "found": "보물 발견!", "requestAllowance": "용돈 요청하기" },
  "map": { "locationOffHint": "위치를 켜면 탐험을 시작할 수 있어요" }
}
```

### 1.5 게임 카피 현지화 주의
- "용돈/통화"는 로케일별 단위(KRW/USD…) — 금액은 데이터에 `currency` 저장, 표시는 포맷터.
- 모험 톤이 언어별로 유지되도록 카피라이팅(직역 금지). 번역 키 누락 시 fallback=defaultLocale.

---

## 2. 다크모드 — next-themes

### 2.1 Provider
```tsx
// app/[locale]/layout.tsx
import {ThemeProvider} from 'next-themes';
<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
  {children}
</ThemeProvider>
```
- `attribute="data-theme"` → `docs/05` 의 `[data-theme="dark"]` 토큰과 일치.
- **FOUC/하이드레이션 방지:** next-themes 권장 패턴(서버 렌더 시 깜빡임 제거) 적용. 토글 버튼은 mounted 후 렌더.

### 2.2 토글 스위치 UI
```tsx
// components/theme/ThemeToggle.tsx
'use client';
import {useTheme} from 'next-themes';
// system/light/dark 3-state 또는 light/dark 2-state 토글
// 아이콘: ☀️/🌙 (에셋: icons) , aria-label 필수, reduced-motion 존중
```
- 3-state(system→light→dark) 권장. 위치: 설정 + HUD 보조.
- **테마 스킨(`themeSkin`)과 다크모드는 직교:** 스킨=세계관 톤(island/adventure/dark/neon), 다크모드=명도. 둘을 곱해 토큰 해석.

### 2.3 로케일 전환 시 테마 유지
locale 전환이 풀 리로드를 유발할 수 있으므로, 테마 선택을 쿠키/localStorage(next-themes 기본)에 저장해 리로드 후 복원되게 한다(깜빡임 방지 스크립트 포함).

---

## 3. 접근성 연계
- `<html lang={locale}>` 설정(레이아웃).
- 다크/라이트 모두 AA 대비 충족(`docs/05 §10`).
- 향후 RTL(ar/he) 확장 대비: 방향 의존 스타일은 논리 속성(`margin-inline-start` 등) 사용 권장.

---
**출처:** next-intl 공식 문서(App Router 설정/locale 라우팅/정적 생성), next-themes 다크모드 패턴 가이드, Next.js App Router i18n 토론(테마·로케일 동시 처리).
