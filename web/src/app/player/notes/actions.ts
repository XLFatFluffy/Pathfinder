"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PlayerNoteFormState = {
  error?: string;
  message?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function savePlayerNote(
  _previousState: PlayerNoteFormState,
  formData: FormData,
): Promise<PlayerNoteFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "player") {
    return { error: "Only a campaign player can manage personal notes." };
  }

  const noteIdValue = formData.get("note_id");
  const titleValue = formData.get("title");
  const contentValue = formData.get("content");
  if (
    (noteIdValue !== null && typeof noteIdValue !== "string") ||
    typeof titleValue !== "string" ||
    typeof contentValue !== "string"
  ) {
    return { error: "The note form contained invalid fields." };
  }

  const noteId = typeof noteIdValue === "string" ? noteIdValue.trim() : "";
  const title = titleValue.trim();
  const content = contentValue.trim();
  if (noteId && !isUuid(noteId)) {
    return { error: "Choose a valid personal note." };
  }
  if (!title || title.length > 160) {
    return { error: "Enter a note title of 1 to 160 characters." };
  }
  if (content.length > 20000) {
    return { error: "Note content cannot exceed 20,000 characters." };
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
    return { error: "Sign in again before saving a personal note." };
  }

  if (noteId) {
    const { data, error } = await supabase
      .from("campaign_player_notes")
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq("campaign_id", member.campaign_id)
      .eq("user_id", user.id)
      .eq("id", noteId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { error: `Unable to update your note: ${error.message}` };
    }
    if (!data) {
      return { error: "The personal note was not found." };
    }
  } else {
    const { error } = await supabase.from("campaign_player_notes").insert({
      campaign_id: member.campaign_id,
      user_id: user.id,
      title,
      content,
    });

    if (error) {
      return { error: `Unable to save your note: ${error.message}` };
    }
  }

  revalidatePath("/player");
  revalidatePath("/player/notes");
  return { message: noteId ? "Note updated." : "Note saved." };
}

export async function deletePlayerNote(
  _previousState: PlayerNoteFormState,
  formData: FormData,
): Promise<PlayerNoteFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "player") {
    return { error: "Only a campaign player can delete personal notes." };
  }

  const noteId = formData.get("note_id");
  if (typeof noteId !== "string" || !isUuid(noteId)) {
    return { error: "Choose a valid personal note." };
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
    return { error: "Sign in again before deleting a personal note." };
  }

  const { data, error } = await supabase
    .from("campaign_player_notes")
    .delete()
    .eq("campaign_id", member.campaign_id)
    .eq("user_id", user.id)
    .eq("id", noteId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: `Unable to delete your note: ${error.message}` };
  }
  if (!data) {
    return { error: "The personal note was not found." };
  }

  revalidatePath("/player");
  revalidatePath("/player/notes");
  return { message: "Note deleted." };
}
