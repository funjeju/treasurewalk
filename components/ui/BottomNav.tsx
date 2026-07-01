'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';

/** 아이 모드 하단 게임 내비게이션 — 지도 / 도감 / 부모 모드(홈). */
export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const items = [
    { href: '/map', ico: '🧭', label: t('map') },
    { href: '/collection', ico: '📖', label: t('collection') },
    { href: '/dashboard', ico: '🏠', label: t('parentMode') },
  ] as const;

  return (
    <nav className="tq-bottom-nav" aria-label={t('map')}>
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + '/');
        return (
          <Link
            key={it.href}
            href={it.href}
            className="tq-nav-item"
            data-active={active}
            aria-current={active ? 'page' : undefined}
          >
            <span className="tq-nav-ico" aria-hidden>
              {it.ico}
            </span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
