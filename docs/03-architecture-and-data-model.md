# 03 · 아키텍처 & 데이터 모델

## 1. 디렉터리 구조 (목표 — Claude Code는 이 구조로 생성)

```
treasure-quest/
├─ app/[locale]/
│  ├─ layout.tsx                  # NextIntlClientProvider + ThemeProvider + AuthProvider
│  ├─ (auth)/login/page.tsx       # Google 로그인
│  ├─ (parent)/
│  │  ├─ dashboard/page.tsx       # 가족·자녀·보물 목록, 지급확정
│  │  ├─ treasure/new/page.tsx    # 보물 숨기기(지도 핀+반경+힌트+용돈)
│  │  └─ family/page.tsx          # 자녀 프로필 관리, 안전 설정
│  └─ (child)/
│     ├─ map/page.tsx             # 게임 월드 지도(탐험)
│     ├─ discover/[treasureId]/page.tsx  # 발견 연출
│     └─ collection/page.tsx      # 보물 도감
├─ components/
│  ├─ map/GameMap.tsx             # MapLibre 래퍼(react-map-gl)
│  ├─ map/ProximityMeter.tsx      # 뜨거워/차가워
│  ├─ discover/TreasureChest.tsx  # Rive 상자
│  ├─ hud/Hud.tsx                 # 코인/걸음/레벨/스트릭
│  ├─ ui/                         # 버튼·패널·모달(디자인시스템)
│  └─ theme/ThemeToggle.tsx · i18n/LocaleSwitcher.tsx
├─ lib/
│  ├─ firebase/client.ts · admin.ts · auth-edge.ts
│  ├─ firebase/treasures.ts · families.ts · claims.ts   # Firestore 헬퍼
│  ├─ geo/haversine.ts · geofence.ts · proximity.ts
│  ├─ gamification/economy.ts · levels.ts
│  └─ i18n/routing.ts · request.ts
├─ messages/{ko,en}.json
├─ middleware.ts                  # next-intl + auth
├─ public/assets/                 # docs/05 매니페스트
├─ firestore.rules · firestore.indexes.json
├─ .env.example · next.config.ts · tailwind 설정
```

## 2. 인증 흐름 (Google + SSR 안전)
- 클라이언트: Firebase Auth `signInWithPopup(GoogleAuthProvider)`.
- 서버/Edge: **`next-firebase-auth-edge`** 로 ID 토큰을 쿠키 세션화 → 미들웨어에서 보호 라우트 검증. (참고: next-firebase-auth-edge 문서, Firebase Auth Next.js codelab.)
- Firebase 콘솔: Authentication→Google 사용 설정, Authorized Domains에 Vercel 도메인 추가, OAuth redirect `/{locale}/auth/handler` 등록.
- **자녀는 별도 인증 없음(P1):** Guardian 세션 안에서 `activeChildId`만 전환.

## 3. Firestore 데이터 모델

> 규칙: **가족(Family) 단위 격리.** 모든 문서는 `familyId`로 스코프. 타 가족 접근 불가.

