"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EncounterFormState = {
  error?: string;
  message?: string;
};

const encounterStatuses = ["planned", "ready", "played", "cancelled"] as const;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function revalidateEncounterPaths() {
  revalidatePath("/gm/encounters");
  revalidatePath("/player/encounters");
  revalidatePath("/gm");
}

export async function saveCampaignEncounter(
  _previousState: EncounterFormState,
  formData: FormData,
): Promise<EncounterFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage encounters." };
  }

  const encounterIdValue = formData.get("encounter_id");
  const fieldNames = [
    "name",
    "description",
    "campaign_date",
    "location_id",
    "quest_id",
    "session_id",
    "map_id",
    "difficulty",
    "status",
    "outcome",
    "aftermath",
    "gm_notes",
  ] as const;
  if (encounterIdValue !== null && typeof encounterIdValue !== "string") {
    return { error: "The encounter form contained an invalid record ID." };
  }
  const fields = new Map<string, string>();
  for (const fieldName of fieldNames) {
    const value = formData.get(fieldName);
    if (typeof value !== "string") {
      return { error: "The encounter form contained invalid fields." };
    }
    fields.set(fieldName, value.trim());
  }

  const value = (fieldName: (typeof fieldNames)[number]) =>
    fields.get(fieldName) ?? "";
  const encounterId = encounterIdValue?.trim() ?? "";
  const name = value("name");
  const status = value("status");
  const linkedRecordIds = [
    value("location_id"),
    value("quest_id"),
    value("session_id"),
    value("map_id"),
  ];
  if (
    (encounterId && !isUuid(encounterId)) ||
    linkedRecordIds.some((id) => id && !isUuid(id))
  ) {
    return { error: "Choose valid encounter and linked campaign records." };
  }
  if (!name || name.length > 200) {
    return { error: "Enter an encounter name of 1 to 200 characters." };
  }
  if (!encounterStatuses.some((allowedStatus) => allowedStatus === status)) {
    return { error: "Choose a valid encounter status." };
  }
  if (
    value("description").length > 20000 ||
    value("campaign_date").length > 120 ||
    value("difficulty").length > 80 ||
    value("outcome").length > 10000 ||
    value("aftermath").length > 10000 ||
    value("gm_notes").length > 20000
  ) {
    return { error: "One or more encounter fields exceed their allowed length." };
  }

  const rawNpcIds = formData.getAll("npc_ids");
  if (
    rawNpcIds.length > 100 ||
    rawNpcIds.some((id) => typeof id !== "string" || !isUuid(id))
  ) {
    return { error: "Choose valid NPCs for the encounter." };
  }
  const npcIds = [
    ...new Set(rawNpcIds.filter((id): id is string => typeof id === "string")),
  ];

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_campaign_encounter", {
    target_campaign_id: member.campaign_id,
    target_encounter_id: encounterId || null,
    target_name: name,
    target_description: value("description"),
    target_campaign_date: value("campaign_date"),
    target_location_id: value("location_id") || null,
    target_quest_id: value("quest_id") || null,
    target_session_id: value("session_id") || null,
    target_map_id: value("map_id") || null,
    target_difficulty: value("difficulty"),
    target_status: status,
    target_outcome: value("outcome"),
    target_aftermath: value("aftermath"),
    target_player_visible: formData.get("player_visible") === "on",
    target_npc_ids: npcIds,
    target_gm_notes: value("gm_notes"),
  });
  if (error) {
    return { error: `Unable to save the encounter: ${error.message}` };
  }

  revalidateEncounterPaths();
  return { message: encounterId ? "Encounter updated." : "Encounter saved." };
}

export async function deleteCampaignEncounter(
  _previousState: EncounterFormState,
  formData: FormData,
): Promise<EncounterFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can delete encounters." };
  }

  const encounterId = formData.get("encounter_id");
  if (typeof encounterId !== "string" || !isUuid(encounterId)) {
    return { error: "Choose a valid encounter." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaign_encounters")
    .delete()
    .eq("campaign_id", member.campaign_id)
    .eq("id", encounterId)
    .select("id")
    .maybeSingle();
  if (error) {
    return { error: `Unable to delete the encounter: ${error.message}` };
  }
  if (!data) {
    return { error: "The encounter was not found in this campaign." };
  }

  revalidateEncounterPaths();
  return { message: "Encounter deleted." };
}
