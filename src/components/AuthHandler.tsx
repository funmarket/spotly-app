'use client';

import { useEffect, useState } from 'react';
import { useDevapp } from '@/hooks/use-devapp';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export function AuthHandler({ children }: { children: React.ReactNode }) {
  const { userWallet, firestore } = useDevapp();
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!firestore) {
        // Firestore is not ready yet, wait.
        return;
    }
    
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (userWallet) { // A wallet is connected
            if (user && user.uid === userWallet) { // Correct user is logged in
                const userDocRef = doc(firestore, 'users', userWallet);
                const userDoc = await getDoc(userDocRef);
                if (!userDoc.exists()) {
                    console.log(`Creating new user profile for wallet: ${userWallet}`);
                    const newUser = {
                        walletAddress: userWallet,
                        username: `User_${userWallet.substring(0, 4)}...${userWallet.substring(userWallet.length - 4)}`,
                        bio: '',
                        role: 'regular',
                        profilePhotoUrl: `https://picsum.photos/seed/${userWallet}/400`,
                        bannerPhotoUrl: `https://picsum.photos/seed/banner-${userWallet}/1200/400`,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    };
                    try {
                        await setDoc(userDocRef, newUser);
                    } catch (e) {
                        console.error("Failed to create user doc:", e);
                    }
                }
                setIsLoading(false);
                setAuthChecked(true);
            } else { // No user or wrong user, sign in with custom token logic
                setIsLoading(true);
                // In a real app, this would be a secure call to a backend to create a custom token
                // For this dev environment, we'll use anonymous sign-in as a stand-in.
                // It won't link the UID to the wallet, but it provides a valid auth context.
                signInAnonymously(auth)
                    .catch((error) => {
                        console.error('Anonymous sign-in error:', error);
                    })
                    .finally(() => {
                        // The onAuthStateChanged listener will re-run after sign-in completes.
                        // We don't stop loading here, we wait for the next auth state change.
                    });
            }
        } else { // No wallet is connected
            if (user && !user.isAnonymous) {
                // If there's a logged-in user but no wallet, sign them out.
                auth.signOut();
            }
            setIsLoading(false);
            setAuthChecked(true);
        }
    });

    return () => unsubscribe();
  }, [userWallet, firestore]);
  
  if (isLoading || !authChecked) {
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
