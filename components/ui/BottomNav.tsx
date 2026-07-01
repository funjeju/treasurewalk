'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { Icon, type IconName } from '@/components/kit';

/** 아이 모드 하단 게임 탭바 — 접기/펼치기, 부모 모드는 노출 안 함. */
export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  const items: { href: string; ico: IconName; label: string }[] = [
    { href: '/map', ico: 'compass', label: t('map') },
    { href: '/wallet', ico: 'bag', label: t('wallet') },
    { href: '/collection', ico: 'book', label: t('collection') },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-1.5">
      {/* 접기/펼치기 화살표 */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? '메뉴 접기' : '메뉴 펼치기'}
        aria-expanded={open}
        className="glass grid h-7 w-14 place-items-center rounded-full text-[var(--g-dim)] active:scale-95"
      >
        <span aria-hidden className="text-sm leading-none">
          {open ? '▾' : '▴'}
        </span>
      </button>

      {open && (
        <nav className="glass g-tabbar w-[min(88vw,20rem)]">
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
      )}
    </div>
  );
}
