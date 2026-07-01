'use client';

import { useCallback, useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';
import { ChildSwitcher } from '@/components/child/ChildSwitcher';
import { useStepCounter } from '@/lib/hooks/useStepCounter';
import {
  computeWallet,
  requestAllowance,
  listAllowanceRequests,
  type Wallet,
} from '@/lib/firebase/allowance';
import type { AllowanceRequest } from '@/lib/types';
import { GlassCard, GlassInset, GButton, Icon, SectionTitle, Chip } from '@/components/kit';

export default function WalletPage() {
  const t = useTranslations('wallet');
  const tc = useTranslations('common');
  const format = useFormatter();
  const { family, children, activeChildId } = useAuth();
  const child = children.find((c) => c.id === activeChildId) ?? null;
  const { steps } = useStepCounter(child?.id ?? null);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [requests, setRequests] = useState<AllowanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [justRequested, setJustRequested] = useState(false);

  const load = useCallback(async () => {
    if (!family || !child) return;
    setLoading(true);
    try {
      const [w, r] = await Promise.all([
        computeWallet(family.id, child, steps, family.stepGoals),
        listAllowanceRequests(family.id),
      ]);
      setWallet(w);
      setRequests(r.filter((x) => x.childId === child.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [family, child, steps]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRequest() {
    if (!family || !child || !wallet) return;
    setBusy(true);
    try {
      const id = await requestAllowance(family.id, child, wallet, steps);
      if (id) {
        setJustRequested(true);
        navigator.vibrate?.([40, 30, 80]);
        await load();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  if (!child) return <p className="text-[var(--g-dim)]">{tc('loading')}</p>;

  return (
    <div className="space-y-4">
      <SectionTitle action={<ChildSwitcher />}>
        <span className="inline-flex items-center gap-2">
          <Icon name="wallet" size={22} /> {t('title')}
        </span>
      </SectionTitle>

      {/* 총 받을 용돈 */}
      <GlassCard className="p-5 text-center">
        <p className="text-sm font-bold text-[var(--g-dim)]">{t('total')}</p>
        <p className="mt-1 text-5xl font-black text-[var(--g-gold)]">
          {format.number(wallet?.total ?? 0)}
          <span className="ml-1 text-2xl">{tc('krw')}</span>
        </p>

        {wallet && (wallet.treasureAmount > 0 || wallet.stepClaimable > 0) && (
          <GlassInset className="mt-4 space-y-2 p-3 text-left">
            {wallet.treasureAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm">
                  <Icon name="chest" size={18} /> {t('fromTreasures')}{' '}
                  <span className="text-[var(--g-dim)]">×{wallet.lines.length}</span>
                </span>
                <span className="font-extrabold">
                  {format.number(wallet.treasureAmount)}
                  {tc('krw')}
                </span>
              </div>
            )}
            {wallet.stepClaimable > 0 && (
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm">
                  <Icon name="steps" size={18} /> {t('fromSteps')}{' '}
                  <span className="text-[var(--g-dim)]">
                    {t('stepsLine', { steps: format.number(steps) })}
                  </span>
                </span>
                <span className="font-extrabold">
                  {format.number(wallet.stepClaimable)}
                  {tc('krw')}
                </span>
              </div>
            )}
          </GlassInset>
        )}

        {justRequested ? (
          <p className="mt-4 font-extrabold text-[var(--g-green)]">✓ {t('requested')}</p>
        ) : (
          <GButton
            variant="gold"
            block
            className="mt-4"
            disabled={busy || loading || !wallet || wallet.total <= 0}
            onClick={handleRequest}
          >
            <Icon name="bag" size={18} /> {busy ? t('requesting') : t('request')}
          </GButton>
        )}

        {!loading && wallet && wallet.total <= 0 && !justRequested && (
          <p className="mt-3 text-sm text-[var(--g-dim)]">{t('empty')}</p>
        )}
      </GlassCard>

      {/* 대기 중 / 지난 요청 */}
      {requests.length > 0 && (
        <section>
          <h3 className="mb-2 font-bold text-[var(--g-dim)]">{t('history')}</h3>
          <ul className="space-y-2">
            {requests.map((r) => (
              <li
                key={r.id}
                className="glass flex items-center justify-between px-4 py-3"
              >
                <span className="inline-flex items-center gap-2">
                  <Icon name="coin" size={18} />
                  <span className="font-extrabold">
                    {format.number(r.total)}
                    {tc('krw')}
                  </span>
                </span>
                {r.status === 'PAID' ? (
                  <Chip variant="gold">✓ {tc('done')}</Chip>
                ) : (
                  <Chip>{t('pending')}</Chip>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
