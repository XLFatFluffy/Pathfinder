import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CampaignRole = "gm" | "player";

export type CampaignMember = {
  campaign_id: string;
  role: CampaignRole;
};

export async function getCurrentCampaignMember(): Promise<CampaignMember | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to verify the current user: ${userError.message}`);
  }
  if (!user) {
    return null;
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("campaign_members")
    .select("campaign_id, role")
    .eq("user_id", user.id)
    .returns<CampaignMember[]>();

  if (membershipError) {
    throw new Error(`Unable to load campaign access: ${membershipError.message}`);
  }
  if (memberships.length > 1) {
    throw new Error(
      "This account belongs to multiple campaigns, but campaign selection is not available yet.",
    );
  }

  return memberships[0] ?? null;
}
