# CLAUDE.md — TreasureQuest 작업 컨텍스트

> 가족 보물찾기 앱 (Next.js 15 + Firebase + MapLibre). 제품 명세는 `README.md` 와 `docs/01~07`.
> 이 파일은 코드 작업 시 자동 로드되는 요약본이다.

## 현재 상태: Phase 1 MVP 구현 완료
`docs/04 §6` 수용 기준 기준으로 P1 전 범위 구현. P2~P4 는 `docs/03` 스키마의
enum/nullable 자리만 열어둠(마이그레이션 불필요).

## 실행
```bash
npm install
cp .env.example .env.local   # Firebase/쿠키/지도 값 채우기 (docs/03 §6, README §5)
npm run dev                  # http://localhost:3000 → /ko 로 리다이렉트
npm run build                # 프로덕션 빌드 (env 없이도 통과 — 클라이언트 placeholder 폴백)
```
- 배포(Firebase 규칙/인덱스): `firebase deploy --only firestore:rules,firestore:indexes,storage`
- 호스팅: Vercel(GitHub 연동). `NEXT_PUBLIC_*` 는 빌드 타임 인라인이므로 **Vercel env 등록 후 재빌드** 필요.

## 아키텍처 지도
```
app/[locale]/
  layout.tsx            Intl + Theme(next-themes) + Auth Provider 래핑, <html lang>
  page.tsx              로그인/대시보드로 라우팅
  (auth)/login          Google 로그인
  (parent)/             AppHeader + AuthGate
    dashboard           가족 없으면 Onboarding, 있으면 보물/claim 목록 + 지급확정
    treasure/new        지도 핀 + 반경 + 힌트업로드 + 용돈 → treasure 생성
    family              자녀 안전설정(위치 토글) + 가족 피드
  (child)/              AppHeader + AuthGate
    map                 게임지도 + 만보기 + 근접미터 + 지오펜스 → discover
    discover/[id]       Rive 상자(폴백 CSS) + Lottie 코인(폴백 CSS) + 인증서 + 공유
    collection          보물 도감 그리드
lib/
  firebase/  client·admin·auth-edge·server-auth + families·treasures·claims·activity 헬퍼
  geo/       haversine·geofence·proximity·circle
  gamification/ economy·levels
  i18n/      routing·navigation·request
  hooks/     useGeolocation·useStepCounter
  certificate.ts  canvas → PNG + 공유시트
middleware.ts   next-firebase-auth-edge(쿠키세션) → next-intl 체이닝
firestore.rules · storage.rules · firestore.indexes.json · firebase.json
messages/{ko,en}.json   (네임스페이스 = 기능 단위, 키 149개 ko/en 동기)
public/assets/  사용자 공급 에셋 슬롯 (README.md 매니페스트) — 없으면 이모지/CSS 폴백
```

## 안전 제약 (절대 위반 금지 — docs/07)
- 자녀 `locationEnabled` **기본 false**. 위치 사용 중 항상 가시 인디케이터.
- 계정 소유자=부모, 자녀 독립 로그인 없음(P1). 자녀 식별정보 최소화(별명만).
- Firestore/Storage 규칙 = 가족 격리. 비밀키는 서버 env 만.
- 용돈은 "부모가 자녀에게 주는 보상" — 서비스가 데이터 대가로 지급하는 구조 ❌.

## 미결(임의 구현 금지 — 코드에 TODO(decision) 마커)
- `lib/firebase/claims.ts`: 카카오 자동발송(KAKAO_AUTO), 실물 결제/이체.
- `lib/firebase/families.ts`: 정식 법정대리인 동의 확인 강화·사업자 등록.
- `lib/hooks/useGeolocation.ts`: 백그라운드 위치 OS별 실측 / 지도 커스텀 스타일 한계.
