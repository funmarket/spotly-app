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
          router.replace('/onboarding');
        } else {
          setIsCheckingProfile(false);
        }
      });
    } else {
      // If there's no user, we don't need to check for a profile.
      // The pages themselves will handle guest access.
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


function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
       <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <ClientOnly>
        <AppContent>
            {children}
        </AppContent>
      </ClientOnly>
    </main>
  );
}
