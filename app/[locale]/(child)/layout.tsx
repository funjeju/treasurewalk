import type { ReactNode } from 'react';
import { AppHeader } from '@/components/ui/AppHeader';
import { AuthGate } from '@/components/auth/AuthGate';
import { BottomNav } from '@/components/ui/BottomNav';

export default function ChildLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <AuthGate>
        {/* 하단 내비 높이만큼 여백 확보 */}
        <main className="mx-auto max-w-3xl px-3 py-3 pb-28">{children}</main>
        <BottomNav />
      </AuthGate>
    </>
  );
}
