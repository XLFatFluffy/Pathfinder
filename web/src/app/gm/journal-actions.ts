"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type JournalEntryFormState = {
  error?: string;
  message?: string;
};

export async function createCampaignJournalEntry(
  _previousState: JournalEntryFormState,
  formData: FormData,
): Promise<JournalEntryFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can create journal entries." };
  }

  const titleValue = formData.get("title");
  const contentValue = formData.get("content");
  const dateValue = formData.get("campaign_date");
  if (
    typeof titleValue !== "string" ||
    typeof contentValue !== "string" ||
    typeof dateValue !== "string"
  ) {
    return { error: "The journal entry form contained invalid fields." };
  }

  const title = titleValue.trim();
  const content = contentValue.trim();
  const campaignDate = dateValue.trim();
  if (!title || title.length > 200) {
    return { error: "Enter a title of 1 to 200 characters." };
  }
  if (content.length > 50000 || campaignDate.length > 120) {
    return { error: "Journal notes or campaign date exceed the allowed length." };
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
    return { error: "Sign in again before saving this journal entry." };
  }

  const { error } = await supabase.from("campaign_journal_entries").insert({
    campaign_id: member.campaign_id,
    title,
    content,
    campaign_date: campaignDate || null,
    player_visible: formData.get("player_visible") === "on",
    created_by: user.id,
  });

  if (error) {
    return { error: `Unable to save the journal entry: ${error.message}` };
  }

  revalidatePath("/gm");
  revalidatePath("/player");
  return { message: "Journal entry saved." };
}
