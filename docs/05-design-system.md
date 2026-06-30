# 05 · 디자인 시스템

> 비주얼 목표: 업로드된 레퍼런스 같은 **"진짜 게임" 질감**(글로시 버튼·청키 패널·배너 헤더·코인/젬 경제·시즌패스·컬렉션)을 보물찾기 도메인으로 옮기되, **고등학생까지 안 유치하게** 스케일되도록 **테마 스킨 시스템**을 얹는다.
> **이미지 에셋은 사용자가 직접 생성·공급한다.** 이 문서 §8 매니페스트의 경로/파일명/규격에 맞춰 넣으면 UI가 바로 붙는다. Claude Code는 이미지를 만들지 말고 placeholder 위에 레이아웃을 조립한다.

---

## 1. 디자인 콘셉트: "The Explorer's Atlas (탐험가의 지도책)"
- **세계관:** 낡은 보물지도 + 황금/보석 + 미지의 안개. 매치3류 사탕 톤이 아니라 **모험·발굴(excavation)·카토그래피** 톤 → 어린이도 좋아하고 청소년도 부끄럽지 않음.
- **시그니처 요소(이 앱을 기억하게 하는 한 가지):** **양피지 위에서 안개가 걷히며 빛기둥과 함께 열리는 보물 상자.** 모든 화면이 이 한 장면을 향한다.
- **레퍼런스 차용 ≠ 복제:** 레퍼런스의 *juice 강도와 컴포넌트 문법*(글로시·배지·코인)만 가져오고, 팔레트·캐릭터·테마는 보물/모험으로 교체.

## 2. 테마 스킨 (연령 스케일의 핵심)
하나의 토큰 구조, 4개 스킨. 프로필 `themeSkin`으로 전환. 다크모드(`docs/06`)와 직교.

| 스킨 | 티어 | 분위기 | 채도/대비 |
|---|---|---|---|
| `island` | T1 | 밝은 보물섬, 둥글둥글, 큰 버튼 | 채도 높음 |
| `adventure` | T2 | 정통 양피지 모험 지도 | 중간 |
| `dark` | T3 | 다크 어드벤처(밤의 탐험) | 낮은 채도·고대비 |
| `neon` | T4 | 네온 트레저/사이버 카토그래피 | 어두운 배경 + 보석 네온 |

## 3. 색 토큰 (CSS 변수 — 라이트/다크 둘 다 정의)
모든 색은 변수로. 하드코딩 금지. (Tailwind v4 `@theme` 또는 `:root`/`[data-theme=dark]`.)

```css
:root{
  /* 브랜드 — 보물/황금 */
  --tq-gold:#E8B23A;  --tq-gold-deep:#B97A2E;  --tq-gold-ink:#4A2E0C;
  --tq-jewel:#1D9E75;       /* 성공/발견 — 에메랄드 */
  --tq-ruby:#D85A30;        /* 강조/희소 */
  --tq-sapphire:#378ADD;    /* 정보/아바타 */
  /* 표면 — 양피지 */
  --tq-parchment:#FAEEDA;   --tq-parchment-2:#F3DCAE;  --tq-fog:#C9C6BC;
  --tq-surface:#FFFFFF;     --tq-surface-2:#FBF3E2;
  --tq-ink:#2C2C2A;         --tq-ink-soft:#6B6A64;
  --tq-border:#E9D6AE;
  /* 의미색 */
  --tq-hot:#A32D2D; --tq-warm:#EF9F27; --tq-cool:#85B7EB;  /* 근접 미터 램프 */
  --tq-radius:14px; --tq-radius-pill:999px;
}
[data-theme="dark"]{
  --tq-parchment:#1C2230; --tq-parchment-2:#222B3D; --tq-fog:#2A3346;
  --tq-surface:#161B26;   --tq-surface-2:#1E2533;
  --tq-ink:#F2EDE2;       --tq-ink-soft:#A8B0BE;  --tq-border:#33405A;
  --tq-gold:#F2C75A;      --tq-gold-ink:#FBF3E2;
}
```
- **콘트라스트 floor:** 텍스트 대비 WCAG AA(4.5:1) 이상. 컬러 위 텍스트는 같은 계열 잉크색 사용.

## 4. 타이포그래피 (의도적 페어링 — 디폴트 회피)
한글 본문은 가독성, 디스플레이는 모험 톤.

| 역할 | 한글 | 라틴 | 용도 |
|---|---|---|---|
| **Display(헤딩/배너)** | `Gmarket Sans` 또는 `Cafe24 Ssurround` | `Fredoka`(둥근 청키) / T3·T4는 `Clash Display`/`Cabinet Grotesk`(샤프) | 화면 타이틀, "보물 발견!" |
| **Body/UI** | `Pretendard Variable` | `Pretendard`/`Inter` | 본문, 버튼, 라벨 |
| **Numeric(코인·걸음·금액)** | — | `Lilita One` 또는 tabular `Inter` | 숫자 강조 |

- **티어 스위치:** T1/T2는 둥근 Display(Fredoka/Gmarket), T3/T4는 샤프 Display(Clash/Cabinet)로 교체 → 유치함 제거.
- 가변폰트 + `next/font`로 로드. CJK fallback 명시.

## 5. 컴포넌트 사양 (레퍼런스 → 보물찾기 번역)
공통 룩: **둥근 청키 패널**(radius 14~20), **2겹 버튼**(표면+하단 그림자선으로 입체), **배너 헤더**(리본/목재 느낌, 이미지 에셋), **글로시 코인/젬 아이콘**.