```
families/{familyId}
  ownerUid: string                # Guardian (구글 계정)
  name: string
  locale: string                  # 기본 언어
  createdAt, updatedAt

families/{familyId}/children/{childId}
  displayName: string
  ageTier: 'T1'|'T2'|'T3'|'T4'
  avatar: { skin, hat, ... }
  themeSkin: 'island'|'adventure'|'dark'|'neon'
  level: number, xp: number, coins: number
  streakDays: number, lastActiveDate: string
  # ❗위치 기본 OFF (docs/07)
  locationEnabled: boolean        # default false
  createdAt

families/{familyId}/treasures/{treasureId}
  location: { lat: number, lng: number }
  radiusM: number                 # P1: 30~50
  reward: { type: 'FIXED', amount: number, currency: 'KRW' }
  hintPhotoUrl: string            # 부모가 올린 힌트(인증수단 아님)
  title?: string, note?: string
  createdByUid: string
  status: 'active'|'found'|'expired'
  assignedChildId?: string        # 특정 자녀 대상(옵션)
  # ── 확장 자리(P1엔 비움/기본값) ──
  locationSource: 'MAP_PICK'      # | EXIF_EXTRACT | ROADVIEW_PICK
  verification: ['LIVE_GEOFENCE'] # | EXIF_GPS_MATCH | EXIF_TIME_WINDOW | PARENT_APPROVE
  timeWindow?: null               # P2 '오늘 외출 인증'
  chainId?: null                  # P2 보물 체인
  collectionTag?: null            # P2 도감 세트
  createdAt, updatedAt

families/{familyId}/treasures/{treasureId}/claims/{claimId}
  childId: string
  status: 'FOUND'|'REQUESTED'|'PAID'
  foundAt: timestamp
  foundLocation: { lat, lng }     # 발견 시점 좌표(증거)
  stepsToday?: number
  certificateUrl?: string         # 생성된 인증서 이미지
  notifyChannel: 'KAKAO_SHARE'    # | KAKAO_AUTO(P2) | IN_APP
  requestedAt?, paidAt?

families/{familyId}/activity/{eventId}   # 가족 피드(CD5)
  type: 'FOUND'|'PAID'|'LEVEL_UP'|'STREAK'
  childId, payload, createdAt
```

> **설계 메모:** `verification`을 **배열**로, 확장 필드를 **nullable**로 둔 것이 "열어둠"의 실체. P1 코드는 이 필드들을 읽지 않지만 스키마엔 존재 → P2에서 마이그레이션 불필요.

## 4. 보안 규칙 (firestore.rules — 핵심)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signedIn() { return request.auth != null; }
    function ownsFamily(fid) {
      return signedIn() &&
        get(/databases/$(db)/documents/families/$(fid)).data.ownerUid == request.auth.uid;
    }
    match /families/{fid} {
      allow read, write: if ownsFamily(fid) || (signedIn() && request.resource.data.ownerUid == request.auth.uid && !exists(/databases/$(db)/documents/families/$(fid)));
      match /{document=**} {
        allow read, write: if ownsFamily(fid);
      }
    }
  }
}
```
> P1은 **Guardian만 읽기/쓰기**(자녀가 독립 계정이 없으므로). 자녀 독립 로그인 도입(P3) 시 규칙 확장. Storage 규칙도 동일하게 familyId 스코프로 작성.

## 5. 지오펜스 / 근접 로직 (lib/geo)

```ts
// haversine.ts — 두 좌표 간 미터
export function distanceM(a:{lat:number,lng:number}, b:{lat:number,lng:number}): number {
  const R=6371000, toRad=(d:number)=>d*Math.PI/180;
  const dLat=toRad(b.lat-a.lat), dLng=toRad(b.lng-a.lng);
  const s=Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}
// geofence.ts — 반경 진입 판정
export const isInside = (cur, target, radiusM) => distanceM(cur,target) <= radiusM;
// proximity.ts — 0(차가움)~1(뜨거움) 정규화 (예: 0~300m 구간)
export const heat = (d:number, near=10, far=300) =>
  Math.max(0, Math.min(1, (far-d)/(far-near)));
```
- 위치 취득: `navigator.geolocation.watchPosition` (포그라운드, P1). **`locationEnabled===true` 일 때만 시작.** 권한 거부/미지원 → 안내 UI.
- 발견 트리거: `isInside` true → claim 생성(`status:FOUND`) → 발견 화면 라우팅.
- **백그라운드 추적 안 함(P1)** — OS별 동작·배터리·정책 이슈(*확실하지 않음, 출시 시 실측*).

## 6. 환경변수 (.env.example) — README §5 참조, Vercel 프로젝트 설정에 동일 등록.

## 7. 인덱스
- `treasures` 쿼리: `status` + `assignedChildId` 복합 인덱스 → `firestore.indexes.json`에 정의.

---
**출처(기술):** Firebase × Next.js codelab(firebase.google.com/codelabs/firebase-nextjs), next-firebase-auth-edge 문서, Firebase Hosting/Next 통합 문서. 지도/이동거리는 표준 Haversine.
