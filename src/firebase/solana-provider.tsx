'use client';

import { ReactNode, useMemo, useCallback } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter
} from '@solana/wallet-adapter-phantom';
import {
  SolflareWalletAdapter
} from '@solana/wallet-adapter-solflare';
import type { WalletError } from '@solana/wallet-adapter-base';
import { useToast } from '@/hooks/use-toast';

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = 'mainnet-beta';

  // You can also provide a custom RPC endpoint
  const endpoint = "https://api.mainnet-beta.solana.com";

  const wallets = useMemo(
    () => [
      /**
       * Wallets that implement either of these standards will be available automatically.
       *
       *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
       *     (https://github.com/solana-mobile/mobile-wallet-adapter)
       *   - Solana Wallet Standard
       *     (https://github.com/solana-labs/wallet-standard)
       *
       * If you wish to support a wallet that supports neither of those standards,
       * instantiate its legacy wallet adapter here.
       */
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  );
  
  const onError = useCallback((error: WalletError) => {
    console.error('Wallet Error:', error);
    // This prevents the app from crashing when a user rejects a wallet connection
    if (error.name !== 'WalletSendTransactionError' && error.name !== 'WalletSignTransactionError') {
      toast({ title: 'Wallet Connection Error', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
