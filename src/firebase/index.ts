'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This file is now primarily for client-side Firebase initialization and hook exports.
// The DevFun SDK will handle wallet interactions.

// --- Centralized Firebase Instances ---
let firebaseApp: FirebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

const auth: Auth = getAuth(firebaseApp);
const firestore: Firestore = getFirestore(firebaseApp);

export { firebaseApp, auth, firestore };

// --- Provider and Hooks ---
export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';

// Note: No client-provider export is needed with the new structure
