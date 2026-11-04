import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnvironment } from "./config";

export function createSupabaseAdminClient() {
  const { url } = requireSupabaseEnvironment();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for campaign ID sign-in.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
