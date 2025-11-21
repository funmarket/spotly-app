'use client';

import { SolanaProvider } from '@/firebase/solana-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';

// This layout is necessary to ensure that all pages in the (auth) group
// have access to the Firebase context provided by FirebaseClientProvider.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The actual providers (Solana, Firebase) are needed here to wrap the auth pages
  return (
    <SolanaProvider>
      <FirebaseClientProvider>
        {children}
      </FirebaseClientProvider>
    </SolanaProvider>
  );
}
