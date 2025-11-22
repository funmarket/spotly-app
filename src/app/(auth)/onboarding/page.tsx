'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDevapp } from '@/hooks/use-devapp';
import { doc, getDoc } from 'firebase/firestore';
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

function WalletConnectPrompt({ accountType, onBack }: { accountType: string, onBack: () => void }) {
  const { userWallet, firestore } = useDevapp();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (userWallet && firestore && !isChecking) {
        setIsChecking(true);
        try {
          const userDocRef = doc(firestore, 'users', userWallet);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            router.push(`/onboarding/create/${accountType}`);
          } else {
             const user = userDoc.data();
             if (user.role === accountType) {
                router.push(`/profile/${userWallet}`);
             } else {
                router.push(`/onboarding/create/${accountType}`);
             }
          }
        } catch (error) {
          console.error('Error checking profile:', error);
          router.push(`/onboarding/create/${accountType}`);
        } finally {
            setIsChecking(false);
        }
      }
    };
    checkAndRedirect();
  }, [userWallet, accountType, router, firestore, isChecking]);

  const getWalletConnectText = () => {
      switch (accountType) {
        case 'fan': return 'Connect your wallet to create a free Fan account';
        case 'artist': return 'Artists need a wallet to receive payments and bookings';
        case 'business': return 'Connect your wallet to create a business account';
        default: return 'Connect your wallet to continue';
      }
  };

  return (
    <div className="min-h-screen bg-background text-white pt-20 pb-20 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Connect Your Wallet
          </h1>
          <p className="text-white/60 text-lg">{getWalletConnectText()}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/10 shadow-[0_20px_60px_rgb(0,0,0,0.3)]">
          <div className="flex flex-col items-center gap-6">
            <div className="w-full flex justify-center">
              <div className="scale-110">
                <WalletMultiButton style={{ backgroundColor: '#ec4899', borderRadius: '24px', height: '48px' }} />
              </div>
            </div>
            <p className="text-white/60 text-center text-sm">
              Click above to connect your Solana wallet
            </p>
            {isChecking && <p className="text-pink-400 flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4"/>Checking profile...</p>}
            <button 
              onClick={onBack} 
              className="px-6 py-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingRoleSelectionPage() {
  const { userWallet, firestore } = useDevapp();
  const router = useRouter();
  const [showWalletConnectForRole, setShowWalletConnectForRole] = useState<string | null>(null);

  const handleRoleClick = async (role: string) => {
    if (role === 'fan') {
      router.push(`/onboarding/create/fan`);
      return;
    }
    
    if (userWallet && firestore) {
      const userDocRef = doc(firestore, 'users', userWallet);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
         const user = userDoc.data();
         if (user.role === role) {
            router.push(`/profile/${userWallet}`);
         } else {
            router.push(`/onboarding/create/${role}`);
         }
      } else {
        router.push(`/onboarding/create/${role}`);
      }
    } else {
      setShowWalletConnectForRole(role);
    }
  };

  if (showWalletConnectForRole) {
    return <WalletConnectPrompt accountType={showWalletConnectForRole} onBack={() => setShowWalletConnectForRole(null)} />;
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
