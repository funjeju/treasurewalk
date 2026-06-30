'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';

/** 자녀 프로필 전환 (P1: 자녀 독립 로그인 없음, 가족 세션 내 전환). docs/01 §5 */
export function ChildSwitcher() {
  const t = useTranslations('map');
  const { children, activeChildId, setActiveChildId } = useAuth();
  if (children.length <= 1) return null;

  return (
    <label className="tq-pill">
      <span aria-hidden>🧭</span>
      <span className="sr-only">{t('selectChild')}</span>
      <select
        className="bg-transparent font-bold outline-none"
        value={activeChildId ?? ''}
        onChange={(e) => setActiveChildId(e.target.value)}
      >
        {children.map((c) => (
          <option key={c.id} value={c.id}>
            {c.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}
