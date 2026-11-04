"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type JournalEntryFormState = {
  error?: string;
  message?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function saveCampaignJournalEntry(
  _previousState: JournalEntryFormState,
  formData: FormData,
): Promise<JournalEntryFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage journal entries." };
  }

  const titleValue = formData.get("title");
  const contentValue = formData.get("content");
  const dateValue = formData.get("campaign_date");
  const entryIdValue = formData.get("entry_id");
  if (
    typeof titleValue !== "string" ||
    typeof contentValue !== "string" ||
    typeof dateValue !== "string" ||
    (entryIdValue !== null && typeof entryIdValue !== "string")
  ) {
    return { error: "The journal entry form contained invalid fields." };
  }

  const entryId = typeof entryIdValue === "string" ? entryIdValue.trim() : "";
  const title = titleValue.trim();
  const content = contentValue.trim();
  const campaignDate = dateValue.trim();
  if (entryId && !isUuid(entryId)) {
    return { error: "Choose a valid journal entry." };
  }
  if (!title || title.length > 200) {
    return { error: "Enter a title of 1 to 200 characters." };
  }
  if (content.length > 50000 || campaignDate.length > 120) {
    return { error: "Journal notes or campaign date exceed the allowed length." };
  }

  const supabase = await createSupabaseServerClient();
  const values = {
    title,
    content,
    campaign_date: campaignDate || null,
    player_visible: formData.get("player_visible") === "on",
  };
  if (entryId) {
    const { data, error } = await supabase
      .from("campaign_journal_entries")
      .update(values)
      .eq("campaign_id", member.campaign_id)
      .eq("id", entryId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { error: `Unable to update the journal entry: ${error.message}` };
    }
    if (!data) {
      return { error: "The journal entry was not found in this campaign." };
    }
  } else {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      return { error: `Unable to verify the current user: ${userError.message}` };
    }
    if (!user) {
      return { error: "Sign in again before saving this journal entry." };
    }

    const { error } = await supabase.from("campaign_journal_entries").insert({
      ...values,
      campaign_id: member.campaign_id,
      created_by: user.id,
    });

    if (error) {
      return { error: `Unable to save the journal entry: ${error.message}` };
    }
  }

  revalidatePath("/gm");
  revalidatePath("/player");
  return { message: entryId ? "Journal entry updated." : "Journal entry saved." };
}

export async function deleteCampaignJournalEntry(
  _previousState: JournalEntryFormState,
  formData: FormData,
): Promise<JournalEntryFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can delete journal entries." };
  }

  const entryId = formData.get("entry_id");
  if (typeof entryId !== "string" || !isUuid(entryId)) {
    return { error: "Choose a valid journal entry." };
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
    return { error: `Unable to delete the journal entry: ${error.message}` };
  }
  if (!data) {
    return { error: "The journal entry was not found in this campaign." };
  }

  revalidatePath("/gm");
  revalidatePath("/player");
  return { message: "Journal entry deleted." };
}
