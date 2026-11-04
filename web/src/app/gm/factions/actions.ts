"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FactionFormState = {
  error?: string;
  message?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function saveCampaignFaction(
  _previousState: FactionFormState,
  formData: FormData,
): Promise<FactionFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage factions." };
  }

  const textFields = [
    "faction_id",
    "name",
    "faction_type",
    "description",
    "leader_npc_id",
    "headquarters_location_id",
    "objectives",
    "resources",
    "influence",
    "membership",
    "allies_and_rivals",
    "current_activities",
    "history",
    "secrets",
  ] as const;
  const values = Object.fromEntries(
    textFields.map((field) => [field, formData.get(field)]),
  ) as Record<(typeof textFields)[number], FormDataEntryValue | null>;

  if (textFields.some((field) => typeof values[field] !== "string")) {
    return { error: "The faction form contained invalid fields." };
  }

  const factionId = (values.faction_id as string).trim();
  const name = (values.name as string).trim();
  const factionType = (values.faction_type as string).trim();
  const description = (values.description as string).trim();
  const leaderNpcId = (values.leader_npc_id as string).trim();
  const headquartersLocationId = (
    values.headquarters_location_id as string
  ).trim();
  const objectives = (values.objectives as string).trim();
  const resources = (values.resources as string).trim();
  const influence = (values.influence as string).trim();
  const membership = (values.membership as string).trim();
  const alliesAndRivals = (values.allies_and_rivals as string).trim();
  const currentActivities = (values.current_activities as string).trim();
  const history = (values.history as string).trim();
  const secrets = (values.secrets as string).trim();

  if (
    (factionId && !isUuid(factionId)) ||
    (leaderNpcId && !isUuid(leaderNpcId)) ||
    (headquartersLocationId && !isUuid(headquartersLocationId))
  ) {
    return { error: "Choose valid faction, leader, and headquarters records." };
  }
  if (!name || name.length > 160) {
    return { error: "Enter a faction name of 1 to 160 characters." };
  }

  const limits = [
    [factionType, 120],
    [description, 20000],
    [objectives, 10000],
    [resources, 10000],
    [influence, 4000],
    [membership, 10000],
    [alliesAndRivals, 10000],
    [currentActivities, 10000],
    [history, 20000],
    [secrets, 20000],
  ] as const;
  if (limits.some(([value, maxLength]) => value.length > maxLength)) {
    return { error: "One or more faction fields exceed their allowed length." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_campaign_faction", {
    target_campaign_id: member.campaign_id,
    target_faction_id: factionId || null,
    target_name: name,
    target_faction_type: factionType,
    target_description: description,
    target_leader_npc_id: leaderNpcId || null,
    target_headquarters_location_id: headquartersLocationId || null,
    target_player_visible: formData.get("player_visible") === "on",
    target_objectives: objectives,
    target_resources: resources,
    target_influence: influence,
    target_membership: membership,
    target_allies_and_rivals: alliesAndRivals,
    target_current_activities: currentActivities,
    target_history: history,
    target_secrets: secrets,
  });

  if (error) {
    return { error: `Unable to save the faction: ${error.message}` };
  }

  revalidatePath("/gm/factions");
  revalidatePath("/player/factions");
  revalidatePath("/gm");
  revalidatePath("/player");
  return { message: factionId ? "Faction updated." : "Faction saved." };
}

export async function deleteCampaignFaction(
  _previousState: FactionFormState,
  formData: FormData,
): Promise<FactionFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can delete factions." };
  }

  const factionId = formData.get("faction_id");
  if (typeof factionId !== "string" || !isUuid(factionId)) {
    return { error: "Choose a valid faction." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaign_factions")
    .delete()
    .eq("campaign_id", member.campaign_id)
    .eq("id", factionId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: `Unable to delete the faction: ${error.message}` };
  }
  if (!data) {
    return { error: "The faction was not found in this campaign." };
  }

  revalidatePath("/gm/factions");
  revalidatePath("/player/factions");
  revalidatePath("/gm");
  revalidatePath("/player");
  return { message: "Faction deleted." };
}
