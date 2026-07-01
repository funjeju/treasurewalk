'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { useTransition } from 'react';

const LABEL: Record<string, string> = { ko: '한국어', en: 'English' };

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <label
      className="g-chip shrink-0 whitespace-nowrap"
      style={{ padding: '0.35rem 0.6rem' }}
      aria-label="Language"
    >
      <span aria-hidden>🌐</span>
      <select
        className="max-w-[4.5rem] cursor-pointer bg-transparent font-bold text-[var(--g-ink)] outline-none sm:max-w-none"
        value={locale}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          startTransition(() => {
            // 테마 선택은 next-themes가 localStorage에 저장 → 리로드 후 복원 (docs/06 §2.3)
            router.replace(pathname, { locale: next });
          });
        }}
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {LABEL[l] ?? l}
          </option>
        ))}
      </select>
    </label>
  );
}
