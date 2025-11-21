'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';
import { getPerformance, Performance } from 'firebase/performance';


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length === 0) {
    // If no app is initialized, initialize one with the provided config.
    // This is the standard path for client-side initialization.
    initializeApp(firebaseConfig);
  }

  // Get the initialized app and return the SDKs.
  // This ensures we don't re-initialize the app on every render.
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);

  let analytics: Analytics | null = null;
  let performance: Performance | null = null;

  if (typeof window !== 'undefined') {
    isAnalyticsSupported().then(yes => {
      if (yes) {
        analytics = getAnalytics(firebaseApp);
      }
    });
    performance = getPerformance(firebaseApp);
  }
  
  return {
    firebaseApp,
    auth,
    firestore,
    analytics,
    performance,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
