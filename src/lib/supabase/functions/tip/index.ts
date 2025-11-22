import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "npm:@solana/web3.js";

serve(async (req) => {
  try {
    const { toWallet, amount } = await req.json();

    const vaultSecretKey = Deno.env.get("SOLANA_VAULT_SECRET_KEY");
    const rpc = Deno.env.get("SOLANA_RPC_URL");
    if (!vaultSecretKey || !rpc)
      throw new Error("Missing env vars");

    const secret = Uint8Array.from(JSON.parse(vaultSecretKey));
    const vault = Keypair.fromSecretKey(secret);

    const conn = new Connection(rpc);

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: vault.publicKey,
        toPubkey: new PublicKey(toWallet),
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    const block = await conn.getLatestBlockhash();
    tx.recentBlockhash = block.blockhash;
    tx.feePayer = vault.publicKey;

    const signed = await vault.signTransaction(tx);
    const sig = await conn.sendRawTransaction(signed.serialize());

    return new Response(JSON.stringify({ success: true, sig }), { status: 200 });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
});

