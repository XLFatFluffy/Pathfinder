"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const maximumArtworkBytes = 100 * 1024 * 1024;
const allowedArtworkTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const mapTypes = new Set([
  "world",
  "continent",
  "region",
  "kingdom",
  "city",
  "settlement",
  "interior",
  "dungeon",
]);

export type MapFormState = {
  error?: string;
  message?: string;
};

export type CreatedMap = {
  mapId: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function createCampaignMap(
  formData: FormData,
): Promise<MapFormState & CreatedMap> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can add maps.", mapId: "" };
  }

  const name = formData.get("name");
  const type = formData.get("map_type");
  const description = formData.get("description");
  const locationId = formData.get("location_id");
  const parentMapId = formData.get("parent_map_id");
  if (
    typeof name !== "string" ||
    typeof type !== "string" ||
    typeof description !== "string" ||
    typeof locationId !== "string" ||
    typeof parentMapId !== "string"
  ) {
    return { error: "The map form contained invalid fields.", mapId: "" };
  }

  const normalizedName = name.trim();
  const normalizedDescription = description.trim();
  const normalizedLocationId = locationId.trim() || null;
  const normalizedParentMapId = parentMapId.trim() || null;
  if (!normalizedName || normalizedName.length > 160) {
    return { error: "Enter a map name of 1 to 160 characters.", mapId: "" };
  }
  if (!mapTypes.has(type)) {
    return { error: "Choose a valid map type.", mapId: "" };
  }
  if (normalizedDescription.length > 20000) {
    return { error: "Map description cannot exceed 20,000 characters.", mapId: "" };
  }
  if (
    (normalizedLocationId && !isUuid(normalizedLocationId)) ||
    (normalizedParentMapId && !isUuid(normalizedParentMapId))
  ) {
    return { error: "Choose valid linked campaign records.", mapId: "" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: map, error: insertError } = await supabase
    .from("campaign_maps")
    .insert({
      campaign_id: member.campaign_id,
      parent_map_id: normalizedParentMapId,
      location_id: normalizedLocationId,
      name: normalizedName,
      map_type: type,
      description: normalizedDescription,
      player_visible: formData.get("player_visible") === "on",
    })
    .select("id")
    .single();

  if (insertError) {
    return {
      error: `Unable to create the map record: ${insertError.message}`,
      mapId: "",
    };
  }

  revalidatePath("/gm/maps");
  revalidatePath("/player/maps");

  return { mapId: map.id };
}

export async function recordCampaignMapArtwork(
  mapId: string,
  mimeType: string,
  fileSize: number,
): Promise<MapFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can attach map artwork." };
  }
  if (
    !isUuid(mapId) ||
    !allowedArtworkTypes.has(mimeType) ||
    !Number.isInteger(fileSize) ||
    fileSize < 1 ||
    fileSize > maximumArtworkBytes
  ) {
    return { error: "The map artwork metadata is invalid." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: map, error: mapError } = await supabase
    .from("campaign_maps")
    .select("id")
    .eq("campaign_id", member.campaign_id)
    .eq("id", mapId)
    .maybeSingle();

  if (mapError) {
    return { error: `Unable to load the map record: ${mapError.message}` };
  }
  if (!map) {
    return { error: "The map record was not found in this campaign." };
  }

  const artworkPath = `${member.campaign_id}/${map.id}/artwork`;
  const { error } = await supabase
    .from("campaign_maps")
    .update({
      artwork_path: artworkPath,
      mime_type: mimeType,
      file_size: fileSize,
      updated_at: new Date().toISOString(),
    })
    .eq("campaign_id", member.campaign_id)
    .eq("id", map.id);

  if (error) {
    return { error: `Unable to save map artwork metadata: ${error.message}` };
  }

  revalidatePath("/gm/maps");
  revalidatePath("/player/maps");
  return { message: "Map artwork saved." };
}

export async function replaceCampaignMapArtwork(
  mapId: string,
  mimeType: string,
  fileSize: number,
): Promise<MapFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can replace map artwork." };
  }
  if (!isUuid(mapId)) {
    return { error: "Choose a valid campaign map." };
  }

  const result = await recordCampaignMapArtwork(mapId, mimeType, fileSize);
  return result.error
    ? result
    : { message: "Map artwork replaced. The map and its links were preserved." };
}
