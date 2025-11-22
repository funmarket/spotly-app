// supabase/functions/tip/index.ts
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
    const { artistWallet, amountSol, videoId, fromUserId, note } = body ?? {};

    if (!artistWallet || !amountSol) {
      return new Response(
        JSON.stringify({ error: "artistWallet and amountSol are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await sendFromVault({
      to: artistWallet,
      amountSol: Number(amountSol),
      memo: note,
    });

    // TODO: optionally write to Supabase DB (tips table) here

    return new Response(
      JSON.stringify({
        ok: true,
        type: "tip",
        txSignature: result.signature,
        lamports: result.lamports,
        artistWallet,
        videoId,
        fromUserId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("tip function error", err);
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
