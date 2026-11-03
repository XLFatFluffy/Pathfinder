export type SupabaseEnvironment = {
  url: string;
  anonKey: string;
};

export function getSupabaseEnvironment(): SupabaseEnvironment | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url && !anonKey) {
    return null;
  }

  if (!url || !anonKey) {
    throw new Error(
      "Supabase configuration is incomplete. Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  try {
    new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
  }

  return { url, anonKey };
}

export function requireSupabaseEnvironment(): SupabaseEnvironment {
  const environment = getSupabaseEnvironment();
  if (!environment) {
    throw new Error(
      "Supabase is not configured. Copy web/.env.example to web/.env.local and set the local project values.",
    );
  }

  return environment;
}
