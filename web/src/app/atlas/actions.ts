"use server";

import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ArtworkResult = {
  url?: string;
  error?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function getCampaignMapArtworkUrl(
  mapId: string,
): Promise<ArtworkResult> {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return { error: "Your campaign membership could not be verified." };
  }
  if (!isUuid(mapId)) {
    return { error: "Choose a valid campaign map." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: map, error } = await supabase
    .from("campaign_maps")
    .select("artwork_path")
    .eq("campaign_id", member.campaign_id)
    .eq("id", mapId)
    .maybeSingle();

  if (error) {
    return { error: `Unable to load map artwork: ${error.message}` };
  }
  if (!map?.artwork_path) {
    return { error: "This map has no artwork available to view." };
  }

  const { data, error: urlError } = await supabase.storage
    .from("campaign-maps")
    .createSignedUrl(map.artwork_path, 60);
  if (urlError) {
    return { error: `Unable to open map artwork: ${urlError.message}` };
  }

  return { url: data.signedUrl };
}
