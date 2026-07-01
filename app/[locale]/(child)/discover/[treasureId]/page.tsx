'use client';

import { use, useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { TreasureChest } from '@/components/discover/TreasureChest';
import { RewardBurst } from '@/components/discover/RewardBurst';
import { getTreasure } from '@/lib/firebase/treasures';
import {
  getChildClaim,
  requestClaim,
  uploadCertificate,
} from '@/lib/firebase/claims';
import { generateCertificate, shareCertificate } from '@/lib/certificate';
import { COIN_PER_FIND } from '@/lib/gamification/economy';
import type { Claim, Treasure } from '@/lib/types';

export default function DiscoverPage({
  params,
}: {
  params: Promise<{ treasureId: string }>;
}) {
  const { treasureId } = use(params);
  const t = useTranslations('discover');
  const tc = useTranslations('common');
  const tcert = useTranslations('certificate');
  const format = useFormatter();
  const { family, children, activeChildId } = useAuth();
  const child = children.find((c) => c.id === activeChildId) ?? null;

  const [treasure, setTreasure] = useState<Treasure | null>(null);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [opened, setOpened] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (!family) return;
    getTreasure(family.id, treasureId).then(setTreasure).catch(console.error);
    if (child) {
      getChildClaim(family.id, treasureId, child.id)
        .then((c) => {
          setClaim(c);
          if (c?.status === 'REQUESTED' || c?.status === 'PAID') {
            setOpened(true);
            setRequested(true);
          }
        })
        .catch(console.error);
    }
  }, [family, treasureId, child]);

  function handleOpen() {
    if (opened) return;
    setOpened(true);
    navigator.vibrate?.([40, 30, 80, 30, 160]); // 팡파르 햅틱
  }

  async function handleRequest() {
    if (!family || !child || !treasure || !claim) return;
    setRequesting(true);
    try {
      const foundDate = new Date(claim.foundAt);
      const blob = await generateCertificate({
        titleLabel: tcert('title'),
        explorerLabel: tcert('explorer'),
        explorerName: child.displayName,
        foundAtLabel: tcert('foundAt'),
        foundAt: foundDate.toLocaleString(),
        stepsLabel: tcert('steps'),
        steps: claim.stepsToday ?? 0,
        amountLabel: tcert('amount'),
        amount: `${format.number(treasure.reward.amount)} ${tc('krw')}`,
        idLabel: tcert('id'),
        discoveryId: claim.id.slice(0, 8).toUpperCase(),
      });

      let certUrl: string | null = null;
      try {
        certUrl = await uploadCertificate(family.id, blob);
      } catch (e) {
        console.error('certificate upload failed', e);
      }

      await requestClaim(family.id, treasure.id, claim.id, certUrl);
      setRequested(true);

      // 가족에 공유 (KAKAO_SHARE)
      await shareCertificate(
        blob,
        t('shareText', {
          name: child.displayName,
          amount: format.number(treasure.reward.amount),
          currency: tc('krw'),
        }),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="relative w-full max-w-md text-center">
        <RewardBurst play={opened} />

        <h1
          className={`text-3xl font-extrabold text-[var(--tq-gold-deep)] tq-glow ${
            opened ? 'tq-pop' : ''
          }`}
        >
          {t('found')}
        </h1>
        {treasure?.title && (
          <p className="mt-1 text-[var(--tq-ink-soft)]">{treasure.title}</p>
        )}

        <div className="my-4 grid place-items-center">
          <TreasureChest opened={opened} onOpen={handleOpen} />
        </div>

        {!opened && (
          <p className="text-[var(--tq-ink-soft)]">{t('tapToOpen')}</p>
        )}

        {opened && treasure && (
          <div className="tq-pop">
            <p className="text-2xl font-extrabold text-[var(--tq-jewel)]">
              {t('reward', {
                amount: `${format.number(treasure.reward.amount)} ${tc('krw')}`,
              })}
            </p>
            <p className="mt-1 text-[var(--tq-gold-deep)]">
              {t('coinsEarned', { coins: COIN_PER_FIND })}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              {!requested ? (
                <button
                  type="button"
                  className="tq-btn tq-btn-primary"
                  onClick={handleRequest}
                  disabled={requesting || !claim}
                >
                  {requesting ? t('requesting') : `🧾 ${t('requestAllowance')}`}
                </button>
              ) : (
                <p className="font-bold text-[var(--tq-jewel)]">
                  ✓ {t('requested')}
                </p>
              )}
              <Link href="/map" className="tq-btn tq-btn-secondary">
                {t('backToMap')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
