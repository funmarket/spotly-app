'use client';

import React from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { firebaseApp, auth, firestore } from '@/firebase/index';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

/**
 * Provides Firebase services to its children by wrapping the FirebaseProvider
 * and passing the singleton instances of the Firebase services. This is intended
 * for client-side usage.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
