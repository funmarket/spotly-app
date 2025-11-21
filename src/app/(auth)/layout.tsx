'use client';

// This layout is necessary to ensure that all pages in the (auth) group
// have access to the Firebase context provided by FirebaseClientProvider.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The actual providers (Solana, Firebase) are in the root layout (app/layout.tsx),
  // which wraps this layout. We just need this file to exist to create the layout boundary.
  return <>{children}</>;
}
