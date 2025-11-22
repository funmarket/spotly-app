'use client';
import { AuthHandler } from '@/components/AuthHandler';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SolanaProvider } from '@/firebase/solana-provider';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SolanaProvider>
      <FirebaseClientProvider>
        <AuthHandler>{children}</AuthHandler>
      </FirebaseClientProvider>
    </SolanaProvider>
  );
}
