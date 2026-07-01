'use client';

import { use, useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { TreasureReveal } from '@/components/discover/TreasureReveal';
import { Roulette } from '@/components/discover/Roulette';
import { getTreasure } from '@/lib/firebase/treasures';
import { getChildClaim, setClaimWonPrize } from '@/lib/firebase/claims';
import { COIN_PER_FIND } from '@/lib/gamification/economy';
import { Icon } from '@/components/kit';
import type { Claim, Treasure } from '@/lib/types';

export default function DiscoverPage({
  params,
}: {
  params: Promise<{ treasureId: string }>;
}) {
  const { treasureId } = use(params);
  const t = useTranslations('discover');
  const tc = useTranslations('common');
  const format = useFormatter();
  const { family, children, activeChildId } = useAuth();
  const child = children.find((c) => c.id === activeChildId) ?? null;

  const [treasure, setTreasure] = useState<Treasure | null>(null);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [opened, setOpened] = useState(false);
  const [wonIndex, setWonIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!family) return;
    getTreasure(family.id, treasureId).then(setTreasure).catch(console.error);
    if (child) {
      getChildClaim(family.id, treasureId, child.id).then(setClaim).catch(console.error);
    }
  }, [family, treasureId, child]);

  const isRoulette = treasure?.rewardMode === 'ROULETTE' && !!treasure.roulette?.items?.length;
  const items = treasure?.roulette?.items ?? [];

  // 이미 뽑은 결과가 있으면 그 칸 인덱스
  const predetermined =
    claim?.wonLabel != null
      ? items.findIndex(
          (it) => it.label === claim.wonLabel && it.amount === (claim.wonAmount ?? 0),
        )
      : null;
  const alreadyWon = predetermined != null && predetermined >= 0;

  function handleOpen() {
    if (opened) return;
    setOpened(true);
    navigator.vibrate?.([40, 30, 80, 30, 160]);
  }

  async function handleRouletteResult(index: number) {
    setWonIndex(index);
    if (!family || !treasure || !claim) return;
    const it = items[index];
    try {
      await setClaimWonPrize(family.id, treasure.id, claim.id, {
        label: it.label,
        amount: it.amount,
      });
    } catch (e) {
      console.error('setClaimWonPrize failed', e);
    }
  }

  const showResultCta = !isRoulette || alreadyWon || wonIndex != null;

  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="relative w-full max-w-md text-center">
        <h1
          className={`text-3xl font-black text-[var(--g-gold)] tq-glow ${
            opened ? 'tq-pop' : ''
          }`}
        >
          {t('found')}
        </h1>
        {treasure?.title && <p className="mt-1 text-[var(--g-dim)]">{treasure.title}</p>}

        <div className="my-2">
          <TreasureReveal opened={opened} onOpen={handleOpen} />
        </div>

        {!opened && (
          <p className="animate-pulse font-bold text-[var(--g-gold)]">
            👆 {t('tapToOpen')}
          </p>
        )}

        {opened && treasure && (
          <div className="tq-pop">
            {/* 룰렛 보물 */}
            {isRoulette ? (
              <>
                <p className="mb-3 text-sm text-[var(--g-dim)]">{t('rouletteHint')}</p>
                <Roulette
                  items={items}
                  predetermined={alreadyWon ? predetermined : null}
                  onResult={handleRouletteResult}
                />
              </>
            ) : (
              <>
                <p className="tq-amount text-5xl">
                  {t('reward', {
                    amount: `${format.number(treasure.reward.amount)}${tc('krw')}`,
                  })}
                </p>
                <p className="g-chip g-chip-gold mt-1 text-sm">
                  <Icon name="coin" size={13} /> {t('coinsEarned', { coins: COIN_PER_FIND })}
                </p>
              </>
            )}

            {showResultCta && (
              <>
                <p className="mt-4 flex items-center justify-center gap-1 font-bold text-[var(--g-green)]">
                  <Icon name="bag" size={16} /> {t('addedToWallet')}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Link href="/wallet" className="g-btn g-btn-gold">
                    <Icon name="bag" size={18} /> {t('viewWallet')}
                  </Link>
                  <Link href="/map" className="g-btn g-btn-glass">
                    {t('backToMap')}
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
