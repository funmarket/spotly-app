'use client';

import { useEffect, useState } from 'react';
import { useDevapp } from '@/hooks/use-devapp';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

async function getCustomToken(walletAddress: string): Promise<string> {
  // In a real production app, you would make a secure API call to your backend
  // which would then use the Firebase Admin SDK to create a custom token.
  // The backend would verify the user's wallet signature to prove ownership.
  
  // For this development environment, we will simulate this backend call.
  // This is NOT secure for production.
  console.warn("Creating custom token on the client. This is for development purposes only and is not secure.");
  
  const body = JSON.stringify({ uid: walletAddress });

  // This is a simplified, insecure client-side "emulation" of a backend function.
  // We'll use a placeholder URL and just return a simulated token structure.
  // In a real scenario, this would be an HTTPS endpoint to a secure server.
  
  // Since we can't actually call a backend to create a real token,
  // we will just use anonymous sign-in which is the closest secure equivalent
  // that can be done purely on the client for this simulation.
  // For the purpose of this fix, we will simulate the process but depend on auth state change.
  return walletAddress; 
}


export function AuthHandler({ children }: { children: React.ReactNode }) {
  const { userWallet, firestore } = useDevapp();
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!userWallet || !firestore) {
      setIsLoading(false);
      setAuthChecked(true); // Nothing to do if no wallet
      return;
    }
    
    setIsLoading(true);

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If user is logged into Firebase Auth and their UID matches the wallet
      if (user && user.uid === userWallet) {
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
              console.log('User profile created successfully.');
            } catch (e) {
                console.error("Failed to create user doc:", e);
            }
        }
        setIsLoading(false);
        setAuthChecked(true);

      } else if (!user || user.uid !== userWallet) {
        // Not logged in, or logged in as a different user.
        // We will treat this as needing to sign in.
        // Since we cannot securely generate a custom token on the client,
        // we will use anonymous sign-in as a stand-in for this development environment.
        // In a real app, you'd call a backend function to get a custom token.
        signInAnonymously(auth)
          .then((cred) => {
             // In a real custom auth flow, we would not need this. We'd get a token for userWallet.
             // But for anonymous, we can't control the UID.
             // For the purpose of this exercise, we assume anon login is sufficient
             // to get a `request.auth != null`. The rules will need to adapt.
             console.log("Signed in anonymously. In a real app, this would be a custom token flow.", cred.user);
          })
          .catch((error) => {
            console.error('Anonymous sign-in error:', error);
            setIsLoading(false);
            setAuthChecked(true);
          });
      }
    });
    
    return () => unsubscribe();
  }, [userWallet, firestore]);
  
  // This loading screen is important to prevent content from rendering before auth state is confirmed.
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
