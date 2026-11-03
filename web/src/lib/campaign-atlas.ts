import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CampaignAtlasMap = {
  id: string;
  name: string;
  map_type: string;
  description: string;
  parent_map_id: string | null;
  location_name: string | null;
  has_artwork: boolean;
};

export async function getCampaignAtlasMaps(
  campaignId: string,
): Promise<CampaignAtlasMap[]> {
  const supabase = await createSupabaseServerClient();
  const [{ data: maps, error }, { data: locations, error: locationsError }] =
    await Promise.all([
      supabase
        .from("campaign_maps")
        .select(
          "id, name, map_type, description, parent_map_id, location_id, artwork_path",
        )
        .eq("campaign_id", campaignId)
        .order("name"),
      supabase
        .from("campaign_locations")
        .select("id, name")
        .eq("campaign_id", campaignId),
    ]);

  if (error) {
    throw new Error(`Unable to load atlas maps: ${error.message}`);
  }
  if (locationsError) {
    throw new Error(`Unable to load map locations: ${locationsError.message}`);
  }

  const locationsById = new Map(
    locations.map((location) => [location.id, location.name]),
  );
  return maps.map((map) => ({
    id: map.id,
    name: map.name,
    map_type: map.map_type,
    description: map.description,
    parent_map_id: map.parent_map_id,
    location_name: map.location_id
      ? (locationsById.get(map.location_id) ?? null)
      : null,
    has_artwork: Boolean(map.artwork_path),
  }));
}
