import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
// import { DevappProvider } from '@devfunlabs/web-sdk';
import { AuthHandler } from '@/components/AuthHandler';
import { FirebaseClientProvider } from '@/firebase/client-provider';

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
        <FirebaseClientProvider>
          {/* <DevappProvider
            rpcEndpoint="https://rpc.dev.fun/8ebc36bb1b2a0bb1139d"
            devbaseEndpoint="https://devbase.dev.fun"
            appId="8ebc36bb1b2a0bb1139d"
            autoConnect={false}
          > */}
            <AuthHandler>
              {children}
              <Toaster />
            </AuthHandler>
          {/* </DevappProvider> */}
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
