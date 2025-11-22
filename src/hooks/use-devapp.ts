
'use client';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

interface UseDevappHook {
  userWallet: string | undefined;
  user: User | null;
  supabase: typeof supabase;
  sendTransaction: any; 
  signMessage: any;
}

export function useDevapp(): UseDevappHook {
  const { publicKey, sendTransaction, signMessage } = useWallet();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const userWallet = publicKey ? publicKey.toBase58() : undefined;

  return {
    userWallet,
    user,
    supabase,
    sendTransaction,
    signMessage,
  };
}
