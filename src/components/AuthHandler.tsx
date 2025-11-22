
'use client';

import { useEffect, useState } from 'react';
import { useDevapp } from '@/hooks/use-devapp';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export function AuthHandler({ children }: { children: React.ReactNode }) {
  const { userWallet, firestore } = useDevapp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      // If a wallet is connected but there's no Firebase user (or the UID doesn't match),
      // we need to establish a session.
      if (userWallet && (!user || user.uid !== userWallet)) {
        
        // This is a simplified custom auth flow for the dev environment.
        // In a real app, you would securely verify the wallet on a backend
        // and return a custom token to sign in with.
        try {
            // For now, we sign out any existing different user
            if (user) await auth.signOut();

            // Attempt to sign in anonymously. Note: In this simplified flow,
            // the anonymous UID will NOT match the wallet address. The 'user'
            // object in the next onAuthStateChanged event will be an anonymous user.
            await signInAnonymously(auth);

            // We don't set loading to false here; we let the auth state listener
            // re-run with the new anonymous user.

        } catch (error) {
            console.error('Error during anonymous sign-in:', error);
            setIsLoading(false); // Auth failed, stop loading.
        }

      } else if (userWallet && user && user.uid === userWallet) {
        // This case is unlikely with the current logic but is good practice.
        // Wallet and Firebase user are aligned.
        setIsLoading(false);

      } else if (user && !userWallet) {
         // Logged in with Firebase but wallet disconnected, so sign out.
         await auth.signOut();
         // The listener will run again, but we can stop loading for now.
         setIsLoading(false);

      } else if (user) {
        // This is the most common case for a logged-in user:
        // An anonymous user from our flow exists. We ensure their profile doc is created.
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
           try {
               await setDoc(userDocRef, {
                   walletAddress: user.uid,
                   username: `User_${user.uid.substring(0, 4)}...`,
                   role: 'regular',
                   profilePhotoUrl: `https://picsum.photos/seed/${user.uid}/400`,
                   bannerPhotoUrl: `https://picsum.photos/seed/banner-${user.uid}/1200/400`,
                   createdAt: serverTimestamp(),
                   updatedAt: serverTimestamp(),
               });
           } catch (e) {
               console.error("Failed to create user doc:", e);
           }
        }
        setIsLoading(false);
      }
      else {
        // No wallet, no user. We are done.
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userWallet, firestore]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-black" style={{ height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-white">Authenticating Session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
