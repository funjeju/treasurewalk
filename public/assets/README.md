# 📦 에셋 매니페스트 (사용자가 생성·공급)

> docs/05 §8 기준. 아래 경로/파일명/규격으로 넣으면 코드가 자동 인식합니다.
> 코드는 이미지를 생성하지 않고 **placeholder 위에 UI를 조립**합니다.
> 에셋이 없으면 앱은 이모지/CSS 폴백으로 정상 동작합니다.

```
public/assets/
├─ brand/      logo.svg  wordmark.svg
├─ icons/      coin.png  gem.png  star.png  steps.png  streak-flame.png  level.png
├─ chest/      chest.riv            # 닫힘/열기/터짐 상태머신 (state machine "State Machine 1", input "open")
│                                   #   없으면 components/discover/TreasureChest.tsx 가 CSS 폴백
├─ avatar/     base/{skin}.png  hats/*.png
├─ map/        pin-treasure.png  pin-found.png  marker-avatar.png  fog-texture.png
├─ banners/    header-wood.png  header-ribbon.png  panel-frame.png
├─ fx/         coin-burst.json(Lottie)  confetti.json  levelup.json
│                                   #   coin-burst.json 없으면 RewardBurst.tsx 가 CSS 코인 폴백
├─ collection/ card-frame.png  card-back.png  set-complete.png
├─ pass/       pass-bg.png  node-locked.png  node-claimed.png
└─ skins/      island/*  adventure/*  dark/*  neon/*
```

## 규격 가이드
- 아이콘: 256×256 PNG 투명배경, 글로시 림라이트.
- 핀/마커: 128×160 PNG, 바닥 그림자 분리.
- 배너/프레임: 9-slice 가능하게 가장자리 여백 균일.
- 캐릭터/상자: Rive 권장(base + 파츠 분리). 어려우면 PNG 시트.

## 지도 스킨
- `NEXT_PUBLIC_MAP_STYLE_URL` 에 MapLibre 호환 style JSON URL 을 지정하면 게임 스킨이 적용됩니다.
- 비우면 데모 스타일(`https://demotiles.maplibre.org/style.json`)로 폴백합니다.
- TODO(verify): 지도 커스텀 스타일 한계는 출시 시 실측 필요 (docs/05 §6).
