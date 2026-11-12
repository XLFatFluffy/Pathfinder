"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorldReviewFormState = {
  error?: string;
  message?: string;
};

const triggers = new Set(["session_end", "downtime", "pc_action", "gm_review", "other"]);
const subjectTypes = new Set([
  "npc", "house", "faction", "quest", "location", "event",
  "economy", "geography", "history", "other",
]);
const dispositions = new Set(["pending", "approved", "rejected", "deferred", "recorded"]);

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result.length <= max ? result : null;
}

function uuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function createWorldReview(
  _previous: WorldReviewFormState,
  formData: FormData,
): Promise<WorldReviewFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") return { error: "Only the campaign GM can manage world reviews." };

  const fromDate = text(formData, "from_campaign_date", 120);
  const toDate = text(formData, "to_campaign_date", 120);
  const trigger = text(formData, "trigger", 30);
  const summary = text(formData, "summary", 20000);

  if (!fromDate || !toDate || !trigger || !triggers.has(trigger)) {
    return { error: "Enter both dates and choose a valid review trigger." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("campaign_world_reviews").insert({
    campaign_id: member.campaign_id,
    from_campaign_date: fromDate,
    to_campaign_date: toDate,
    trigger,
    summary: summary ?? "",
    created_by: member.user_id,
  });
  if (error) return { error: `Unable to create world review: ${error.message}` };

  revalidatePath("/gm/world");
  revalidatePath("/gm");
  return { message: "World review created." };
}

export async function createWorldReviewItem(
  _previous: WorldReviewFormState,
  formData: FormData,
): Promise<WorldReviewFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") return { error: "Only the campaign GM can manage world reviews." };

  const reviewId = text(formData, "review_id", 80);
  const subjectType = text(formData, "subject_type", 30);
  const title = text(formData, "title", 200);
  const proposal = text(formData, "proposal", 20000);
  const basis = text(formData, "basis", 10000);
  const subjectIdValue = text(formData, "subject_id", 80);

  if (!reviewId || !uuid(reviewId) || !subjectType || !subjectTypes.has(subjectType) || !title || !proposal) {
    return { error: "Choose a review and provide a subject type, title, and proposal." };
  }
  if (subjectIdValue && !uuid(subjectIdValue)) return { error: "The linked subject ID is invalid." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("campaign_world_review_items").insert({
    campaign_id: member.campaign_id,
    review_id: reviewId,
    subject_type: subjectType,
    subject_id: subjectIdValue || null,
    title,
    proposal,
    basis: basis ?? "",
  });
  if (error) return { error: `Unable to add world-review item: ${error.message}` };

  revalidatePath("/gm/world");
  return { message: "World-review proposal added." };
}

export async function updateWorldReviewItem(
  _previous: WorldReviewFormState,
  formData: FormData,
): Promise<WorldReviewFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") return { error: "Only the campaign GM can manage world reviews." };

  const itemId = text(formData, "item_id", 80);
  const disposition = text(formData, "disposition", 20);
  const gmNotes = text(formData, "gm_notes", 10000);
  if (!itemId || !uuid(itemId) || !disposition || !dispositions.has(disposition)) {
    return { error: "Choose a valid proposal and disposition." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("campaign_world_review_items")
    .update({
      disposition,
      gm_notes: gmNotes ?? "",
      reviewed_at: disposition === "pending" ? null : new Date().toISOString(),
    })
    .eq("campaign_id", member.campaign_id)
    .eq("id", itemId);

  if (error) return { error: `Unable to update proposal: ${error.message}` };
  revalidatePath("/gm/world");
  return { message: "Proposal disposition saved." };
}

export async function updateWorldReviewStatus(
  _previous: WorldReviewFormState,
  formData: FormData,
): Promise<WorldReviewFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") return { error: "Only the campaign GM can manage world reviews." };

  const reviewId = text(formData, "review_id", 80);
  const status = text(formData, "status", 20);
  if (!reviewId || !uuid(reviewId) || !status || !["draft", "reviewed", "applied"].includes(status)) {
    return { error: "Choose a valid review and status." };
  }

  const now = new Date().toISOString();
  const values =
    status === "reviewed"
      ? { status, reviewed_at: now }
      : status === "applied"
        ? { status, applied_at: now }
        : { status };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("campaign_world_reviews")
    .update(values)
    .eq("campaign_id", member.campaign_id)
    .eq("id", reviewId);

  if (error) return { error: `Unable to update world review: ${error.message}` };
  revalidatePath("/gm/world");
  return { message: "World review status saved." };
}