"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnvironment } from "./config";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = requireSupabaseEnvironment();
  return createBrowserClient(url, anonKey);
}
