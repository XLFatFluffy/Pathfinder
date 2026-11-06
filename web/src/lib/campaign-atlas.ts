import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";

export type CampaignAtlasMap = {
  id: string;
  map_source_id: string | null;
  name: string;
  map_type: string;
  description: string;
  parent_map_id: string | null;
  location_name: string | null;
  has_artwork: boolean;
  player_visible: boolean;
};

export type CampaignAtlasLocation = {
  id: string;
  name: string;
  player_visible: boolean;
};

export type CampaignAtlasData = {
  maps: CampaignAtlasMap[];
  locations: CampaignAtlasLocation[];
};

export async function getCampaignAtlasData(
  campaignId: string,
): Promise<CampaignAtlasData> {
  const supabase = await createSupabaseServerClient();
  const [maps, locations] = await Promise.all([
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_maps")
        .select(
          "id, source_id, name, map_type, description, parent_map_id, location_id, artwork_path, player_visible",
        )
        .eq("campaign_id", campaignId)
        .order("name")
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_locations")
        .select("id, name, player_visible")
        .eq("campaign_id", campaignId)
        .order("id")
        .range(from, to),
    ),
  ]);

  const locationsById = new Map(locations.map((location) => [location.id, location]));
  return {
    maps: maps.map((map) => ({
      id: map.id,
      map_source_id: map.source_id,
      name: map.name,
      map_type: map.map_type,
      description: map.description,
      parent_map_id: map.parent_map_id,
      location_name: map.location_id
        ? (locationsById.get(map.location_id)?.name ?? null)
        : null,
      has_artwork: Boolean(map.artwork_path),
      player_visible: map.player_visible,
    })),
    locations,
  };
}
