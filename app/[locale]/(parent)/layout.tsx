import type { ReactNode } from 'react';
import { AppHeader } from '@/components/ui/AppHeader';
import { AuthGate } from '@/components/auth/AuthGate';

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <AuthGate>
        <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
      </AuthGate>
    </>
  );
}
