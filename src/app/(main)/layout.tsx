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
    if (isUserLoading) {
      return; // Wait until user status is resolved
    }
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (!docSnap.exists()) {
          // If user is authenticated but has no profile, redirect to onboarding
          router.replace('/onboarding');
        }
      });
    }
    // No action needed for guest users (user is null), they can browse freely.
  }, [user, isUserLoading, firestore, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 w-full h-full">{children}</main>
      <BottomNavBar />
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return <AppContent>{children}</AppContent>;
}
