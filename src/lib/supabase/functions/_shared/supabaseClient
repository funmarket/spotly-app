// supabase/functions/_shared/supabaseClient.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function getServiceClient(req: Request) {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const authHeader = req.headers.get("Authorization") ?? "";

  return createClient(url, serviceRoleKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}
