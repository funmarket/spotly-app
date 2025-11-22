// supabase/functions/adopt/index.ts
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

    const {
      artistWallet,
      videoId,
      tier,
      amountSol,
      monthly,
      message,
    } = body;

    if (!artistWallet || !amountSol) {
      return new Response("artistWallet and amountSol are required", {
        status: 400,
      });
    }

    // 1) Send SOL from vault to artist
    const signature = await sendSolFromVault({
      to: artistWallet,
      amountSol: Number(amountSol),
    });

    // 2) Record adoption
    const { data: adoption, error: insertError } = await supabase
      .from("adoptions")
      .insert({
        user_id: user.id,
        artist_wallet: artistWallet,
        video_id: videoId ?? null,
        tier: tier ?? null,
        amount_sol: Number(amountSol),
        monthly: Boolean(monthly),
        message: message ?? null,
        tx_signature: signature,
        status: "active",
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Failed to insert adoption:", insertError);
      return new Response("Adoption paid on-chain but failed to save", {
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, adoption, txSignature: signature }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("adopt function error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
});
