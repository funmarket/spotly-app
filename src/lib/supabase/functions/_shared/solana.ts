// supabase/functions/_shared/solana.ts
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "https://esm.sh/@solana/web3.js@1.95.0";

// Use a shared CORS header set in all functions
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function getConnection(): Connection {
  const rpc =
    Deno.env.get("SOLANA_RPC_URL") ?? "https://api.devnet.solana.com";
  return new Connection(rpc, "confirmed");
}

// Backend “vault” that actually sends funds.
// IMPORTANT: do NOT commit the secret to Git. Put it in Supabase env vars.
export function getVaultKeypair(): Keypair {
  const secret = Deno.env.get("SOLANA_VAULT_SECRET_KEY");
  if (!secret) {
    throw new Error("SOLANA_VAULT_SECRET_KEY missing in env");
  }

  // Expect secret as JSON array string: "[12,34, ...]"
  const bytes = Uint8Array.from(JSON.parse(secret));
  return Keypair.fromSecretKey(bytes);
}

export async function sendFromVault(params: {
  to: string;
  amountSol: number;
  memo?: string;
}) {
  const { to, amountSol } = params;

  const connection = getConnection();
  const vault = getVaultKeypair();
  const dest = new PublicKey(to);

  const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: vault.publicKey,
      toPubkey: dest,
      lamports,
    }),
  );

  tx.feePayer = vault.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  const sig = await sendAndConfirmTransaction(connection, tx, [vault]);
  return { signature: sig, lamports };
}
