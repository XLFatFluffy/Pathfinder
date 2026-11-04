"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isHouseRelationshipType } from "./relationship-types";

export type HouseRelationshipFormState = {
  error?: string;
  message?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function saveHouseRelationship(
  _previousState: HouseRelationshipFormState,
  formData: FormData,
): Promise<HouseRelationshipFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage house relationships." };
  }

  const relationshipIdValue = formData.get("relationship_id");
  const houseIdValue = formData.get("house_id");
  const relatedHouseIdValue = formData.get("related_house_id");
  const relationshipTypeValue = formData.get("relationship_type");
  const descriptionValue = formData.get("description");
  const gmNotesValue = formData.get("gm_notes");
  const campaignDateValue = formData.get("campaign_date");
  const reasonValue = formData.get("reason");

  if (
    (relationshipIdValue !== null && typeof relationshipIdValue !== "string") ||
    typeof houseIdValue !== "string" ||
    typeof relatedHouseIdValue !== "string" ||
    typeof relationshipTypeValue !== "string" ||
    typeof descriptionValue !== "string" ||
    typeof gmNotesValue !== "string" ||
    typeof campaignDateValue !== "string" ||
    typeof reasonValue !== "string"
  ) {
    return { error: "The house relationship form contained invalid fields." };
  }

  const relationshipId = relationshipIdValue?.trim() ?? "";
  const houseId = houseIdValue.trim();
  const relatedHouseId = relatedHouseIdValue.trim();
  const relationshipType = relationshipTypeValue.trim();
  const description = descriptionValue.trim();
  const gmNotes = gmNotesValue.trim();
  const campaignDate = campaignDateValue.trim();
  const reason = reasonValue.trim();

  if (
    (relationshipId && !isUuid(relationshipId)) ||
    !isUuid(houseId) ||
    !isUuid(relatedHouseId) ||
    houseId === relatedHouseId
  ) {
    return { error: "Choose two different valid noble houses." };
  }
  if (!isHouseRelationshipType(relationshipType)) {
    return { error: "Choose a valid relationship type." };
  }
  if (
    description.length > 10000 ||
    gmNotes.length > 20000 ||
    campaignDate.length > 120 ||
    reason.length > 4000
  ) {
    return { error: "One or more relationship fields exceed their allowed length." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_campaign_house_relationship", {
    target_campaign_id: member.campaign_id,
    target_relationship_id: relationshipId || null,
    target_house_id: houseId,
    target_related_house_id: relatedHouseId,
    target_relationship_type: relationshipType,
    target_description: description,
    target_player_visible: formData.get("player_visible") === "on",
    target_gm_notes: gmNotes,
    target_campaign_date: campaignDate,
    target_reason: reason,
  });

  if (error) {
    return { error: `Unable to save the house relationship: ${error.message}` };
  }

  revalidatePath("/gm/houses");
  revalidatePath("/player/houses");
  return {
    message: relationshipId ? "House relationship updated." : "House relationship saved.",
  };
}

export async function deleteHouseRelationship(
  _previousState: HouseRelationshipFormState,
  formData: FormData,
): Promise<HouseRelationshipFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can delete house relationships." };
  }

  const relationshipId = formData.get("relationship_id");
  if (
    typeof relationshipId !== "string" ||
    !isUuid(relationshipId)
  ) {
    return { error: "Choose a valid house relationship." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaign_house_relationships")
    .delete()
    .eq("campaign_id", member.campaign_id)
    .eq("id", relationshipId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: `Unable to delete the house relationship: ${error.message}` };
  }
  if (!data) {
    return { error: "The house relationship was not found in this campaign." };
  }

  revalidatePath("/gm/houses");
  revalidatePath("/player/houses");
  return { message: "House relationship deleted." };
}
