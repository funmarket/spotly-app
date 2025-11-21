'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// Create a singleton instance of Firebase services on the client
const firebaseServices = typeof window !== 'undefined' ? initializeFirebase() : null;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // The value is memoized and will not change, preventing re-initializations
  const value = useMemo(() => {
    if (!firebaseServices) {
      // This should ideally not happen on the client. 
      // It might run on the server, in which case we provide nulls.
      return {
        firebaseApp: null,
        auth: null,
        firestore: null,
      };
    }
    return firebaseServices;
  }, []);

  if (!value.firebaseApp || !value.auth || !value.firestore) {
    // Render nothing or a loader on the server or if initialization failed.
    // The actual app content will render once Firebase is available on the client.
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={value.firebaseApp}
      auth={value.auth}
      firestore={value.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}