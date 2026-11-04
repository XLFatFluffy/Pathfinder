"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type HouseFormState = {
  error?: string;
  message?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function saveCampaignHouse(
  _previousState: HouseFormState,
  formData: FormData,
): Promise<HouseFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage noble houses." };
  }

  const houseIdValue = formData.get("house_id");
  const rulerIdValue = formData.get("current_ruler_id");
  const seatIdValue = formData.get("ancestral_seat_location_id");
  const nameValue = formData.get("name");
  const heraldryValue = formData.get("heraldry_description");
  const mottoValue = formData.get("motto");
  const descriptionValue = formData.get("description");
  const foundingHistoryValue = formData.get("founding_history");
  const holdingsValue = formData.get("holdings");
  const successionValue = formData.get("succession");
  const militaryStrengthValue = formData.get("military_strength");
  const wealthValue = formData.get("wealth");
  const resourcesValue = formData.get("resources");
  const politicalInfluenceValue = formData.get("political_influence");
  const religiousAffiliationsValue = formData.get("religious_affiliations");
  const objectivesValue = formData.get("objectives");
  const secretsValue = formData.get("secrets");

  if (
    (houseIdValue !== null && typeof houseIdValue !== "string") ||
    (rulerIdValue !== null && typeof rulerIdValue !== "string") ||
    (seatIdValue !== null && typeof seatIdValue !== "string") ||
    typeof nameValue !== "string" ||
    typeof heraldryValue !== "string" ||
    typeof mottoValue !== "string" ||
    typeof descriptionValue !== "string" ||
    typeof foundingHistoryValue !== "string" ||
    typeof holdingsValue !== "string" ||
    typeof successionValue !== "string" ||
    typeof militaryStrengthValue !== "string" ||
    typeof wealthValue !== "string" ||
    typeof resourcesValue !== "string" ||
    typeof politicalInfluenceValue !== "string" ||
    typeof religiousAffiliationsValue !== "string" ||
    typeof objectivesValue !== "string" ||
    typeof secretsValue !== "string"
  ) {
    return { error: "The noble-house form contained invalid fields." };
  }

  const houseId = houseIdValue?.trim() ?? "";
  const rulerId = rulerIdValue?.trim() ?? "";
  const seatId = seatIdValue?.trim() ?? "";
  const name = nameValue.trim();
  const heraldryDescription = heraldryValue.trim();
  const motto = mottoValue.trim();
  const description = descriptionValue.trim();
  const foundingHistory = foundingHistoryValue.trim();
  const holdings = holdingsValue.trim();
  const succession = successionValue.trim();
  const militaryStrength = militaryStrengthValue.trim();
  const wealth = wealthValue.trim();
  const resources = resourcesValue.trim();
  const politicalInfluence = politicalInfluenceValue.trim();
  const religiousAffiliations = religiousAffiliationsValue.trim();
  const objectives = objectivesValue.trim();
  const secrets = secretsValue.trim();

  if (
    (houseId && !isUuid(houseId)) ||
    (rulerId && !isUuid(rulerId)) ||
    (seatId && !isUuid(seatId))
  ) {
    return { error: "Choose valid house, ruler, and ancestral seat records." };
  }
  if (!name || name.length > 160) {
    return { error: "Enter a house name of 1 to 160 characters." };
  }

  const limits = [
    [heraldryDescription, 2000],
    [motto, 500],
    [description, 20000],
    [foundingHistory, 20000],
    [holdings, 10000],
    [succession, 10000],
    [militaryStrength, 4000],
    [wealth, 4000],
    [resources, 10000],
    [politicalInfluence, 4000],
    [religiousAffiliations, 4000],
    [objectives, 10000],
    [secrets, 20000],
  ] as const;
  if (limits.some(([value, maxLength]) => value.length > maxLength)) {
    return { error: "One or more house fields exceed their allowed length." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_campaign_house", {
    target_campaign_id: member.campaign_id,
    target_house_id: houseId || null,
    target_name: name,
    target_heraldry_description: heraldryDescription,
    target_motto: motto,
    target_description: description,
    target_player_visible: formData.get("player_visible") === "on",
    target_founding_history: foundingHistory,
    target_current_ruler_id: rulerId || null,
    target_ancestral_seat_location_id: seatId || null,
    target_holdings: holdings,
    target_succession: succession,
    target_military_strength: militaryStrength,
    target_wealth: wealth,
    target_resources: resources,
    target_political_influence: politicalInfluence,
    target_religious_affiliations: religiousAffiliations,
    target_objectives: objectives,
    target_secrets: secrets,
  });

  if (error) {
    return { error: `Unable to save the noble house: ${error.message}` };
  }

  revalidatePath("/gm/houses");
  revalidatePath("/player/houses");
  return { message: houseId ? "Noble house updated." : "Noble house saved." };
}

export async function deleteCampaignHouse(
  _previousState: HouseFormState,
  formData: FormData,
): Promise<HouseFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can delete noble houses." };
  }

  const houseId = formData.get("house_id");
  if (typeof houseId !== "string" || !isUuid(houseId)) {
    return { error: "Choose a valid noble house." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaign_houses")
    .delete()
    .eq("campaign_id", member.campaign_id)
    .eq("id", houseId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      error: `Unable to delete the noble house. Remove its political relationships first. ${error.message}`,
    };
  }
  if (!data) {
    return { error: "The noble house was not found in this campaign." };
  }

  revalidatePath("/gm/houses");
  revalidatePath("/player/houses");
  return { message: "Noble house deleted." };
}
