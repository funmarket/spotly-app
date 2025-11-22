// supabase/functions/book/index.ts
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
      date,
      time,
      budgetSol,
      details,
    } = body;

    if (!artistWallet || !budgetSol) {
      return new Response("artistWallet and budgetSol are required", {
        status: 400,
      });
    }

    // 1) Send SOL from vault to artist (you can switch to escrow wallet here)
    const signature = await sendSolFromVault({
      to: artistWallet,
      amountSol: Number(budgetSol),
    });

    // 2) Create booking record
    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        artist_wallet: artistWallet,
        video_id: videoId ?? null,
        date: date ?? null,
        time: time ?? null,
        budget_sol: Number(budgetSol),
        details: details ?? null,
        tx_signature: signature,
        status: "paid", // or "escrow_released" etc
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Failed to insert booking:", insertError);
      return new Response("Booking created on-chain but failed to save", {
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, booking, txSignature: signature }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("book function error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
});
