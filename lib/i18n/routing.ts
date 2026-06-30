import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ko', 'en'], // P1: 최소 2개. 확장: ja, zh, es...
  defaultLocale: 'ko',
});

export type Locale = (typeof routing.locales)[number];
