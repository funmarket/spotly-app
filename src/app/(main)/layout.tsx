'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { BottomNavBar } from '@/components/shared/bottom-nav-bar';
import { Loader2 } from 'lucide-react';

function AppContent({ children }: { children: React.ReactNode }) {
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    // If auth state is loading, wait.
    if (isUserLoading) {
      return;
    }

    // Only run profile check for logged-in (authenticated) users.
    // Guests (user === null) will bypass this and see the public content.
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        // If a logged-in user's profile document doesn't exist,
        // redirect them to the onboarding flow to create one.
        if (!docSnap.exists()) {
          router.replace('/onboarding');
        }
      });
    }
  }, [user, isUserLoading, firestore, router]);

  // While checking auth, show a global loader.
  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Once auth state is resolved, render the main app layout for guests or profiled users.
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 w-full h-full">{children}</main>
      <BottomNavBar />
    </div>
  );
}


export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppContent>{children}</AppContent>
}
