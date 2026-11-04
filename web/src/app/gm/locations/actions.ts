"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LocationFormState = {
  error?: string;
  message?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function saveCampaignLocation(
  _previousState: LocationFormState,
  formData: FormData,
): Promise<LocationFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage locations." };
  }

  const locationId = formData.get("location_id");
  const name = formData.get("name");
  const locationType = formData.get("location_type");
  const description = formData.get("description");
  const gmNotes = formData.get("gm_notes");
  const parentId = formData.get("parent_id");
  if (
    (locationId !== null && typeof locationId !== "string") ||
    typeof name !== "string" ||
    typeof locationType !== "string" ||
    typeof description !== "string" ||
    typeof gmNotes !== "string" ||
    typeof parentId !== "string"
  ) {
    return { error: "The location form contained invalid fields." };
  }

  const normalizedLocationId =
    typeof locationId === "string" ? locationId.trim() : "";
  const normalizedName = name.trim();
  const normalizedType = locationType.trim();
  const normalizedDescription = description.trim();
  const normalizedGmNotes = gmNotes.trim();
  const normalizedParentId = parentId.trim() || null;
  if (normalizedLocationId && !isUuid(normalizedLocationId)) {
    return { error: "Choose a valid location." };
  }
  if (!normalizedName || normalizedName.length > 160) {
    return { error: "Enter a location name of 1 to 160 characters." };
  }
  if (normalizedType.length > 80) {
    return { error: "Location type cannot exceed 80 characters." };
  }
  if (normalizedDescription.length > 20000 || normalizedGmNotes.length > 20000) {
    return { error: "Descriptions and GM notes cannot exceed 20,000 characters." };
  }
  if (normalizedParentId && !isUuid(normalizedParentId)) {
    return { error: "Choose a valid parent location." };
  }

  const supabase = await createSupabaseServerClient();
  if (normalizedLocationId) {
    const { error } = await supabase.rpc("update_campaign_location", {
      target_campaign_id: member.campaign_id,
      target_location_id: normalizedLocationId,
      target_parent_id: normalizedParentId,
      target_name: normalizedName,
      target_location_type: normalizedType,
      target_description: normalizedDescription,
      target_player_visible: formData.get("player_visible") === "on",
      target_gm_notes: normalizedGmNotes,
    });

    if (error) {
      return { error: `Unable to update the location: ${error.message}` };
    }
  } else {
    const { error } = await supabase.rpc("create_campaign_location", {
      target_campaign_id: member.campaign_id,
      target_parent_id: normalizedParentId,
      target_name: normalizedName,
      target_location_type: normalizedType,
      target_description: normalizedDescription,
      target_player_visible: formData.get("player_visible") === "on",
      target_gm_notes: normalizedGmNotes,
    });

    if (error) {
      return { error: `Unable to save the location: ${error.message}` };
    }
  }

  revalidatePath("/gm/locations");
  revalidatePath("/player/locations");
  revalidatePath("/gm/atlas");
  revalidatePath("/player/atlas");
  return { message: normalizedLocationId ? "Location updated." : "Location saved." };
}

export async function deleteCampaignLocation(
  _previousState: LocationFormState,
  formData: FormData,
): Promise<LocationFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can delete locations." };
  }

  const locationId = formData.get("location_id");
  if (typeof locationId !== "string" || !isUuid(locationId)) {
    return { error: "Choose a valid location." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaign_locations")
    .delete()
    .eq("campaign_id", member.campaign_id)
    .eq("id", locationId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      error: `Unable to delete the location. Remove its map, child-location, or NPC links first. ${error.message}`,
    };
  }
  if (!data) {
    return { error: "The location was not found in this campaign." };
  }

  revalidatePath("/gm/locations");
  revalidatePath("/player/locations");
  revalidatePath("/gm/maps");
  revalidatePath("/player/maps");
  revalidatePath("/gm/atlas");
  revalidatePath("/player/atlas");
  return { message: "Location deleted." };
}