| 컴포넌트 | 설명 | 핵심 상태 |
|---|---|---|
| `Button`(primary/secondary/ghost) | 2겹 입체, press시 scale(0.97)+하단선 축소 | hover/active/disabled |
| `Panel/Card` | 보물상자/양피지 카드. 헤더 배너 슬롯 | — |
| `Hud` | 코인·젬·레벨·스트릭·걸음 pill 묶음 | 숫자 롤업 애니메이션 |
| `GameMap` | MapLibre 게임 스킨(§6) + 핀/아바타/안개 | 위치 ON/OFF |
| `ProximityMeter` | 7세그 cool→hot 램프 + 포인터 | 거리 바인딩 |
| `TreasureChest` | Rive 상자(닫힘/열기/터짐) | tap to open |
| `RewardBurst` | Lottie 코인·콘페티 | 1회 재생 |
| `CollectionGrid` | 보물 도감 카드 그리드, 빈 칸 실루엣 | locked/unlocked |
| `SeasonPassTrack` | 탐험 패스 트랙(노드+보상) | claimed/locked |
| `WorldPath` | 하단 보물 경로(레벨 노드) | current/done/locked |
| `Modal`(Announcement/SetComplete/Continue) | 시즌공지·세트완성·힌트더받기 | — |
| `ThemeToggle` · `LocaleSwitcher` | 다크모드·언어 | — |

## 6. 지도 스킨 (게임 월드의 핵심)
- **엔진:** MapLibre GL JS + `react-map-gl`. 커스텀 **style JSON**으로 게임 스킨.
- **라이트(adventure):** 물=흐린 청록, 땅=양피지, 도로=연한 탄, 라벨 최소, POI 숨김 → "지도"가 아니라 "월드"처럼.
- **다크(dark/neon):** 밤의 탐험. 땅=짙은 네이비, 길=은은한 골드 라인.
- **레이어:** 안개(fog) 오버레이(미탐험 가림), 보물 핀(빛기둥), 아바타 마커, 거리 링.
- **타일/스타일 소스:** MapLibre 호환 무료 벡터타일(예: 오픈 스타일) 또는 자체 스타일. **정확한 스타일링 한계는 출시 시 실측 필요(*확실하지 않음*).**
- **비개발자 대안:** Mapbox 사용 시 **Mapbox Studio**의 비주얼 스타일 에디터로 코드 없이 스킨 제작 가능(단 토큰 기반 과금). 오픈소스 우선이면 MapLibre 유지.

## 7. 애니메이션 역할 분담
- **Rive:** 상태가 있는 인터랙티브 — 상자 열기, 아바타 표정, 근접 미터 바늘. (`.riv` 파일, §8)
- **Lottie:** 1회성 셀레브레이션 — 코인 분수, 콘페티, 레벨업. (`.json`)
- **Framer Motion / CSS:** UI 마이크로(버튼 press, 패널 등장, 숫자 롤업, 핀 bounce). `prefers-reduced-motion` 존중 필수.

## 8. 📦 에셋 매니페스트 (사용자가 생성·공급)
아래 경로/파일명/규격으로 넣으면 코드가 자동 인식. **권장: 투명배경 PNG @2x 또는 SVG.** 캐릭터/상자는 Rive 권장.

```
public/assets/
├─ brand/  logo.svg  wordmark.svg
├─ icons/  coin.png  gem.png  star.png  steps.png  streak-flame.png  level.png
├─ chest/  chest.riv            # 닫힘/열기/터짐 상태머신 (또는 chest-closed/open/burst.png)
├─ avatar/ base/{skin}.png  hats/*.png  (커스터마이즈 파츠)
├─ map/    pin-treasure.png  pin-found.png  marker-avatar.png  fog-texture.png
├─ banners/ header-wood.png  header-ribbon.png  panel-frame.png
├─ fx/     coin-burst.json(Lottie)  confetti.json  levelup.json
├─ collection/ card-frame.png  card-back.png  set-complete.png
├─ pass/   pass-bg.png  node-locked.png  node-claimed.png
└─ skins/  island/*  adventure/*  dark/*  neon/*    # 스킨별 배경/프레임
```

**규격 가이드 (생성 시):**
- 아이콘: 정사각 256×256 PNG 투명배경, 글로시 림라이트.
- 핀/마커: 128×160 PNG, 바닥 그림자 분리.
- 배너/프레임: 9-slice 가능하게 가장자리 여백 균일.
- 캐릭터: Rive로 base + 파츠 분리(모자/표정). 어려우면 PNG 시트.

**생성 프롬프트 예시(사용자용 참고):**
> "glossy mobile game UI **treasure chest** icon, golden ornate, closed state, transparent background, rim light, casual game art, high detail" / "**adventure parchment map** texture, fantasy cartography, muted tones" / "cute-but-cool **explorer kid avatar**, adventurer outfit, front view, game asset, transparent bg".

## 9. Voice & 카피 (안 유치하게)
- 모험 톤, 문장형 sentence case, 군더더기·아기말투 금지. 능동태.
- 버튼=동작 그대로: `보물 숨기기`, `용돈 요청하기`, `지급완료`.
- 실패/빈 화면=다음 행동 안내("아직 발견한 보물이 없어요 — 지도를 열어 탐험을 시작하세요").
- 같은 행동은 끝까지 같은 단어(요청→요청됨, 지급→지급완료).

## 10. 품질 floor (전 화면)
모바일 반응형 · 키보드 포커스 가시 · `prefers-reduced-motion` 존중 · 다크모드 완전 대응 · AA 대비 · 탭 타깃 ≥44px.

---
**근거:** 비주얼 방향은 업로드 레퍼런스(캐주얼 게임 UI 시트) + frontend-design 원칙(시그니처 1개에 대담함 집중, 디폴트 회피). 지도 엔진 선택 근거는 `docs/00 README` 스택 표(MapLibre vs Mapbox vs Leaflet 조사).
