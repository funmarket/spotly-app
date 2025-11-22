// supabase/functions/adopt/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, sendFromVault } from "../_shared/solana.ts";

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      artistWallet,
      amountSol,
      tier,             // "bronze" | "silver" | "gold"
      recurring,        // boolean
      message,
      businessWallet,
      videoId,
      fromUserId,
    } = body ?? {};

    if (!artistWallet || !amountSol) {
      return new Response(
        JSON.stringify({ error: "artistWallet and amountSol are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await sendFromVault({
      to: artistWallet,
      amountSol: Number(amountSol),
    });

    // TODO: insert into `adoptions` + `payments` tables in Supabase.
    // If `recurring === true`, also create a row your cron / scheduler can use.

    return new Response(
      JSON.stringify({
        ok: true,
        type: "adopt",
        txSignature: result.signature,
        lamports: result.lamports,
        artistWallet,
        businessWallet,
        tier,
        recurring,
        message,
        videoId,
        fromUserId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("adopt function error", err);
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
