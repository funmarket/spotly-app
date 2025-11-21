'use client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useFirestore } from '@/firebase';
import { Firestore } from 'firebase/firestore';

interface UseDevappHook {
  userWallet: string | undefined;
  firestore: Firestore | undefined;
  sendTransaction: any; // Type according to your needs
  signMessage: any; // Type according to your needs
}

export function useDevapp(): UseDevappHook {
  const { publicKey, sendTransaction, signMessage } = useWallet();
  const firestore = useFirestore();

  const userWallet = publicKey ? publicKey.toBase58() : undefined;

  return {
    userWallet,
    firestore,
    sendTransaction,
    signMessage,
  };
}
