import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthHandler } from '@/components/AuthHandler';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SolanaProvider } from '@/firebase/solana-provider';
import '@solana/wallet-adapter-react-ui/styles.css';

export const metadata: Metadata = {
  title: 'SPOTLY',
  description: 'Discover the next big thing.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&family=Belleza&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <SolanaProvider>
          <FirebaseClientProvider>
            <AuthHandler>
              {children}
              <Toaster />
            </AuthHandler>
          </FirebaseClientProvider>
        </SolanaProvider>
      </body>
    </html>
  );
}
