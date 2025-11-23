'use client';
import { AuthHandler } from '@/components/AuthHandler';
import { SolanaProvider } from '@/firebase/solana-provider';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SolanaProvider>
        <AuthHandler>{children}</AuthHandler>
    </SolanaProvider>
  );
}


    