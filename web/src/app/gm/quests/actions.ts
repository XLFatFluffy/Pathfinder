"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type QuestFormState = {
  error?: string;
  message?: string;
};

const questStatuses = [
  "undiscovered",
  "active",
  "completed",
  "failed",
  "rewarded",
  "cancelled",
] as const;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function saveCampaignQuest(
  _previousState: QuestFormState,
  formData: FormData,
): Promise<QuestFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage quests." };
  }

  const questIdValue = formData.get("quest_id");
  const nameValue = formData.get("name");
  const statusValue = formData.get("status");
  const summaryValue = formData.get("summary");
  const giverValue = formData.get("giver");
  const locationIdValue = formData.get("location_id");
  const notesValue = formData.get("gm_notes");
  if (
    (questIdValue !== null && typeof questIdValue !== "string") ||
    typeof nameValue !== "string" ||
    typeof statusValue !== "string" ||
    typeof summaryValue !== "string" ||
    typeof giverValue !== "string" ||
    (locationIdValue !== null && typeof locationIdValue !== "string") ||
    typeof notesValue !== "string"
  ) {
    return { error: "The quest form contained invalid fields." };
  }

  const questId = questIdValue?.trim() ?? "";
  const name = nameValue.trim();
  const status = statusValue.trim();
  const summary = summaryValue.trim();
  const giver = giverValue.trim();
  const locationId = locationIdValue?.trim() ?? "";
  const gmNotes = notesValue.trim();
  if (
    (questId && !isUuid(questId)) ||
    (locationId && !isUuid(locationId))
  ) {
    return { error: "Choose valid quest and location records." };
  }
  if (!name || name.length > 160) {
    return { error: "Enter a quest name of 1 to 160 characters." };
  }
  if (!questStatuses.some((allowedStatus) => allowedStatus === status)) {
    return { error: "Choose a valid quest status." };
  }
  if (summary.length > 4000 || giver.length > 4000 || gmNotes.length > 20000) {
    return { error: "One or more quest fields exceed their allowed length." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_campaign_quest", {
    target_campaign_id: member.campaign_id,
    target_quest_id: questId || null,
    target_name: name,
    target_status: status,
    target_summary: summary,
    target_giver: giver,
    target_location_id: locationId || null,
    target_player_visible: formData.get("player_visible") === "on",
    target_gm_notes: gmNotes,
  });

  if (error) {
    return { error: `Unable to save the quest: ${error.message}` };
  }

  revalidatePath("/gm/quests");
  revalidatePath("/player/quests");
  revalidatePath("/gm");
  revalidatePath("/player");
  return { message: questId ? "Quest updated." : "Quest saved." };
}

export async function deleteCampaignQuest(
  _previousState: QuestFormState,
  formData: FormData,
): Promise<QuestFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can delete quests." };
  }

  const questId = formData.get("quest_id");
  if (typeof questId !== "string" || !isUuid(questId)) {
    return { error: "Choose a valid quest." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaign_quests")
    .delete()
    .eq("campaign_id", member.campaign_id)
    .eq("id", questId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: `Unable to delete the quest: ${error.message}` };
  }
  if (!data) {
    return { error: "The quest was not found in this campaign." };
  }

  revalidatePath("/gm/quests");
  revalidatePath("/player/quests");
  revalidatePath("/gm");
  revalidatePath("/player");
  return { message: "Quest deleted." };
}
