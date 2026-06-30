# 07 · 아동 안전·개인정보 & 빌드 가이드

> 이 문서의 안전 제약은 **기능보다 우선**한다. 충돌 시 Claude Code는 멈추고 안전한 쪽을 택한다. 법 부분은 참고이며 법률 자문이 아니다 — 정식 출시 전 전문가 확인 필요.

---

## A. 아동 개인정보 — 한국 PIPA 기준 (반드시 반영)

### A.1 핵심 법 요건
- **만 14세 미만 아동의 개인정보 처리 시 법정대리인(부모)의 동의를 받아야 하고, 동의 여부를 확인해야 한다** (개인정보 보호법 제22조의2). 위반 시 과태료/과징금·형사처벌 가능.
- 동의 확인 방법(택1): 부모 휴대폰 본인인증, 카드정보, 문자 통지 확인, 서면/이메일 등.

### A.2 보호위원회 아동·청소년 가이드라인이 권고하는 설계 (우리 앱에 직접 적용)
1. **위치추적 옵션은 기본 비활성(OFF)**, 위치 수집 시 아동이 추적 사실을 **명확히 인식**하게 할 것.
   → 구현: `child.locationEnabled` **기본 false**, 위치 사용 중 항상 가시적 인디케이터("탐험 모드 — 위치 사용 중").
2. **개인정보 보호 기본설정을 '높은 수준'으로.**
   → 데이터 최소수집, 외부 공유 없음, 가족 격리.
3. **현금·아이템 지급 대가로 개인정보를 입력시키는 서비스 설계 자제.**
   → ⚠️ 우리의 "용돈" 메커닉이 여기 닿는다. **반드시** 다음 원칙으로 설계:
     - 용돈은 **부모(법정대리인)가 자녀에게 주는 보상**이지, *서비스가 아동의 데이터 대가로 지급하는 구조가 아니다.* 지급 주체=부모, 통제 주체=부모.
     - 아동이 용돈을 위해 외부에 개인정보를 입력/제공하게 만들지 않는다.
4. **만 14세 미만이 연령 허위기재로 부정 사용하는 것을 막는 합리적 장치** 마련.
5. 아동에게 고지할 때 **이해하기 쉬운 언어/양식** 사용.

### A.3 우리 앱의 안전 설계 (위 요건의 구현 방침)
- **계정 소유자 = 부모(Guardian)**. 구글 로그인 주체는 부모. **자녀는 독립 계정/이메일 없음(P1)** → 아동 직접 식별정보 수집 최소화.
- **자녀 데이터 최소화:** 표시이름(별명) + 게임 진행도 + (동의 시) 위치/걸음. 실명·주민번호·연락처 수집 안 함.
- **위치 데이터:** 기본 OFF, 포그라운드 한정, 가족 내부에서만, 부모가 저장범위 통제. 발견 좌표는 인증 목적 최소 보관.
- **동의 게이트(구현 필요):** 자녀 프로필 생성 시 **부모가 법정대리인으로서 동의** 체크 + 위치 사용 별도 동의. (정식 출시 시 A.1 확인 방법 강화 — 미결, TODO.)
- **연령 게이트:** 부모가 자녀 연령티어 입력 → T1/T2(만 14세 미만 가능성)일수록 보호 기본값 강화.

### A.4 정신건강·웰빙 (`docs/02`와 연계)
- 부정 비교·압박형 랭킹/스트릭 표현 회피. 실패는 "다음 기회"로.
- 백그라운드 상시 추적·과도한 푸시로 강박 유발 금지.

---

## B. 보안 (기술)
- Firestore/Storage **보안규칙 = 가족 격리**(`docs/03 §4`). 타 가족 접근 불가.
- 비밀키(Firebase Admin, 쿠키 시크릿)는 **서버 환경변수만**, 클라이언트 노출 금지.
- 이미지 업로드(힌트/인증서)는 가족 스코프 경로 + 규칙으로 제한.
- HTTPS·인증 쿠키(SSR)·CSRF 고려(next-firebase-auth-edge 패턴).

---

## C. 단계별 빌드 가이드 (Claude Code 실행 순서)

> 순서대로. 각 단계 끝에 빌드/동작 확인. P1 수용기준은 `docs/04 §6`.

