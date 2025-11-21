'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { BottomNavBar } from '@/components/shared/bottom-nav-bar';
import { Loader2 } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    // If the user's authentication state is still loading, do nothing.
    if (isUserLoading) {
      return;
    }

    // If the user is logged in (not a guest), check if they have a profile.
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        // If the user is logged in but their profile document doesn't exist,
        // redirect them to the onboarding flow to create one.
        if (!docSnap.exists()) {
          router.replace('/onboarding');
        }
      });
    }
    // If the user is a guest (user is null), do nothing and allow them to browse.
  }, [user, isUserLoading, firestore, router]);

  // While checking the user's auth state, show a global loader.
  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Once auth state is resolved, render the main app layout.
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 w-full h-full">{children}</main>
      <BottomNavBar />
    </div>
  );
}
