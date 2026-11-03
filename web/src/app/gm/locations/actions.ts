"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LocationFormState = {
  error?: string;
  message?: string;
};

export async function createCampaignLocation(
  _previousState: LocationFormState,
  formData: FormData,
): Promise<LocationFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can create locations." };
  }

  const name = formData.get("name");
  const locationType = formData.get("location_type");
  const description = formData.get("description");
  const gmNotes = formData.get("gm_notes");
  const parentId = formData.get("parent_id");
  if (
    typeof name !== "string" ||
    typeof locationType !== "string" ||
    typeof description !== "string" ||
    typeof gmNotes !== "string" ||
    typeof parentId !== "string"
  ) {
    return { error: "The location form contained invalid fields." };
  }

  const normalizedName = name.trim();
  const normalizedType = locationType.trim();
  const normalizedDescription = description.trim();
  const normalizedGmNotes = gmNotes.trim();
  const normalizedParentId = parentId.trim() || null;
  if (!normalizedName || normalizedName.length > 160) {
    return { error: "Enter a location name of 1 to 160 characters." };
  }
  if (normalizedType.length > 80) {
    return { error: "Location type cannot exceed 80 characters." };
  }
  if (normalizedDescription.length > 20000 || normalizedGmNotes.length > 20000) {
    return { error: "Descriptions and GM notes cannot exceed 20,000 characters." };
  }
  if (
    normalizedParentId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      normalizedParentId,
    )
  ) {
    return { error: "Choose a valid parent location." };
  }

  const supabase = await createSupabaseServerClient();
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

  revalidatePath("/gm/locations");
  revalidatePath("/player/locations");
  return { message: "Location saved." };
}