### C0. 부트스트랩
```bash
npx create-next-app@latest treasure-quest --ts --app --tailwind --eslint
cd treasure-quest
npm i firebase firebase-admin next-firebase-auth-edge \
      next-intl next-themes maplibre-gl react-map-gl \
      @rive-app/react-canvas lottie-react framer-motion
```
- `docs/` 와 `README.md` 를 루트에 복사. README를 `CLAUDE.md`로도 두어 자동 컨텍스트화 권장.

### C1. Firebase 프로젝트
- 콘솔에서 프로젝트 생성 → Auth(Google 사용 설정) → Firestore(프로덕션 모드) → Storage.
- Admin SDK 서비스계정 키 발급 → 서버 env.
- Authorized Domains에 localhost + Vercel 도메인. OAuth redirect 등록.
- `.env.local` / `.env.example` 작성(README §5).

### C2. 코어 인프라 (순서 중요)
1. `lib/firebase/client.ts` · `admin.ts` (싱글톤 초기화)
2. `lib/i18n/*` + `middleware.ts` + `messages/{ko,en}.json` (`docs/06`)
3. `next-firebase-auth-edge` 세션/미들웨어 합성 (i18n과 체이닝)
4. `ThemeProvider`(next-themes) + 토큰 CSS(`docs/05 §3`) + Tailwind 매핑
5. `app/[locale]/layout.tsx` = Intl + Theme + Auth Provider 래핑

### C3. 인증 & 가족 온보딩
- Google 로그인 페이지 → 최초 로그인 시 `families/{fid}` 생성 + Guardian.
- 자녀 프로필 생성 화면(연령티어·동의 게이트·위치 OFF 기본).
- 보안규칙(`firestore.rules`) 배포: `firebase deploy --only firestore:rules`.

### C4. 부모 모드
- 보물 숨기기(GameMap 핀 + 반경 슬라이더 + 힌트 업로드 + 용돈) → treasure 저장.
- 대시보드 + 지급확정(claim REQUESTED→PAID).

### C5. 아이 모드 (게임 핵심 — juice 집중)
1. `GameMap`(MapLibre 게임 스킨 + 핀/아바타/안개/걸음 HUD)
2. `watchPosition`(locationEnabled 시) + `ProximityMeter`(뜨거워/차가워)
3. 지오펜스 진입 → claim FOUND → `discover` 라우팅
4. `TreasureChest`(Rive) + `RewardBurst`(Lottie) + 팡파르 + 햅틱
5. `용돈 요청하기` → 인증서 PNG 생성 → 공유시트(KAKAO_SHARE)
6. 도감/HUD/가족 피드 반영

### C6. 마감
- ko/en 누락 키 점검, 다크모드 전 화면 점검, reduced-motion·포커스·44px 탭타깃.
- `npm run build` → Vercel 연결(GitHub) → env 등록 → 배포.
- 수용기준(`docs/04 §6`) 전체 체크.

### C7. TODO로만 남길 것 (구현 금지 — 미결)
```
// TODO(decision): 카카오 자동발송(KAKAO_AUTO) — 비즈니스 채널/알림톡 심사 필요
// TODO(decision): 실물 용돈 결제/이체 연동
// TODO(decision): 정식 출시용 법정대리인 동의 확인 강화(본인인증/카드/문자) + 사업자 등록
// TODO(verify): 지도 커스텀 스타일 한계, 백그라운드 위치 OS별 동작 — 실측 필요
```

---

## D. 디자인 파일이 "안 될 때" 가이드 (사용자 요청 대응)
실제 Figma/PSD 디자인 파일은 이 저장소에 동봉되지 않는다. 대신:
1. **토큰·컴포넌트 사양은 `docs/05`가 코드로 직행 가능한 단일 소스.** Figma 없이 Tailwind 토큰으로 바로 구현.
2. **이미지 에셋은 `docs/05 §8` 매니페스트 경로/규격에 사용자가 생성해 투입.**
3. Figma가 필요하면: §8 매니페스트를 그대로 프레임 리스트로 삼아 디자이너/AI에 발주. 또는 Mapbox Studio(지도)·Rive 에디터(상자/캐릭터)에서 직접 제작.

---
**출처(법·정책):** 개인정보 보호법 제22조의2(아동의 개인정보 보호) — casenote.kr / easylaw.go.kr / privacy.go.kr; 보호위원회 아동·청소년 개인정보보호 가이드라인 요지(위치추적 기본 비활성, 현금·아이템 대가 개인정보 입력 설계 자제, 보호 기본설정 '높은 수준', 연령 허위기재 방지) — Kim&Chang 정리(kimchang.com), catchsecu.com. 기술 출처는 각 docs 하단 참조.
