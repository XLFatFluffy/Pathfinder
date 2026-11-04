"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NpcFormState = {
  error?: string;
  message?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function saveCampaignNpc(
  _previousState: NpcFormState,
  formData: FormData,
): Promise<NpcFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage NPCs." };
  }

  const npcIdValue = formData.get("npc_id");
  const locationIdValue = formData.get("location_id");
  const nameValue = formData.get("name");
  const raceValue = formData.get("race");
  const ageValue = formData.get("age");
  const genderValue = formData.get("gender");
  const occupationValue = formData.get("occupation");
  const titlesValue = formData.get("titles");
  const descriptionValue = formData.get("description");
  const statusValue = formData.get("status");
  const gmNotesValue = formData.get("gm_notes");
  const statusDateValue = formData.get("status_date");
  const statusReasonValue = formData.get("status_reason");
  if (
    (npcIdValue !== null && typeof npcIdValue !== "string") ||
    (locationIdValue !== null && typeof locationIdValue !== "string") ||
    typeof nameValue !== "string" ||
    typeof raceValue !== "string" ||
    typeof ageValue !== "string" ||
    typeof genderValue !== "string" ||
    typeof occupationValue !== "string" ||
    typeof titlesValue !== "string" ||
    typeof descriptionValue !== "string" ||
    typeof statusValue !== "string" ||
    typeof gmNotesValue !== "string" ||
    typeof statusDateValue !== "string" ||
    typeof statusReasonValue !== "string"
  ) {
    return { error: "The NPC form contained invalid fields." };
  }

  const npcId = npcIdValue?.trim() ?? "";
  const locationId =
    locationIdValue?.trim() ?? "";
  const name = nameValue.trim();
  const race = raceValue.trim();
  const age = ageValue.trim();
  const gender = genderValue.trim();
  const occupation = occupationValue.trim();
  const titles = titlesValue.trim();
  const description = descriptionValue.trim();
  const status = statusValue.trim();
  const gmNotes = gmNotesValue.trim();
  const statusDate = statusDateValue.trim();
  const statusReason = statusReasonValue.trim();

  if (npcId && !isUuid(npcId)) {
    return { error: "Choose a valid NPC." };
  }
  if (locationId && !isUuid(locationId)) {
    return { error: "Choose a valid location." };
  }
  if (!name || name.length > 160) {
    return { error: "Enter an NPC name of 1 to 160 characters." };
  }
  if (
    race.length > 80 ||
    age.length > 80 ||
    gender.length > 80 ||
    occupation.length > 120 ||
    titles.length > 2000 ||
    description.length > 20000 ||
    gmNotes.length > 20000 ||
    !status ||
    status.length > 80 ||
    statusDate.length > 120 ||
    statusReason.length > 2000
  ) {
    return { error: "One or more NPC fields exceed their allowed length." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: `Unable to verify the current user: ${userError.message}` };
  }
  if (!user) {
    return { error: "Sign in again before saving this NPC." };
  }

  const { error } = await supabase.rpc("save_campaign_npc", {
    target_campaign_id: member.campaign_id,
    target_npc_id: npcId || null,
    target_location_id: locationId || null,
    target_name: name,
    target_race: race,
    target_age: age,
    target_gender: gender,
    target_occupation: occupation,
    target_titles: titles,
    target_description: description,
    target_status: status,
    target_player_visible: formData.get("player_visible") === "on",
    target_gm_notes: gmNotes,
    target_status_date: statusDate,
    target_status_reason: statusReason,
  });

  if (error) {
    return { error: `Unable to save the NPC: ${error.message}` };
  }

  revalidatePath("/gm/npcs");
  revalidatePath("/player/npcs");
  revalidatePath("/gm/atlas");
  revalidatePath("/player/atlas");
  return { message: npcId ? "NPC updated." : "NPC saved." };
}

export async function deleteCampaignNpc(
  _previousState: NpcFormState,
  formData: FormData,
): Promise<NpcFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can delete NPCs." };
  }

  const npcId = formData.get("npc_id");
  if (typeof npcId !== "string" || !isUuid(npcId)) {
    return { error: "Choose a valid NPC." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaign_npcs")
    .delete()
    .eq("campaign_id", member.campaign_id)
    .eq("id", npcId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      error: `Unable to delete the NPC. Remove any related campaign records first. ${error.message}`,
    };
  }
  if (!data) {
    return { error: "The NPC was not found in this campaign." };
  }

  revalidatePath("/gm/npcs");
  revalidatePath("/player/npcs");
  revalidatePath("/gm/atlas");
  revalidatePath("/player/atlas");
  return { message: "NPC deleted." };
}
