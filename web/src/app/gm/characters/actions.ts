"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GmCharacterNotesFormState = {
  error?: string;
  message?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function saveGmCharacterNotes(
  _previousState: GmCharacterNotesFormState,
  formData: FormData,
): Promise<GmCharacterNotesFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage private character notes." };
  }

  const characterId = formData.get("character_id");
  const notesValue = formData.get("notes");
  if (
    typeof characterId !== "string" ||
    !isUuid(characterId) ||
    typeof notesValue !== "string"
  ) {
    return { error: "The private character-notes form contained invalid fields." };
  }

  const notes = notesValue.trim();
  if (notes.length > 20000) {
    return { error: "Private character notes cannot exceed 20,000 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_campaign_character_gm_notes", {
    target_campaign_id: member.campaign_id,
    target_character_id: characterId,
    target_notes: notes,
  });

  if (error) {
    return { error: `Unable to save private character notes: ${error.message}` };
  }

  revalidatePath("/gm/characters");
  return { message: "Private character notes saved." };
}
