'use client';

import { useState } from 'react';
import {
  GameRoot,
  GlassCard,
  GlassInset,
  GButton,
  Orb,
  Stat,
  Progress,
  Chip,
  Segmented,
  Stars,
  CurrencyTag,
  SectionTitle,
  Avatar,
  GCard,
  CardThumb,
  TabBar,
  Tab,
  type Rarity,
} from '@/components/kit';

const COLLECT = [
  { name: '낡은 열쇠', icon: '🗝️', rarity: 'common' as Rarity, stars: 1, locked: false },
  { name: '고대 동전', icon: '🪙', rarity: 'rare' as Rarity, stars: 2, locked: false },
  { name: '바다의 조개', icon: '🐚', rarity: 'epic' as Rarity, stars: 3, locked: false },
  { name: '황금 나침반', icon: '🧭', rarity: 'legend' as Rarity, stars: 3, locked: false },
  { name: '???', icon: '🔒', rarity: 'common' as Rarity, stars: 0, locked: true },
  { name: '???', icon: '🔒', rarity: 'common' as Rarity, stars: 0, locked: true },
];

const SHOP = [
  { name: '탐험가 모자', icon: '🎩', price: 300, tag: 'LIMITED' },
  { name: '프리미엄 패스', icon: '🎫', price: 1000, tag: 'HOT' },
  { name: '보물 상자', icon: '🎁', price: 500, tag: '' },
];

export default function KitShowcase() {
  const [seg, setSeg] = useState<'all' | 'region' | 'set'>('all');
  const [tab, setTab] = useState('map');

  return (
    <GameRoot className="pb-28">
      <div className="mx-auto max-w-md space-y-5 p-4">
        <header className="pt-2 text-center">
          <h1 className="text-2xl font-black tracking-tight">
            TreasureQuest <span className="text-[var(--g-gold)]">UI KIT</span>
          </h1>
          <p className="text-sm text-[var(--g-dim)]">다크 프리미엄 · 재사용 컴포넌트</p>
        </header>

        {/* HUD */}
        <GlassCard className="p-3">
          <div className="flex items-center gap-3">
            <Avatar size={48} level={18}>
              🧑‍🚀
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold">지훈</p>
              <div className="mt-1 flex items-center gap-2">
                <Progress value={0.49} className="flex-1" />
                <span className="text-[0.7rem] text-[var(--g-dim)]">2,450/5,000</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Stat variant="gold" icon="🪙" value="2,450" />
            <Stat variant="gem" icon="💎" value="120" />
            <Stat variant="streak" icon="🔥" label="스트릭" value="12" />
            <Stat variant="steps" icon="👟" label="걸음" value="7,842" />
          </div>
        </GlassCard>

        {/* Buttons */}
        <section>
          <SectionTitle>Buttons</SectionTitle>
          <div className="flex flex-wrap gap-2">
            <GButton>🪙 용돈 요청</GButton>
            <GButton variant="glass">공유하기</GButton>
            <GButton variant="ghost">취소</GButton>
            <GButton variant="danger" size="sm">
              삭제
            </GButton>
          </div>
        </section>

        {/* Chips + Currency */}
        <section className="flex flex-wrap items-center gap-2">
          <Chip variant="gold">LIMITED</Chip>
          <Chip variant="red">HOT</Chip>
          <Chip variant="blue">NEW</Chip>
          <Chip variant="violet">EPIC</Chip>
          <Chip>일일</Chip>
          <CurrencyTag kind="coin" amount={2450} />
          <CurrencyTag kind="gem" amount={120} />
        </section>

        {/* Segmented */}
        <section className="space-y-3">
          <Segmented
            value={seg}
            onChange={setSeg}
            options={[
              { value: 'all', label: '전체' },
              { value: 'region', label: '지역별' },
              { value: 'set', label: '세트' },
            ]}
          />
          <GlassInset className="flex items-center justify-around p-3 text-center">
            <div>
              <p className="text-xl font-black text-[var(--g-gold)]">12 / 36</p>
              <p className="text-[0.7rem] text-[var(--g-dim)]">발견한 보물</p>
            </div>
            <div>
              <p className="text-xl font-black">33%</p>
              <p className="text-[0.7rem] text-[var(--g-dim)]">도감 완성도</p>
            </div>
            <div>
              <p className="text-xl font-black text-[var(--g-cyan)]">+10%</p>
              <p className="text-[0.7rem] text-[var(--g-dim)]">세트 효과</p>
            </div>
          </GlassInset>
        </section>

        {/* Collection cards */}
        <section>
          <SectionTitle action={<span className="text-xs text-[var(--g-dim)]">{seg}</span>}>
            보물 도감
          </SectionTitle>
          <div className="grid grid-cols-3 gap-2.5">
            {COLLECT.map((c, i) => (
              <GCard key={i} rarity={c.rarity} locked={c.locked}>
                <CardThumb>{c.icon}</CardThumb>
                <p className="mt-2 truncate text-center text-xs font-bold">{c.name}</p>
                <div className="mt-1 flex justify-center">
                  {c.locked ? (
                    <span className="text-[0.65rem] text-[var(--g-dim)]">🔒 미발견</span>
                  ) : (
                    <Stars value={c.stars} />
                  )}
                </div>
              </GCard>
            ))}
          </div>
        </section>

        {/* Shop items */}
        <section>
          <SectionTitle action={<CurrencyTag kind="coin" amount={2450} />}>상점</SectionTitle>
          <div className="grid grid-cols-3 gap-2.5">
            {SHOP.map((s, i) => (
              <GCard key={i} className="text-center">
                {s.tag && (
                  <div className="mb-1 flex justify-center">
                    <Chip variant={s.tag === 'LIMITED' ? 'gold' : 'red'}>{s.tag}</Chip>
                  </div>
                )}
                <CardThumb>{s.icon}</CardThumb>
                <p className="mt-2 truncate text-xs font-bold">{s.name}</p>
                <div className="mt-1 flex justify-center">
                  <CurrencyTag kind="coin" amount={s.price} className="text-sm" />
                </div>
              </GCard>
            ))}
          </div>
        </section>

        {/* Orbs */}
        <section>
          <SectionTitle>Icon orbs</SectionTitle>
          <div className="flex flex-wrap gap-2">
            <Orb variant="gold" lg>🪙</Orb>
            <Orb variant="gem" lg>💎</Orb>
            <Orb variant="xp" lg>XP</Orb>
            <Orb variant="streak" lg>🔥</Orb>
            <Orb variant="steps" lg>👟</Orb>
            <Orb variant="violet" lg>★</Orb>
          </div>
        </section>
      </div>

      {/* Tab bar */}
      <TabBar>
        <Tab active={tab === 'map'} icon="🧭" label="지도" onClick={() => setTab('map')} />
        <Tab active={tab === 'dex'} icon="📖" label="도감" onClick={() => setTab('dex')} />
        <Tab active={tab === 'shop'} icon="🛍️" label="보상" onClick={() => setTab('shop')} />
        <Tab active={tab === 'feed'} icon="📣" label="피드" onClick={() => setTab('feed')} />
        <Tab active={tab === 'set'} icon="⚙️" label="설정" onClick={() => setTab('set')} />
      </TabBar>
    </GameRoot>
  );
}
