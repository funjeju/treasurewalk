import type { ReactNode } from 'react';
import { AppHeader } from '@/components/ui/AppHeader';
import { AuthGate } from '@/components/auth/AuthGate';
import { ParentGuard } from '@/components/auth/ParentGuard';

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <AuthGate>
        <ParentGuard>
          <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
        </ParentGuard>
      </AuthGate>
    </>
  );
}
