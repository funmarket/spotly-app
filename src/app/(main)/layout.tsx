'use client';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    if (user) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (!docSnap.exists()) {
          // If user is authenticated but has no profile, send to onboarding
          router.replace('/onboarding');
        } else {
          // User has a profile, allow access
          setIsCheckingProfile(false);
        }
      });
    } else {
      // Not logged in, can view public pages
      setIsCheckingProfile(false);
    }
  }, [user, isUserLoading, firestore, router]);
  
  if (isUserLoading || isCheckingProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}


export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
        <AppContent>
            {children}
        </AppContent>
    </main>
  );
}
