'use client';

import { useEffect, useState } from 'react';
import { useDevapp } from '@/hooks/use-devapp';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function AuthHandler({ children }: { children: React.ReactNode }) {
  const { user, userWallet } = useDevapp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If there's a session and a connected wallet, ensure they match.
      // This is a simplified example. A real app might involve signing a message
      // to prove wallet ownership and linking it to the Supabase user.
      if (session && userWallet) {
        const userMetadata = session.user.user_metadata;
        if (!userMetadata.walletAddress) {
          // Link wallet if not already linked
          await supabase.auth.updateUser({
            data: { walletAddress: userWallet }
          });
        }
      }
      setIsLoading(false);
    };

    handleAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userWallet]);


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
