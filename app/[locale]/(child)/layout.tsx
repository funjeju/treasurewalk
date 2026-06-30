import type { ReactNode } from 'react';
import { AppHeader } from '@/components/ui/AppHeader';
import { AuthGate } from '@/components/auth/AuthGate';

export default function ChildLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <AuthGate>
        <main className="mx-auto max-w-3xl px-3 py-3">{children}</main>
      </AuthGate>
    </>
  );
}
