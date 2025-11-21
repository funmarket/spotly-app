'use client';

import { useEffect, useState } from 'react';
import { useDevapp } from '@/hooks/use-devapp';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export function AuthHandler({ children }: { children: React.ReactNode }) {
  const { userWallet, firestore } = useDevapp();
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const ensureUserProfile = async () => {
      if (userWallet && firestore) {
        setIsLoadingUser(true);
        try {
          const userDocRef = doc(firestore, 'users', userWallet);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            console.log(`Creating new user profile for wallet: ${userWallet}`);
            await setDoc(userDocRef, {
              walletAddress: userWallet,
              username: `User_${userWallet.substring(0, 4)}...${userWallet.substring(userWallet.length - 4)}`,
              bio: '',
              role: 'regular',
              profilePhotoUrl: `https://picsum.photos/seed/${userWallet}/400`,
              bannerPhotoUrl: `https://picsum.photos/seed/banner-${userWallet}/1200/400`,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            console.log('User profile created successfully.');
          } else {
            const existingUser = userDoc.data();
            console.log('Existing user profile found:', existingUser);

            // Ensure userId is set correctly (for legacy data)
            if (!existingUser.userId || existingUser.userId !== userDoc.id) {
              console.log('Updating userId for existing user...');
              await setDoc(userDocRef, { userId: userDoc.id }, { merge: true });
            }
          }
        } catch (error) {
          console.error('Error ensuring user profile:', error);
        } finally {
          setIsLoadingUser(false);
        }
      } else {
        setIsLoadingUser(false);
      }
    };
    ensureUserProfile();
  }, [userWallet, firestore]);

  if (isLoadingUser && userWallet) {
    return (
      <div className="flex items-center justify-center bg-black" style={{ height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-white">Loading user profile...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
