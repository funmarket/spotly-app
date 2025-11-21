// import { useDevapp as useDevappSDK, DevbaseClient } from '@devfunlabs/web-sdk';
import { useFirestore } from '@/firebase'; // Using firebase library for firestore
import { Firestore } from 'firebase/firestore';

// Define a type for the hook's return value for clarity
interface UseDevappHook {
  userWallet: string | undefined;
  firestore: Firestore | undefined;
  sendTransaction: ((transaction: any, connection: any) => Promise<string>) | undefined;
  signMessage: ((message: Uint8Array) => Promise<Uint8Array>) | undefined;
}

/**
 * Custom hook to access wallet state and other SDK features.
 * This provides a typed and consistent way to interact with the DevFun SDK
 * and integrates our Firestore instance.
 */
export function useDevapp(): UseDevappHook {
  // Get the original hook's return values
  // const {
  //   userWallet,
  //   sendTransaction,
  //   signMessage,
  // } = useDevappSDK();

  // Get the firestore instance from our firebase setup
  const firestore = useFirestore();

  // Return a combined object that matches the specified interface
  return {
    userWallet: undefined,
    firestore,
    sendTransaction: undefined,
    signMessage: undefined,
  };
}
