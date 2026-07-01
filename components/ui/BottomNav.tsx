'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';

/** 아이 모드 하단 게임 탭바 (키트 스타일). */
export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const items = [
    { href: '/map', ico: '🧭', label: t('map') },
    { href: '/collection', ico: '📖', label: t('collection') },
    { href: '/dashboard', ico: '🏠', label: t('parentMode') },
  ] as const;

  return (
    <nav className="glass g-tabbar fixed bottom-3 left-1/2 z-40 w-[min(94%,24rem)] -translate-x-1/2">
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + '/');
        return (
          <Link
            key={it.href}
            href={it.href}
            className="g-tab"
            data-active={active}
            aria-current={active ? 'page' : undefined}
          >
            <span className="g-tab-ico" aria-hidden>
              {it.ico}
            </span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
