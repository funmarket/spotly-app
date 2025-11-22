
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDevapp } from '@/hooks/use-devapp';
import { Loader2 } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

function RoleChoiceButton({
  label,
  subLabel,
  gradient,
  onClick,
}: {
  label: string;
  subLabel: string;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full rounded-full py-4 px-6 
        transform transition-all duration-200 ease-out
        hover:scale-[1.02] active:scale-[0.98]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_15px_rgba(0,0,0,0.3)] 
        border border-white/20 ${gradient}`}
    >
      <div className="relative z-10 text-left">
        <h3 className="text-lg font-extrabold text-white mb-1 tracking-tight">
          {label}
        </h3>
        <p className="text-xs text-white/90 font-medium">{subLabel}</p>
      </div>
    </button>
  );
}


export default function OnboardingRoleSelectionPage() {
  const { userWallet, supabase } = useDevapp();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      // Wait for wallet to be ready
      if (userWallet === undefined) {
        return; 
      }

      // If wallet is connected, check for profile
      if (userWallet) {
        const { data: user, error } = await supabase
          .from('users')
          .select('wallet_address')
          .eq('wallet_address', userWallet)
          .single();
        
        if (user) {
          // Profile exists, go to their profile page
          router.push(`/profile/${userWallet}`);
        } else {
          // No profile, stay on this page to let them choose a role
          setIsLoading(false);
        }
      } else {
        // No wallet connected, stay on this page to show roles/connect prompt
        setIsLoading(false);
      }
    };

    checkProfileAndRedirect();
  }, [userWallet, supabase, router]);


  const handleRoleClick = (role: string) => {
    if (!userWallet) {
        // Should not happen if UI is correct, but as a safeguard
        alert("Please connect your wallet first.");
        return;
    }
    router.push(`/onboarding/create/${role}`);
  };

  if (isLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  // Main UI
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
            {userWallet ? "Complete Your Profile" : "Join SPOTLY"}
          </h1>
          <p className="text-muted-foreground text-lg">
             {userWallet ? "You're almost there! Choose your role to get started." : "Connect your wallet to begin."}
          </p>
        </div>

        {userWallet ? (
          <div className="space-y-4">
            <RoleChoiceButton
              label="Fan (Free Account)"
              subLabel="Unlimited voting, messaging, and favorites"
              gradient="bg-gradient-to-br from-green-500 via-cyan-500 to-blue-400"
              onClick={() => handleRoleClick('fan')}
            />
            <RoleChoiceButton
              label="Artist / Talent"
              subLabel="Showcase your talent and get discovered"
              gradient="bg-gradient-to-br from-pink-500 via-purple-500 to-primary"
              onClick={() => handleRoleClick('artist')}
            />
            <RoleChoiceButton
              label="Business / Producer"
              subLabel="Discover, book, and hire talent"
              gradient="bg-gradient-to-br from-yellow-500 via-orange-500 to-yellow-600"
              onClick={() => handleRoleClick('business')}
            />
          </div>
        ) : (
           <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/10 shadow-[0_20px_60px_rgb(0,0,0,0.3)]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-full flex justify-center">
                    <div className="scale-110">
                        {isClient && <WalletMultiButton style={{ backgroundColor: '#FFA500', borderRadius: '24px', height: '48px' }} />}
                    </div>
                    </div>
                    <p className="text-white/60 text-center text-sm">
                    Click above to connect your Solana wallet.
                    </p>
                </div>
            </div>
        )}

        <div className="text-center pt-6">
            <button onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Or, just browse as a guest
            </button>
        </div>
      </div>
    </div>
  );
}
