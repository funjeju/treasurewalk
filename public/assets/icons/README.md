# 🎨 아이콘 세트 매니페스트

앱의 모든 아이콘은 `<Icon name="..." />`(components/kit/Icon.tsx)로 렌더된다.
아래 파일명으로 **투명배경 PNG(권장 256×256)** 를 이 폴더에 넣으면
해당 아이콘이 앱 전역에서 자동 교체된다. 파일이 없으면 이모지로 폴백한다.

> 제공한 100-아이콘 시트를 아래 번호에 맞춰 잘라 저장하면 된다.
> (여기 없는 번호는 아직 앱에서 안 쓰는 것 — 나중에 레지스트리에 추가.)

| 시트# | 파일명 | 쓰임 |
|---|---|---|
| 01 | `coin.png` | 코인(HUD·상점·보상) |
| 02 | `gem.png` | 젬 |
| 03 | `gem-purple.png` | 보라 젬 |
| 04 | `gem-green.png` | 초록 젬 |
| 06 | `goldbar.png` | 골드바 |
| 08 | `chest.png` | 보물상자(핀·도감) |
| 09 | `key.png` | 열쇠 |
| 10 | `compass.png` | 나침반(지도 탭) |
| 11 | `potion.png` | 물약 |
| 12 | `level.png` | 레벨 별 |
| 13 | `xp.png` | 경험치 |
| 14 | `hourglass.png` | 모래시계 |
| 15 | `ticket.png` | 티켓/패스 |
| 16 | `mystery.png` | 미스터리 상자 |
| 17 | `scroll.png` | 두루마리 |
| 18 | `feather.png` | 깃펜 |
| 19 | `bag.png` | 돈주머니 |
| 20 | `gift.png` | 선물 |
| 21 | `map.png` | 지도 |
| 22 | `pin.png` | 핀(내 위치) |
| 23 | `flag.png` | 깃발(발견 완료) |
| 24 | `search.png` | 돋보기 |
| 25 | `binoculars.png` | 쌍안경 |
| 26 | `lantern.png` | 랜턴 |
| 27 | `campfire.png` / `streak.png` | 모닥불/스트릭 |
| 28–29 | `tent.png` | 텐트 |
| 31 | `avatar.png` | 아바타 |
| 33 | `shield.png` | 방패 |
| 34 | `sword.png` | 검 |
| 35 | `bow.png` | 활 |
| 36 | `book.png` | 도감(책) |
| 37 | `cap.png` | 학사모 |
| 38–39 | `trophy.png` | 트로피 |
| 40 | `medal.png` | 메달 |
| 41 | `cart.png` | 장바구니 |
| 42 | `shop.png` | 상점 |
| 43 | `sale.png` | 할인 태그 |
| 46 | `chart.png` | 통계 |
| 47 | `scales.png` | 저울 |
| 47 | `trend.png` | 상승 그래프 |
| 50 | `wallet.png` | 지갑 |
| 51–52 | `family.png` | 가족 |
| 53 | `chat.png` | 말풍선 |
| 54 | `mail.png` | 편지 |
| 55 | `handshake.png` | 악수 |
| 56 | `like.png` | 따봉 |
| 58 | `crown.png` | 왕관 |
| 61–62 | `settings.png` | 설정 |
| 63 | `lock.png` | 잠금 |
| 64 | `unlock.png` | 잠금해제 |
| 65 | `bell.png` | 알림 |
| 66 | `megaphone.png` | 확성기(피드) |
| 68 | `calendar.png` | 달력 |
| 69–70 | `refresh.png` | 새로고침 |
| 71 | `target.png` | 타깃 |
| 72 | `checklist.png` | 체크리스트 |
| 77–78 | `check.png` | 완료 체크 |
| 81 | `home.png` | 홈(부모 모드) |
| 82 | `back.png` | 뒤로 |
| 84 | `compass.png` | (지도 나침반) |
| 85 | `backpack.png` | 배낭 |
| 89 | `menu.png` | 메뉴 |
| 90 | `close.png` | 닫기 |
| 91 | `bolt.png` | 번개 |
| 92 | `heart.png` | 하트 |
| 93 | `star.png` | 별 |
| 94 | `leaf.png` | 잎 |
| 95 | `sun.png` | 라이트 테마 |
| 96 | `moon.png` | 다크 테마 |
| 100 | `paw.png` | 발자국 |

추가로 앱 전용: `steps.png`(걸음/운동화), `cert.png`(인증서), `share.png`(공유),
`edit.png`(수정), `trash.png`(삭제), `photo.png`(사진), `chest-open.png`(열린 상자).

## 새 아이콘 추가법
`components/kit/Icon.tsx` 의 `REG` 에 `이름: { file, emoji }` 한 줄 추가 → 어디서든 `<Icon name="이름" />`.
