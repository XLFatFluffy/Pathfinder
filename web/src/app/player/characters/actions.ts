"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CharacterFormState = {
  error?: string;
  message?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function savePlayerCharacter(
  _previousState: CharacterFormState,
  formData: FormData,
): Promise<CharacterFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "player") {
    return { error: "Only a campaign player can manage their character sheets." };
  }

  const characterIdValue = formData.get("character_id");
  const levelValue = formData.get("level");
  const nameValue = formData.get("name");
  const ancestryValue = formData.get("ancestry");
  const classNameValue = formData.get("class_name");

  if (
    (characterIdValue !== null && typeof characterIdValue !== "string") ||
    typeof levelValue !== "string" ||
    typeof nameValue !== "string" ||
    typeof ancestryValue !== "string" ||
    typeof classNameValue !== "string"
  ) {
    return { error: "The character record contained invalid fields." };
  }

  const characterId = characterIdValue?.trim() ?? "";
  const name = nameValue.trim();
  const ancestry = ancestryValue.trim();
  const className = classNameValue.trim();
  const level = Number(levelValue);

  if (characterId && !isUuid(characterId)) {
    return { error: "Choose a valid character record." };
  }
  if (!name || name.length > 160) {
    return { error: "Enter a character name of 1 to 160 characters." };
  }
  if (!Number.isSafeInteger(level) || level < 1 || level > 20) {
    return { error: "Character level must be a whole number from 1 to 20." };
  }
  if (ancestry.length > 120 || className.length > 120) {
    return { error: "Ancestry and class names cannot exceed 120 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: `Unable to verify your account: ${userError.message}` };
  }
  if (!user) {
    return { error: "Sign in again before saving this character." };
  }

  const values = {
    name,
    ancestry,
    class_name: className,
    level,
  };
  if (characterId) {
    const { data, error } = await supabase
      .from("campaign_characters")
      .update(values)
      .eq("campaign_id", member.campaign_id)
      .eq("owner_user_id", user.id)
      .eq("id", characterId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { error: `Unable to save the character record: ${error.message}` };
    }
    if (!data) {
      return { error: "The character record was not found in your account." };
    }
  } else {
    const { error } = await supabase.from("campaign_characters").insert({
      campaign_id: member.campaign_id,
      owner_user_id: user.id,
      ...values,
    });

    if (error) {
      return { error: `Unable to save the character record: ${error.message}` };
    }
  }

  revalidatePath("/player/characters");
  revalidatePath("/player");
  revalidatePath("/gm/characters");
  return {
    message: characterId ? "Character record updated." : "Character record saved.",
  };
}

export async function deletePlayerCharacter(
  _previousState: CharacterFormState,
  formData: FormData,
): Promise<CharacterFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "player") {
    return { error: "Only a campaign player can delete their character sheets." };
  }

  const characterId = formData.get("character_id");
  if (typeof characterId !== "string" || !isUuid(characterId)) {
    return { error: "Choose a valid character sheet." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaign_characters")
    .delete()
    .eq("campaign_id", member.campaign_id)
    .eq("id", characterId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: `Unable to delete your character sheet: ${error.message}` };
  }
  if (!data) {
    return { error: "The character sheet was not found in your account." };
  }

  revalidatePath("/player/characters");
  revalidatePath("/player");
  revalidatePath("/gm/characters");
  return { message: "Character sheet deleted." };
}
