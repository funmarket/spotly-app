'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

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
  const { publicKey, connected } = useWallet();
  const { firestore } = useFirebase();
  const router = useRouter();
  const [showWalletConnectForRole, setShowWalletConnectForRole] = useState<string | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  useEffect(() => {
    // This effect runs when the wallet connects to check for an existing profile
    const checkProfileAndRedirect = async () => {
      if (connected && publicKey && firestore && showWalletConnectForRole) {
        setIsCheckingProfile(true);
        const userDocRef = doc(firestore, 'users', publicKey.toBase58());
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          // Profile exists, go to profile page
          router.push(`/profile/${publicKey.toBase58()}`);
        } else {
          // No profile, go to creation page for the selected role
          router.push(`/onboarding/create/${showWalletConnectForRole}`);
        }
      }
    };
    checkProfileAndRedirect();
  }, [connected, publicKey, firestore, router, showWalletConnectForRole]);


  const handleRoleClick = async (role: string) => {
    // Fans do not need to connect a wallet to create a profile
    if (role === 'fan') {
      router.push(`/onboarding/create/fan`);
      return;
    }
    
    // Artists and Businesses require a wallet
    if (connected && publicKey && firestore) {
        // If already connected, check for profile and redirect
        setIsCheckingProfile(true);
        const userDocRef = doc(firestore, 'users', publicKey.toBase58());
        try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                router.push(`/profile/${publicKey.toBase58()}`);
            } else {
                router.push(`/onboarding/create/${role}`);
            }
        } catch (error) {
            console.error("Error checking for profile:", error);
            setIsCheckingProfile(false);
            // Fallback to creation page on error
            router.push(`/onboarding/create/${role}`);
        }
    } else {
        // If not connected, show the wallet connection prompt
        setShowWalletConnectForRole(role);
    }
  };

  const getWalletConnectText = () => {
    switch (showWalletConnectForRole) {
      case 'artist': return 'Artists need a wallet to receive tips and payments';
      case 'business': return 'Connect your wallet to create a business account';
      default: return 'Please connect your wallet to continue';
    }
  }
  
  const WalletConnectPrompt = () => (
     <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center">
          {isCheckingProfile ? (
             <>
                <h1 className="text-2xl font-headline font-bold mb-3">Checking for existing profile...</h1>
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-headline font-bold mb-3">Connect Your Wallet</h1>
              <p className="text-muted-foreground mb-6">
                {getWalletConnectText()}
              </p>
              <div className="flex flex-col items-center gap-6">
                <WalletMultiButton />
                <button
                  onClick={() => setShowWalletConnectForRole(null)}
                  className="mt-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  Go Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
  )

  if (showWalletConnectForRole) {
    return <WalletConnectPrompt />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
            Join SPOTLY
          </h1>
          <p className="text-muted-foreground text-lg">
            Create your profile to get started.
          </p>
        </div>

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
          <div className="text-center pt-4">
            <button onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground transition-colors">
              Or, just browse as a guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
