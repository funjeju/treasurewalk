'use client';

import { use, useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { TreasureReveal } from '@/components/discover/TreasureReveal';
import { getTreasure } from '@/lib/firebase/treasures';
import { COIN_PER_FIND } from '@/lib/gamification/economy';
import { Icon } from '@/components/kit';
import type { Treasure } from '@/lib/types';

export default function DiscoverPage({
  params,
}: {
  params: Promise<{ treasureId: string }>;
}) {
  const { treasureId } = use(params);
  const t = useTranslations('discover');
  const tc = useTranslations('common');
  const format = useFormatter();
  const { family } = useAuth();

  const [treasure, setTreasure] = useState<Treasure | null>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (!family) return;
    getTreasure(family.id, treasureId).then(setTreasure).catch(console.error);
  }, [family, treasureId]);

  function handleOpen() {
    if (opened) return;
    setOpened(true);
    navigator.vibrate?.([40, 30, 80, 30, 160]); // 팡파르 햅틱
  }

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
            <p className="tq-amount text-5xl">
              {t('reward', {
                amount: `${format.number(treasure.reward.amount)}${tc('krw')}`,
              })}
            </p>
            <p className="g-chip g-chip-gold mt-1 text-sm">
              <Icon name="coin" size={13} /> {t('coinsEarned', { coins: COIN_PER_FIND })}
            </p>

            <p className="mt-3 flex items-center justify-center gap-1 font-bold text-[var(--g-green)]">
              <Icon name="bag" size={16} /> {t('addedToWallet')}
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <Link href="/wallet" className="g-btn g-btn-gold">
                <Icon name="bag" size={18} /> {t('viewWallet')}
              </Link>
              <Link href="/map" className="g-btn g-btn-glass">
                {t('backToMap')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
