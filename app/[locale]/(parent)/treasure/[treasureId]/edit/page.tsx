'use client';

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';
import { TreasureForm } from '@/components/treasure/TreasureForm';
import { getTreasure } from '@/lib/firebase/treasures';
import type { Treasure } from '@/lib/types';

export default function EditTreasurePage({
  params,
}: {
  params: Promise<{ treasureId: string }>;
}) {
  const { treasureId } = use(params);
  const tc = useTranslations('common');
  const { family, loading } = useAuth();
  const [treasure, setTreasure] = useState<Treasure | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!family) return;
    getTreasure(family.id, treasureId)
      .then((t) => (t ? setTreasure(t) : setNotFound(true)))
      .catch(() => setNotFound(true));
  }, [family, treasureId]);

  if (loading || (!treasure && !notFound)) {
    return <p className="text-[var(--tq-ink-soft)]">{tc('loading')}</p>;
  }
  if (notFound || !treasure) {
    return <p className="text-[var(--tq-ink-soft)]">{tc('error')}</p>;
  }
  return <TreasureForm edit={treasure} />;
}
