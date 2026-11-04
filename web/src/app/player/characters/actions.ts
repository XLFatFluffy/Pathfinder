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

function parseOptionalInteger(
  value: FormDataEntryValue | null,
  minimum: number,
  maximum: number,
): number | null | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
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
  const currentHpValue = formData.get("current_hp");
  const maxHpValue = formData.get("max_hp");
  const armorClassValue = formData.get("armor_class");
  const textFields = [
    "name",
    "ancestry",
    "class_name",
    "alignment",
    "background",
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
    "speed",
    "saving_throws",
    "skills",
    "attacks",
    "features",
    "equipment",
    "spells",
    "appearance",
  ] as const;
  const values = Object.fromEntries(
    textFields.map((field) => [field, formData.get(field)]),
  ) as Record<(typeof textFields)[number], FormDataEntryValue | null>;

  if (
    (characterIdValue !== null && typeof characterIdValue !== "string") ||
    typeof levelValue !== "string" ||
    typeof currentHpValue !== "string" ||
    typeof maxHpValue !== "string" ||
    typeof armorClassValue !== "string" ||
    textFields.some((field) => typeof values[field] !== "string")
  ) {
    return { error: "The character sheet contained invalid fields." };
  }

  const characterId = characterIdValue?.trim() ?? "";
  const name = (values.name as string).trim();
  const ancestry = (values.ancestry as string).trim();
  const className = (values.class_name as string).trim();
  const alignment = (values.alignment as string).trim();
  const background = (values.background as string).trim();
  const speed = (values.speed as string).trim();
  const savingThrows = (values.saving_throws as string).trim();
  const skills = (values.skills as string).trim();
  const attacks = (values.attacks as string).trim();
  const features = (values.features as string).trim();
  const equipment = (values.equipment as string).trim();
  const spells = (values.spells as string).trim();
  const appearance = (values.appearance as string).trim();
  const level = Number(levelValue);
  const currentHp = Number(currentHpValue);
  const maxHp = Number(maxHpValue);
  const armorClass = Number(armorClassValue);
  const abilityScores = {
    strength: parseOptionalInteger(values.strength, 1, 100),
    dexterity: parseOptionalInteger(values.dexterity, 1, 100),
    constitution: parseOptionalInteger(values.constitution, 1, 100),
    intelligence: parseOptionalInteger(values.intelligence, 1, 100),
    wisdom: parseOptionalInteger(values.wisdom, 1, 100),
    charisma: parseOptionalInteger(values.charisma, 1, 100),
  };

  if (characterId && !isUuid(characterId)) {
    return { error: "Choose a valid character sheet." };
  }
  if (!name || name.length > 160) {
    return { error: "Enter a character name of 1 to 160 characters." };
  }
  if (!Number.isSafeInteger(level) || level < 1 || level > 20) {
    return { error: "Character level must be a whole number from 1 to 20." };
  }
  if (
    !Number.isSafeInteger(currentHp) ||
    currentHp < -9999 ||
    currentHp > 999999 ||
    !Number.isSafeInteger(maxHp) ||
    maxHp < 0 ||
    maxHp > 999999 ||
    !Number.isSafeInteger(armorClass) ||
    armorClass < -100 ||
    armorClass > 999 ||
    Object.values(abilityScores).some((score) => score === undefined)
  ) {
    return { error: "Enter valid hit points, armor class, and ability scores." };
  }

  const limits = [
    [ancestry, 120],
    [className, 120],
    [alignment, 40],
    [background, 10000],
    [speed, 120],
    [savingThrows, 4000],
    [skills, 10000],
    [attacks, 10000],
    [features, 12000],
    [equipment, 20000],
    [spells, 20000],
    [appearance, 4000],
  ] as const;
  if (limits.some(([value, maximum]) => value.length > maximum)) {
    return { error: "One or more character fields exceed their allowed length." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_campaign_character", {
    target_campaign_id: member.campaign_id,
    target_character_id: characterId || null,
    target_name: name,
    target_ancestry: ancestry,
    target_class_name: className,
    target_level: level,
    target_alignment: alignment,
    target_background: background,
    target_strength: abilityScores.strength,
    target_dexterity: abilityScores.dexterity,
    target_constitution: abilityScores.constitution,
    target_intelligence: abilityScores.intelligence,
    target_wisdom: abilityScores.wisdom,
    target_charisma: abilityScores.charisma,
    target_current_hp: currentHp,
    target_max_hp: maxHp,
    target_armor_class: armorClass,
    target_speed: speed,
    target_saving_throws: savingThrows,
    target_skills: skills,
    target_attacks: attacks,
    target_features: features,
    target_equipment: equipment,
    target_spells: spells,
    target_appearance: appearance,
  });

  if (error) {
    return { error: `Unable to save the character sheet: ${error.message}` };
  }

  revalidatePath("/player/characters");
  revalidatePath("/player");
  revalidatePath("/gm/characters");
  return {
    message: characterId ? "Character sheet updated." : "Character sheet saved.",
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
