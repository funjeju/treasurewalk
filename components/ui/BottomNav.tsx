'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { Icon, type IconName } from '@/components/kit';

/** 아이 모드 하단 게임 탭바 (키트 스타일). */
export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const items: { href: string; ico: IconName; label: string }[] = [
    { href: '/map', ico: 'compass', label: t('map') },
    { href: '/collection', ico: 'book', label: t('collection') },
    { href: '/dashboard', ico: 'home', label: t('parentMode') },
  ];

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
              <Icon name={it.ico} size={24} />
            </span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
