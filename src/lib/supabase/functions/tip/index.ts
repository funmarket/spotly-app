// supabase/functions/tip/index.ts
import { sendSolFromVault } from "../_shared/solanaClient.ts";
import { getServiceClient } from "../_shared/supabaseClient.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabase = getServiceClient(req);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response("Invalid JSON body", { status: 400 });
    }

    const { amountSol, recipientWallet, videoId, message } = body;

    if (!amountSol || !recipientWallet) {
      return new Response("amountSol and recipientWallet are required", {
        status: 400,
      });
    }

    // 1) Send SOL from platform vault to artist
    const signature = await sendSolFromVault({
      to: recipientWallet,
      amountSol: Number(amountSol),
    });

    // 2) Record tip in DB
    const { error: insertError } = await supabase.from("tips").insert({
      user_id: user.id,
      to_wallet: recipientWallet,
      amount_sol: Number(amountSol),
      video_id: videoId ?? null,
      message: message ?? null,
      tx_signature: signature,
    });

    if (insertError) {
      console.error("Failed to insert tip:", insertError);
      // still return success because funds were sent on-chain
    }

    return new Response(
      JSON.stringify({ ok: true, txSignature: signature }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("tip function error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
});
