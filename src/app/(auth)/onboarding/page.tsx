'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
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
  const { publicKey } = useWallet();
  const router = useRouter();
  const [showWalletConnect, setShowWalletConnect] = useState<string | null>(
    null
  );

  const handleRoleClick = (role: string) => {
    if (role !== 'fan' && !publicKey) {
      setShowWalletConnect(role);
      return;
    }
    router.push(`/onboarding/create/${role}`);
  };
  
  const getWalletConnectText = () => {
      switch (showWalletConnect) {
          case 'fan': return 'Connect your wallet to create a free Fan account';
          case 'artist': return 'Artists need a wallet to receive tips and payments';
          case 'business': return 'Connect your wallet to create a business account';
          default: return 'Please connect your wallet to continue';
      }
  }


  if (showWalletConnect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center">
            <h1 className="text-2xl font-headline font-bold mb-3">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-6">
             {getWalletConnectText()}
            </p>
            <div className="flex flex-col items-center gap-6">
              <WalletMultiButton />
              <button
                onClick={() => setShowWalletConnect(null)}
                className="mt-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Go Back
              </button>
            </div>
        </div>
      </div>
    );
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
