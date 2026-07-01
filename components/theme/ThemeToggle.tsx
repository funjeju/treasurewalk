'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

const ORDER = ['system', 'light', 'dark'] as const;
type Mode = (typeof ORDER)[number];

const ICON: Record<Mode, string> = { system: '🖥️', light: '☀️', dark: '🌙' };

export function ThemeToggle() {
  const t = useTranslations('theme');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // FOUC/하이드레이션 방지: mounted 후 렌더 (docs/06 §2.1)
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <span className="tq-btn tq-btn-ghost" aria-hidden style={{ width: 44 }} />;
  }

  const current = (ORDER.includes(theme as Mode) ? theme : 'system') as Mode;
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  return (
    <button
      type="button"
      className="tq-btn tq-btn-ghost shrink-0 whitespace-nowrap px-2"
      onClick={() => setTheme(next)}
      aria-label={`${t('label')}: ${t(current)} → ${t(next)}`}
      title={`${t('label')}: ${t(current)}`}
    >
      <span aria-hidden>{ICON[current]}</span>
      <span className="hidden text-sm sm:inline">{t(current)}</span>
    </button>
  );
}
