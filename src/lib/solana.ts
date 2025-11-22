import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";

export async function sendSol({
  from,
  to,
  amountSol,
  connection,
  wallet,
}: {
  from: PublicKey;
  to: PublicKey;
  amountSol: number;
  connection: Connection;
  wallet: WalletContextState;
}) {

  if (!wallet.sendTransaction) {
    throw new Error("Wallet does not support sendTransaction");
  }

  // Manually get the latest blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  const tx = new Transaction({
    recentBlockhash: blockhash,
    lastValidBlockHeight: lastValidBlockHeight,
    feePayer: from,
  }).add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: amountSol * 1e9,
    })
  );

  const signature = await wallet.sendTransaction(tx, connection);

  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight
  }, "confirmed");

  return signature;
}
