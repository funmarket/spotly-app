'use client';

import { SolanaProvider } from '@/firebase/solana-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';

// This layout is necessary to ensure that all pages in the (auth) group
// have access to the Firebase context provided by FirebaseClientProvider and SolanaProvider.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The providers are needed here to wrap the auth pages since they don't
  // inherit from the root layout's body tag.
  return (
    <SolanaProvider>
      <FirebaseClientProvider>
        {children}
        <Toaster />
      </FirebaseClientProvider>
    </SolanaProvider>
  );
}
