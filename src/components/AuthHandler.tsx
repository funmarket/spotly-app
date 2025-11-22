
'use client';

import { useEffect, useState } from 'react';
import { useDevapp } from '@/hooks/use-devapp';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export function AuthHandler({ children }: { children: React.ReactNode }) {
  const { userWallet, firestore } = useDevapp();
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false); // New state to prevent re-running auth logic

  useEffect(() => {
    if (!firestore) return;

    const auth = getAuth();
    
    // This listener handles the auth state and ensures user docs exist.
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        // User is signed in. Ensure their doc exists.
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
           try {
               // Use wallet address for new docs if available, otherwise fall back to UID
               const wallet = userWallet || user.uid;
               await setDoc(doc(firestore, 'users', wallet), {
                   walletAddress: wallet,
                   username: `User_${wallet.substring(0, 4)}...`,
                   role: 'regular',
                   profilePhotoUrl: `https://picsum.photos/seed/${wallet}/400`,
                   bannerPhotoUrl: `https://picsum.photos/seed/banner-${wallet}/1200/400`,
                   createdAt: serverTimestamp(),
                   updatedAt: serverTimestamp(),
               });
           } catch (e) {
               console.error("Failed to create user doc:", e);
           }
        }
      }
      
      // We've checked the auth state. Stop loading and mark as checked.
      setIsLoading(false);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [firestore, userWallet]); // userWallet is needed to create doc with correct ID

  useEffect(() => {
      // This effect runs separately to trigger anonymous sign-in ONCE.
      if (authChecked && !isLoading) {
          const auth = getAuth();
          if (!auth.currentUser) {
              signInAnonymously(auth).catch(error => {
                  console.error('Error during anonymous sign-in:', error);
                  // Even if sign-in fails, we should stop the loading spinner.
                  setIsLoading(false);
              });
          }
      }
  }, [authChecked, isLoading]);


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
