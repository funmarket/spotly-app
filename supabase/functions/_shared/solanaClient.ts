// supabase/functions/_shared/solanaClient.ts
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "https://esm.sh/@solana/web3.js@1.95.3";

const LAMPORTS_PER_SOL = 1_000_000_000;

function getConnection() {
  const rpcUrl = Deno.env.get("SOLANA_RPC_URL");
  if (!rpcUrl) {
    throw new Error("Missing SOLANA_RPC_URL secret");
  }
  return new Connection(rpcUrl, "confirmed");
}

function getVaultKeypair(): Keypair {
  const secret = Deno.env.get("SOLANA_VAULT_SECRET_KEY");
  if (!secret) {
    throw new Error("Missing SOLANA_VAULT_SECRET_KEY secret");
  }

  let secretArray: number[];
  try {
    secretArray = JSON.parse(secret);
  } catch {
    throw new Error("SOLANA_VAULT_SECRET_KEY must be a JSON array of numbers");
  }

  return Keypair.fromSecretKey(Uint8Array.from(secretArray));
}

export async function sendSolFromVault(opts: {
  to: string;
  amountSol: number;
}): Promise<string> {
  if (opts.amountSol <= 0) {
    throw new Error("amountSol must be > 0");
  }

  const connection = getConnection();
  const vault = getVaultKeypair();
  const toPublicKey = new PublicKey(opts.to);
  const lamports = Math.round(opts.amountSol * LAMPORTS_PER_SOL);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("finalized");

  const tx = new Transaction({
    feePayer: vault.publicKey,
    blockhash,
    lastValidBlockHeight,
  }).add(
    SystemProgram.transfer({
      fromPubkey: vault.publicKey,
      toPubkey: toPublicKey,
      lamports,
    }),
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [vault]);
  return signature;
}
