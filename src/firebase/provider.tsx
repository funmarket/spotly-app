'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Loader2 } from 'lucide-react';

interface FirebaseProviderProps {
  children: React.Node;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean; // Maintained for components that might still need it
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser extends FirebaseContextState {}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 * It now includes an "auth-gate" which ensures a user (including anonymous) is authenticated
 * before rendering the main application, preventing race-condition permission errors.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false); // The new auth-gate state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Force an anonymous sign-in if no user exists.
        // onAuthStateChanged will fire again with the new anonymous user.
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("FirebaseProvider: Failed to sign in anonymously", error);
          // If even anonymous sign-in fails, we unblock the app but with no user.
          setAuthReady(true);
        }
      } else {
        // A user (regular or anonymous) exists.
        setUser(firebaseUser);
        setAuthReady(true);
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [auth]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp,
    firestore,
    auth,
    user,
    isUserLoading: !authReady,
  }), [firebaseApp, firestore, auth, user, authReady]);
  
  // Do not render children until authentication is ready.
  // This is the auth-gate.
  if (!authReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


// --- EXISTING HOOKS ---

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if used outside of FirebaseProvider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  return context;
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 */
export const useUser = (): { user: User | null; isUserLoading: boolean } => {
  const { user, isUserLoading } = useFirebase();
  return { user, isUserLoading };
};
