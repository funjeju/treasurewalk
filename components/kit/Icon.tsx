'use client';

import { useState } from 'react';

/**
 * 아이콘 레지스트리 — 이름 → { PNG 경로, 이모지 폴백 }.
 * public/assets/icons/<파일>.png 이 있으면 프리미엄 아이콘, 없으면 이모지.
 * → 아이콘 세트를 드롭하면 앱 전체가 코드 변경 없이 교체된다.
 * 파일명은 public/assets/icons/README(매니페스트) 참조.
 */
const REG: Record<string, { file: string; emoji: string }> = {
  // 01–20 기본·화폐 / 보상
  coin: { file: 'coin', emoji: '🪙' },
  gem: { file: 'gem', emoji: '💎' },
  gemPurple: { file: 'gem-purple', emoji: '🔮' },
  gemGreen: { file: 'gem-green', emoji: '💚' },
  goldbar: { file: 'goldbar', emoji: '🧈' },
  potion: { file: 'potion', emoji: '🧪' },
  level: { file: 'level', emoji: '⭐' },
  xp: { file: 'xp', emoji: '✨' },
  hourglass: { file: 'hourglass', emoji: '⏳' },
  ticket: { file: 'ticket', emoji: '🎫' },
  mystery: { file: 'mystery', emoji: '❓' },
  scroll: { file: 'scroll', emoji: '📜' },
  feather: { file: 'feather', emoji: '🪶' },
  bag: { file: 'bag', emoji: '💰' },
  gift: { file: 'gift', emoji: '🎁' },
  // 21–30 탐험·지도
  map: { file: 'map', emoji: '🗺️' },
  pin: { file: 'pin', emoji: '📍' },
  flag: { file: 'flag', emoji: '🚩' },
  search: { file: 'search', emoji: '🔍' },
  binoculars: { file: 'binoculars', emoji: '🔭' },
  lantern: { file: 'lantern', emoji: '🏮' },
  campfire: { file: 'campfire', emoji: '🔥' },
  streak: { file: 'streak', emoji: '🔥' },
  tent: { file: 'tent', emoji: '⛺' },
  compass: { file: 'compass', emoji: '🧭' },
  chest: { file: 'chest', emoji: '🎁' },
  chestOpen: { file: 'chest-open', emoji: '💰' },
  key: { file: 'key', emoji: '🗝️' },
  steps: { file: 'steps', emoji: '👟' },
  // 31–40 캐릭터·성장
  avatar: { file: 'avatar', emoji: '🧭' },
  shield: { file: 'shield', emoji: '🛡️' },
  sword: { file: 'sword', emoji: '⚔️' },
  bow: { file: 'bow', emoji: '🏹' },
  book: { file: 'book', emoji: '📖' },
  cap: { file: 'cap', emoji: '🎓' },
  trophy: { file: 'trophy', emoji: '🏆' },
  medal: { file: 'medal', emoji: '🎖️' },
  // 41–50 상점·경제
  cart: { file: 'cart', emoji: '🛒' },
  shop: { file: 'shop', emoji: '🛍️' },
  sale: { file: 'sale', emoji: '🏷️' },
  chart: { file: 'chart', emoji: '📊' },
  scales: { file: 'scales', emoji: '⚖️' },
  trend: { file: 'trend', emoji: '📈' },
  wallet: { file: 'wallet', emoji: '👛' },
  // 51–60 소셜
  family: { file: 'family', emoji: '👨‍👩‍👧' },
  chat: { file: 'chat', emoji: '💬' },
  mail: { file: 'mail', emoji: '✉️' },
  handshake: { file: 'handshake', emoji: '🤝' },
  like: { file: 'like', emoji: '👍' },
  crown: { file: 'crown', emoji: '👑' },
  // 61–70 시스템
  settings: { file: 'settings', emoji: '⚙️' },
  lock: { file: 'lock', emoji: '🔒' },
  unlock: { file: 'unlock', emoji: '🔓' },
  bell: { file: 'bell', emoji: '🔔' },
  megaphone: { file: 'megaphone', emoji: '📣' },
  wifi: { file: 'wifi', emoji: '📶' },
  calendar: { file: 'calendar', emoji: '📅' },
  refresh: { file: 'refresh', emoji: '🔄' },
  // 71–90 미션·UI·네비
  target: { file: 'target', emoji: '🎯' },
  checklist: { file: 'checklist', emoji: '📋' },
  home: { file: 'home', emoji: '🏠' },
  back: { file: 'back', emoji: '⬅️' },
  backpack: { file: 'backpack', emoji: '🎒' },
  check: { file: 'check', emoji: '✅' },
  menu: { file: 'menu', emoji: '☰' },
  close: { file: 'close', emoji: '✕' },
  cert: { file: 'cert', emoji: '🧾' },
  share: { file: 'share', emoji: '📤' },
  edit: { file: 'edit', emoji: '✏️' },
  trash: { file: 'trash', emoji: '🗑️' },
  photo: { file: 'photo', emoji: '🖼️' },
  // 91–100 기타
  bolt: { file: 'bolt', emoji: '⚡' },
  heart: { file: 'heart', emoji: '❤️' },
  star: { file: 'star', emoji: '⭐' },
  leaf: { file: 'leaf', emoji: '🍃' },
  sun: { file: 'sun', emoji: '☀️' },
  moon: { file: 'moon', emoji: '🌙' },
  paw: { file: 'paw', emoji: '🐾' },
};

export type IconName = keyof typeof REG;

export function Icon({
  name,
  size = 20,
  className,
  title,
}: {
  name: IconName;
  size?: number;
  className?: string;
  title?: string;
}) {
  const entry = REG[name];
  const [failed, setFailed] = useState(false);

  if (entry && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/assets/icons/${entry.file}.png`}
        alt={title ?? ''}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'contain', display: 'inline-block' }}
        onError={() => setFailed(true)}
        draggable={false}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={className}
      style={{ fontSize: size * 0.92, lineHeight: 1, display: 'inline-block' }}
    >
      {entry?.emoji ?? '•'}
    </span>
  );
}
