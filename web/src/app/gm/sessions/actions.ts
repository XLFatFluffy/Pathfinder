"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionFormState = {
  error?: string;
  message?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function saveCampaignSession(
  _previousState: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage session logs." };
  }

  const sessionIdValue = formData.get("session_id");
  const numberValue = formData.get("session_number");
  const dateValue = formData.get("campaign_date");
  const summaryValue = formData.get("summary");
  const notesValue = formData.get("gm_notes");
  if (
    (sessionIdValue !== null && typeof sessionIdValue !== "string") ||
    typeof numberValue !== "string" ||
    typeof dateValue !== "string" ||
    typeof summaryValue !== "string" ||
    typeof notesValue !== "string"
  ) {
    return { error: "The session form contained invalid fields." };
  }

  const sessionId = sessionIdValue?.trim() ?? "";
  const sessionNumber = Number(numberValue);
  const campaignDate = dateValue.trim();
  const summary = summaryValue.trim();
  const gmNotes = notesValue.trim();
  if (sessionId && !isUuid(sessionId)) {
    return { error: "Choose a valid session record." };
  }
  if (!Number.isSafeInteger(sessionNumber) || sessionNumber < 1) {
    return { error: "Session number must be a positive whole number." };
  }
  if (campaignDate.length > 120 || summary.length > 50000 || gmNotes.length > 20000) {
    return { error: "One or more session fields exceed their allowed length." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_campaign_session", {
    target_campaign_id: member.campaign_id,
    target_session_id: sessionId || null,
    target_session_number: sessionNumber,
    target_campaign_date: campaignDate,
    target_summary: summary,
    target_player_visible: formData.get("player_visible") === "on",
    target_gm_notes: gmNotes,
  });

  if (error) {
    return { error: `Unable to save the session log: ${error.message}` };
  }

  revalidatePath("/gm/sessions");
  revalidatePath("/player/sessions");
  revalidatePath("/gm");
  revalidatePath("/player");
  return { message: sessionId ? "Session log updated." : "Session log saved." };
}

export async function deleteCampaignSession(
  _previousState: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can delete session logs." };
  }

  const sessionId = formData.get("session_id");
  if (typeof sessionId !== "string" || !isUuid(sessionId)) {
    return { error: "Choose a valid session log." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaign_sessions")
    .delete()
    .eq("campaign_id", member.campaign_id)
    .eq("id", sessionId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: `Unable to delete the session log: ${error.message}` };
  }
  if (!data) {
    return { error: "The session log was not found in this campaign." };
  }

  revalidatePath("/gm/sessions");
  revalidatePath("/player/sessions");
  revalidatePath("/gm");
  revalidatePath("/player");
  return { message: "Session log deleted." };
}
