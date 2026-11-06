import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export async function getCampaignMapArtwork(
  supabase: SupabaseServerClient,
  artworkPath: string | null,
): Promise<{ url: string | null; error: string | null }> {
  if (!artworkPath) {
    return { url: null, error: null };
  }

  try {
    const { data, error } = await supabase.storage
      .from("campaign-maps")
      .createSignedUrl(artworkPath, 60);
    if (error) {
      return { url: null, error: error.message };
    }

    return { url: data.signedUrl, error: null };
  } catch (error) {
    return {
      url: null,
      error:
        error instanceof Error ? error.message : "The storage request failed.",
    };
  }
}
