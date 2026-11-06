"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CampaignEventFormState = {
  error?: string;
  message?: string;
};

const eventCategories = new Set([
  "historical",
  "political",
  "festival",
  "religious",
  "faction",
  "quest_deadline",
  "session",
  "personal",
  "regional",
]);
const eventStatuses = new Set(["planned", "active", "completed", "cancelled"]);
const eventCertainties = new Set([
  "confirmed",
  "planned",
  "rumored",
  "unresolved",
]);

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function optionalRecordId(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string") {
    return { valid: false as const, id: null };
  }
  const id = value.trim();
  return {
    valid: !id || isUuid(id),
    id: id || null,
  };
}

export async function saveCampaignEvent(
  _previousState: CampaignEventFormState,
  formData: FormData,
): Promise<CampaignEventFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage campaign events." };
  }

  const textFields = [
    "event_id",
    "title",
    "description",
    "campaign_date",
    "end_date",
    "category",
    "status",
    "certainty",
    "source",
    "gm_notes",
  ] as const;
  const values = new Map<string, string>();
  for (const field of textFields) {
    const value = formData.get(field);
    if (typeof value !== "string") {
      return { error: "The campaign event form contained invalid fields." };
    }
    values.set(field, value.trim());
  }

  const eventId = values.get("event_id") ?? "";
  const title = values.get("title") ?? "";
  const description = values.get("description") ?? "";
  const campaignDate = values.get("campaign_date") ?? "";
  const endDate = values.get("end_date") ?? "";
  const category = values.get("category") ?? "";
  const status = values.get("status") ?? "";
  const certainty = values.get("certainty") ?? "";
  const source = values.get("source") ?? "";
  const gmNotes = values.get("gm_notes") ?? "";

  if (eventId && !isUuid(eventId)) {
    return { error: "Choose a valid campaign event." };
  }
  if (!title || title.length > 200) {
    return { error: "Enter an event title of 1 to 200 characters." };
  }
  if (!campaignDate || campaignDate.length > 120 || endDate.length > 120) {
    return { error: "Enter a campaign date and keep each date within 120 characters." };
  }
  if (
    description.length > 20000 ||
    source.length > 2000 ||
    gmNotes.length > 20000
  ) {
    return { error: "One or more event fields exceed their allowed length." };
  }
  if (
    !eventCategories.has(category) ||
    !eventStatuses.has(status) ||
    !eventCertainties.has(certainty)
  ) {
    return { error: "Choose a valid event category, status, and certainty." };
  }

  const linkedIds = [
    optionalRecordId(formData, "location_id"),
    optionalRecordId(formData, "npc_id"),
    optionalRecordId(formData, "house_id"),
    optionalRecordId(formData, "faction_id"),
    optionalRecordId(formData, "quest_id"),
    optionalRecordId(formData, "session_id"),
  ];
  if (linkedIds.some((record) => !record.valid)) {
    return { error: "Choose valid linked campaign records." };
  }
  const [
    locationId,
    npcId,
    houseId,
    factionId,
    questId,
    sessionId,
  ] = linkedIds.map((record) => record.id);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_campaign_event", {
    target_campaign_id: member.campaign_id,
    target_event_id: eventId || null,
    target_title: title,
    target_description: description,
    target_campaign_date: campaignDate,
    target_end_date: endDate,
    target_date_is_approximate: formData.get("date_is_approximate") === "on",
    target_category: category,
    target_status: status,
    target_certainty: certainty,
    target_source: source,
    target_location_id: locationId,
    target_npc_id: npcId,
    target_house_id: houseId,
    target_faction_id: factionId,
    target_quest_id: questId,
    target_session_id: sessionId,
    target_player_visible: formData.get("player_visible") === "on",
    target_gm_notes: gmNotes,
  });

  if (error) {
    return { error: `Unable to save the campaign event: ${error.message}` };
  }

  revalidatePath("/gm/calendar");
  revalidatePath("/gm/timeline");
  revalidatePath("/player/calendar");
  revalidatePath("/player/timeline");
  revalidatePath("/gm");
  revalidatePath("/player");
  return { message: eventId ? "Campaign event updated." : "Campaign event saved." };
}

export async function deleteCampaignEvent(
  _previousState: CampaignEventFormState,
  formData: FormData,
): Promise<CampaignEventFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage campaign events." };
  }

  const eventId = formData.get("event_id");
  if (typeof eventId !== "string" || !isUuid(eventId)) {
    return { error: "Choose a valid campaign event." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("delete_campaign_event", {
    target_campaign_id: member.campaign_id,
    target_event_id: eventId,
  });
  if (error) {
    return { error: `Unable to delete the campaign event: ${error.message}` };
  }

  revalidatePath("/gm/calendar");
  revalidatePath("/gm/timeline");
  revalidatePath("/player/calendar");
  revalidatePath("/player/timeline");
  revalidatePath("/gm");
  revalidatePath("/player");
  return { message: "Campaign event deleted." };
}
