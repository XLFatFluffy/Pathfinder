"use server";

import { revalidatePath } from "next/cache";
import {
  CAMPAIGN_NOTE_CATEGORIES,
  CAMPAIGN_NOTE_LINK_TYPES,
  type CampaignNoteLink,
  type CampaignNoteLinkType,
} from "@/lib/campaign-notes";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CampaignNoteFormState = {
  error?: string;
  message?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isNoteLinkType(value: string): value is CampaignNoteLinkType {
  return CAMPAIGN_NOTE_LINK_TYPES.some((linkType) => linkType === value);
}

function refreshJournalPaths() {
  revalidatePath("/gm/notes");
  revalidatePath("/gm");
  revalidatePath("/player");
  revalidatePath("/player/journal");
  revalidatePath("/gm/calendar");
  revalidatePath("/gm/timeline");
}

export async function saveCampaignNote(
  _previousState: CampaignNoteFormState,
  formData: FormData,
): Promise<CampaignNoteFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage campaign notes." };
  }

  const entryIdValue = formData.get("entry_id");
  if (entryIdValue !== null && typeof entryIdValue !== "string") {
    return { error: "The campaign note form contained an invalid note ID." };
  }
  const fields = ["title", "content", "campaign_date", "category", "tags"];
  const values = new Map<string, string>();
  for (const field of fields) {
    const value = formData.get(field);
    if (typeof value !== "string") {
      return { error: "The campaign note form contained invalid fields." };
    }
    values.set(field, value.trim());
  }

  const entryId = entryIdValue?.trim() ?? "";
  const title = values.get("title") ?? "";
  const content = values.get("content") ?? "";
  const campaignDate = values.get("campaign_date") ?? "";
  const category = values.get("category") ?? "";
  const tags = (values.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (entryId && !isUuid(entryId)) {
    return { error: "Choose a valid campaign note." };
  }
  if (!title || title.length > 200) {
    return { error: "Enter a title of 1 to 200 characters." };
  }
  if (content.length > 50000 || campaignDate.length > 120) {
    return { error: "Note content or campaign date exceeds the allowed length." };
  }
  if (!CAMPAIGN_NOTE_CATEGORIES.some((item) => item.value === category)) {
    return { error: "Choose a valid note category." };
  }
  if (tags.length > 20 || tags.some((tag) => tag.length > 40)) {
    return { error: "Use no more than 20 tags, each 40 characters or fewer." };
  }
  const normalizedTags = [...new Map(tags.map((tag) => [tag.toLowerCase(), tag])).values()];

  const rawLinks = formData.getAll("links");
  if (rawLinks.length > 32 || rawLinks.some((value) => typeof value !== "string")) {
    return { error: "Choose no more than 32 linked campaign records." };
  }
  const links: CampaignNoteLink[] = [];
  const seenLinks = new Set<string>();
  for (const rawLink of rawLinks) {
    if (typeof rawLink !== "string") {
      return { error: "The campaign note links contained invalid values." };
    }
    const [type, id, ...extra] = rawLink.split(":");
    if (extra.length || !isNoteLinkType(type) || !isUuid(id)) {
      return { error: "Choose valid linked campaign records." };
    }
    const key = `${type}:${id}`;
    if (!seenLinks.has(key)) {
      links.push({ type, id });
      seenLinks.add(key);
    }
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_campaign_note", {
    target_campaign_id: member.campaign_id,
    target_entry_id: entryId || null,
    target_title: title,
    target_content: content,
    target_campaign_date: campaignDate,
    target_category: category,
    target_tags: normalizedTags,
    target_pinned: formData.get("pinned") === "on",
    target_player_visible: formData.get("player_visible") === "on",
    target_links: links,
  });
  if (error) {
    return { error: `Unable to save the campaign note: ${error.message}` };
  }

  refreshJournalPaths();
  return { message: entryId ? "Campaign note updated." : "Campaign note saved." };
}

export async function deleteCampaignNote(
  _previousState: CampaignNoteFormState,
  formData: FormData,
): Promise<CampaignNoteFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage campaign notes." };
  }

  const entryId = formData.get("entry_id");
  if (typeof entryId !== "string" || !isUuid(entryId)) {
    return { error: "Choose a valid campaign note." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaign_journal_entries")
    .delete()
    .eq("campaign_id", member.campaign_id)
    .eq("id", entryId)
    .select("id")
    .maybeSingle();
  if (error) {
    return { error: `Unable to delete the campaign note: ${error.message}` };
  }
  if (!data) {
    return { error: "The campaign note was not found in this campaign." };
  }

  refreshJournalPaths();
  return { message: "Campaign note deleted." };
}
