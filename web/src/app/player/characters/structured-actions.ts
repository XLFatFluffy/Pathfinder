"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CharacterFormState } from "./actions";

type Section =
  | "identity"
  | "abilities"
  | "combat"
  | "saves"
  | "class"
  | "skill"
  | "attack"
  | "feature"
  | "equipment"
  | "spellcasting"
  | "spell"
  | "spell_slot"
  | "relationship"
  | "history";

const abilities = ["str", "dex", "con", "int", "wis", "cha"] as const;
const abilityNames = new Set(abilities);

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function text(
  formData: FormData,
  field: string,
  maximum: number,
  required = false,
): string | undefined {
  const value = formData.get(field);
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length <= maximum && (!required || trimmed.length > 0)
    ? trimmed
    : undefined;
}

function integer(
  formData: FormData,
  field: string,
  minimum: number,
  maximum: number,
  fallback?: number,
): number | undefined {
  const value = formData.get(field);
  if (value === null && fallback !== undefined) {
    return fallback;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const parsed = Number(value.trim());
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
}

function checkbox(formData: FormData, field: string): boolean {
  return formData.get(field) === "on";
}

function isAbility(value: string | undefined): value is (typeof abilities)[number] {
  return value !== undefined && abilityNames.has(value as (typeof abilities)[number]);
}

function invalid(): CharacterFormState {
  return { error: "Review the character fields and correct any invalid values." };
}

export async function saveStructuredCharacterSection(
  _previousState: CharacterFormState,
  formData: FormData,
): Promise<CharacterFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "player") {
    return { error: "Only a campaign player can manage their character sheets." };
  }

  const characterId = formData.get("character_id");
  const section = formData.get("section");
  if (
    typeof characterId !== "string" ||
    !isUuid(characterId) ||
    typeof section !== "string"
  ) {
    return invalid();
  }

  const supabase = await createSupabaseServerClient();
  let table: string;
  let record: Record<string, unknown> | Record<string, unknown>[];
  let classHistory:
    | { campaignDate: string; description: string }
    | undefined;
  let classDetails:
    | {
        className: string;
        classType: string;
        archetype: string;
        level: number;
        favoredClass: boolean;
        notes: string;
      }
    | undefined;

  switch (section as Section) {
    case "identity": {
      const fields = [
        ["age", 80],
        ["gender", 80],
        ["height", 80],
        ["weight", 80],
        ["eyes", 80],
        ["hair", 80],
        ["skin", 80],
        ["homeland", 2000],
        ["deity", 200],
        ["religion", 2000],
        ["languages", 4000],
        ["appearance", 4000],
        ["biography", 20000],
        ["personality", 10000],
        ["goals", 10000],
        ["bonds", 10000],
        ["fears", 10000],
        ["secrets", 20000],
      ] as const;
      const values = Object.fromEntries(
        fields.map(([field, maximum]) => [field, text(formData, field, maximum)]),
      );
      if (Object.values(values).some((value) => value === undefined)) {
        return invalid();
      }
      table = "campaign_character_identity";
      record = {
        campaign_id: member.campaign_id,
        character_id: characterId,
        ...values,
        source: "player",
        updated_at: new Date().toISOString(),
      };
      break;
    }
    case "abilities": {
      const rows = [];
      for (const ability of abilities) {
        const baseScore = integer(formData, `${ability}_score`, 1, 100);
        const permanent = integer(formData, `${ability}_permanent`, -100, 100);
        const temporary = integer(formData, `${ability}_temporary`, -100, 100);
        if (
          baseScore === undefined &&
          formData.get(`${ability}_score`) !== null &&
          formData.get(`${ability}_score`) !== ""
        ) {
          return invalid();
        }
        if (permanent === undefined || temporary === undefined) {
          return invalid();
        }
        rows.push({
          campaign_id: member.campaign_id,
          character_id: characterId,
          ability,
          base_score: baseScore ?? null,
          permanent_modifier: permanent,
          temporary_modifier: temporary,
          source: "player",
          updated_at: new Date().toISOString(),
        });
      }
      table = "campaign_character_ability_scores";
      record = rows;
      break;
    }
    case "combat": {
      const fields = [
        ["current_hp", -9999, 999999, 0],
        ["max_hp", 0, 999999, 0],
        ["temporary_hp", 0, 999999, 0],
        ["nonlethal_damage", 0, 999999, 0],
        ["armor_bonus", -100, 100, 0],
        ["shield_bonus", -100, 100, 0],
        ["natural_armor_bonus", -100, 100, 0],
        ["deflection_bonus", -100, 100, 0],
        ["dodge_bonus", -100, 100, 0],
        ["misc_ac_bonus", -100, 100, 0],
        ["armor_check_penalty", -100, 0, 0],
        ["base_attack_bonus", -100, 100, 0],
        ["initiative_misc", -100, 100, 0],
        ["cmb_misc", -100, 100, 0],
        ["cmd_misc", -100, 100, 0],
      ] as const;
      const values = Object.fromEntries(
        fields.map(([field, minimum, maximum, fallback]) => [
          field,
          integer(formData, field, minimum, maximum, fallback),
        ]),
      );
      const speed = text(formData, "speed", 120);
      if (
        Object.values(values).some((value) => value === undefined) ||
        speed === undefined
      ) {
        return invalid();
      }
      table = "campaign_character_combat";
      record = {
        campaign_id: member.campaign_id,
        character_id: characterId,
        ...values,
        speed,
        source: "player",
        updated_at: new Date().toISOString(),
      };
      break;
    }
    case "saves": {
      const rows = [];
      for (const saveType of ["fortitude", "reflex", "will"] as const) {
        const base = integer(formData, `${saveType}_base`, -100, 100);
        const resistance = integer(formData, `${saveType}_resistance`, -100, 100);
        const misc = integer(formData, `${saveType}_misc`, -100, 100);
        if (base === undefined || resistance === undefined || misc === undefined) {
          return invalid();
        }
        rows.push({
          campaign_id: member.campaign_id,
          character_id: characterId,
          save_type: saveType,
          base_bonus: base,
          resistance_bonus: resistance,
          misc_modifier: misc,
          updated_at: new Date().toISOString(),
        });
      }
      table = "campaign_character_saving_throws";
      record = rows;
      break;
    }
    case "class": {
      const className = text(formData, "class_name", 120, true);
      const classType = text(formData, "class_type", 20, true);
      const level = integer(formData, "class_level", 1, 20);
      const archetype = text(formData, "archetype", 160);
      const notes = text(formData, "class_notes", 5000);
      const campaignDate = text(formData, "class_campaign_date", 120);
      const historyDescription = text(
        formData,
        "class_history_description",
        4000,
      );
      if (
        !className ||
        (classType !== "base" &&
          classType !== "prestige" &&
          classType !== "racial") ||
        level === undefined ||
        archetype === undefined ||
        notes === undefined ||
        campaignDate === undefined ||
        historyDescription === undefined
      ) {
        return invalid();
      }
      table = "campaign_character_classes";
      record = {
        campaign_id: member.campaign_id,
        character_id: characterId,
        class_name: className,
        class_type: classType,
        level,
        archetype,
        notes,
        source: "player",
        updated_at: new Date().toISOString(),
      };
      classHistory = {
        campaignDate,
        description: historyDescription,
      };
      classDetails = {
        className,
        classType,
        archetype,
        level,
        favoredClass: checkbox(formData, "favored_class"),
        notes,
      };
      break;
    }
    case "skill": {
      const name = text(formData, "name", 120, true);
      const keyAbility = text(formData, "key_ability", 3);
      const ranks = integer(formData, "ranks", 0, 100);
      const misc = integer(formData, "misc_modifier", -100, 100);
      const notes = text(formData, "notes", 4000);
      if (
        !name ||
        !isAbility(keyAbility) ||
        ranks === undefined ||
        misc === undefined ||
        notes === undefined
      ) {
        return invalid();
      }
      table = "campaign_character_skills";
      record = {
        campaign_id: member.campaign_id,
        character_id: characterId,
        name,
        key_ability: keyAbility,
        ranks,
        class_skill: checkbox(formData, "class_skill"),
        armor_check_penalty: checkbox(formData, "armor_check_penalty"),
        misc_modifier: misc,
        notes,
      };
      break;
    }
    case "attack": {
      const name = text(formData, "name", 160, true);
      const type = text(formData, "attack_type", 80);
      const keyAbility = text(formData, "key_ability", 3);
      const damageAbility = text(formData, "damage_ability", 4);
      const attackBonus = integer(formData, "attack_bonus", -100, 100);
      const damageBonus = integer(formData, "damage_bonus", -100, 100);
      const enhancement = integer(formData, "enhancement", -100, 100);
      const damage = text(formData, "damage", 500);
      if (
        !name ||
        type === undefined ||
        !isAbility(keyAbility) ||
        !(isAbility(damageAbility) || damageAbility === "none") ||
        attackBonus === undefined ||
        damageBonus === undefined ||
        enhancement === undefined ||
        damage === undefined
      ) {
        return invalid();
      }
      table = "campaign_character_attacks";
      record = {
        campaign_id: member.campaign_id,
        character_id: characterId,
        name,
        attack_type: type,
        key_ability: keyAbility,
        damage_ability: damageAbility,
        attack_bonus: attackBonus,
        damage_bonus: damageBonus,
        enhancement,
        damage,
      };
      break;
    }
    case "feature": {
      const name = text(formData, "name", 160, true);
      const featureType = text(formData, "feature_type", 30);
      const description = text(formData, "description", 10000);
      if (
        !name ||
        !["feat", "class_feature", "special_ability", "custom"].includes(
          featureType ?? "",
        ) ||
        description === undefined
      ) {
        return invalid();
      }
      table = "campaign_character_features";
      record = {
        campaign_id: member.campaign_id,
        character_id: characterId,
        name,
        feature_type: featureType,
        description,
      };
      break;
    }
    case "equipment": {
      const name = text(formData, "name", 160, true);
      const itemType = text(formData, "item_type", 30);
      const quantity = integer(formData, "quantity", 0, 999999);
      const weightValue = formData.get("weight");
      const valueValue = formData.get("value_gp");
      const weight = typeof weightValue === "string" ? Number(weightValue) : NaN;
      const value = typeof valueValue === "string" ? Number(valueValue) : NaN;
      const notes = text(formData, "notes", 5000);
      if (
        !name ||
        !["general", "weapon", "armor", "shield", "magic_item"].includes(
          itemType ?? "",
        ) ||
        quantity === undefined ||
        !Number.isFinite(weight) ||
        weight < 0 ||
        !Number.isFinite(value) ||
        value < 0 ||
        notes === undefined
      ) {
        return invalid();
      }
      table = "campaign_character_equipment";
      record = {
        campaign_id: member.campaign_id,
        character_id: characterId,
        name,
        item_type: itemType,
        quantity,
        weight,
        value_gp: value,
        equipped: checkbox(formData, "equipped"),
        magical: checkbox(formData, "magical"),
        notes,
      };
      break;
    }
    case "spellcasting": {
      const className = text(formData, "class_name", 120, true);
      const casterLevel = integer(formData, "caster_level", 1, 40);
      const castingAbility = text(formData, "casting_ability", 3);
      const dcMisc = integer(formData, "spell_dc_misc", -100, 100);
      const castingModel = text(formData, "casting_model", 20);
      if (
        !className ||
        casterLevel === undefined ||
        !isAbility(castingAbility) ||
        dcMisc === undefined ||
        !["prepared", "spontaneous", "other"].includes(castingModel ?? "")
      ) {
        return invalid();
      }
      table = "campaign_character_spellcasting";
      record = {
        campaign_id: member.campaign_id,
        character_id: characterId,
        class_name: className,
        caster_level: casterLevel,
        casting_ability: castingAbility,
        spell_dc_misc: dcMisc,
        casting_model: castingModel,
      };
      break;
    }
    case "spell": {
      const spellcastingId = formData.get("spellcasting_id");
      const name = text(formData, "name", 160, true);
      const spellLevel = integer(formData, "spell_level", 0, 9);
      const school = text(formData, "school", 120);
      const description = text(formData, "description", 10000);
      if (
        typeof spellcastingId !== "string" ||
        !isUuid(spellcastingId) ||
        !name ||
        spellLevel === undefined ||
        school === undefined ||
        description === undefined
      ) {
        return invalid();
      }
      table = "campaign_character_spells";
      record = {
        campaign_id: member.campaign_id,
        character_id: characterId,
        spellcasting_id: spellcastingId,
        name,
        spell_level: spellLevel,
        school,
        description,
        prepared: checkbox(formData, "prepared"),
        known: checkbox(formData, "known"),
      };
      break;
    }
    case "spell_slot": {
      const spellcastingId = formData.get("spellcasting_id");
      const spellLevel = integer(formData, "spell_level", 0, 9);
      const totalSlots = integer(formData, "total_slots", 0, 100);
      const usedSlots = integer(formData, "used_slots", 0, 100);
      const notes = text(formData, "notes", 2000);
      if (
        typeof spellcastingId !== "string" ||
        !isUuid(spellcastingId) ||
        spellLevel === undefined ||
        totalSlots === undefined ||
        usedSlots === undefined ||
        usedSlots > totalSlots ||
        notes === undefined
      ) {
        return invalid();
      }
      table = "campaign_character_spell_slots";
      record = {
        campaign_id: member.campaign_id,
        character_id: characterId,
        spellcasting_id: spellcastingId,
        spell_level: spellLevel,
        total_slots: totalSlots,
        used_slots: usedSlots,
        notes,
      };
      break;
    }
    case "relationship": {
      const entityValue = formData.get("entity_id");
      const relationshipType = text(formData, "relationship_type", 120, true);
      const notes = text(formData, "notes", 10000);
      const entityColumns: Record<string, string> = {
        npc: "npc_id",
        faction: "faction_id",
        house: "house_id",
        location: "location_id",
        quest: "quest_id",
      };
      const [entityType, entityId] =
        typeof entityValue === "string" ? entityValue.split(":") : [];
      if (
        !entityType ||
        !Object.hasOwn(entityColumns, entityType) ||
        !entityId ||
        !isUuid(entityId) ||
        !relationshipType ||
        notes === undefined
      ) {
        return invalid();
      }
      table = "campaign_character_relationships";
      record = {
        campaign_id: member.campaign_id,
        character_id: characterId,
        entity_type: entityType,
        relationship_type: relationshipType,
        npc_id: null,
        faction_id: null,
        house_id: null,
        location_id: null,
        quest_id: null,
        [entityColumns[entityType]]: entityId,
        notes,
      };
      break;
    }
    case "history": {
      const eventType = text(formData, "event_type", 80, true);
      const title = text(formData, "title", 200, true);
      const description = text(formData, "description", 10000);
      const campaignDate = text(formData, "campaign_date", 120);
      if (!eventType || !title || description === undefined || campaignDate === undefined) {
        return invalid();
      }
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        return { error: `Unable to verify your account: ${userError.message}` };
      }
      table = "campaign_character_history";
      record = {
        campaign_id: member.campaign_id,
        character_id: characterId,
        event_type: eventType,
        title,
        description,
        campaign_date: campaignDate,
        player_visible: true,
        created_by: user?.id ?? null,
      };
      break;
    }
    default:
      return invalid();
  }

  if (section === "class") {
    if (!classDetails) {
      return invalid();
    }
    const { error } = await supabase.rpc("save_campaign_character_class", {
      target_campaign_id: member.campaign_id,
      target_character_id: characterId,
      target_class_name: classDetails.className,
      target_class_type: classDetails.classType,
      target_archetype: classDetails.archetype,
      target_level: classDetails.level,
      target_favored_class: classDetails.favoredClass,
      target_notes: classDetails.notes,
      target_campaign_date: classHistory?.campaignDate ?? "",
      target_history_description:
        classHistory?.description ||
        `Advanced to level ${classDetails.level} in ${classDetails.className}.`,
    });
    if (error) {
      return { error: `Unable to save the class history: ${error.message}` };
    }
    revalidatePath(`/player/characters/${characterId}`);
    revalidatePath("/player/characters");
    revalidatePath("/gm/characters");
    return { message: "Character class and level history saved." };
  }

  const { error } = await supabase.from(table).upsert(record);
  if (error) {
    return { error: `Unable to save the character details: ${error.message}` };
  }

  revalidatePath(`/player/characters/${characterId}`);
  revalidatePath("/player/characters");
  revalidatePath("/gm/characters");
  return { message: "Character details saved." };
}

export async function deleteStructuredCharacterRecord(
  _previousState: CharacterFormState,
  formData: FormData,
): Promise<CharacterFormState> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "player") {
    return { error: "Only a campaign player can manage their character sheets." };
  }

  const characterId = formData.get("character_id");
  const recordId = formData.get("record_id");
  const section = formData.get("section");
  const tables: Partial<Record<Section, string>> = {
    skill: "campaign_character_skills",
    attack: "campaign_character_attacks",
    feature: "campaign_character_features",
    equipment: "campaign_character_equipment",
    spellcasting: "campaign_character_spellcasting",
    spell: "campaign_character_spells",
    relationship: "campaign_character_relationships",
  };
  if (
    typeof characterId !== "string" ||
    !isUuid(characterId) ||
    typeof recordId !== "string" ||
    !isUuid(recordId) ||
    typeof section !== "string" ||
    !Object.hasOwn(tables, section)
  ) {
    return invalid();
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from(tables[section as Section]!)
    .delete()
    .eq("campaign_id", member.campaign_id)
    .eq("character_id", characterId)
    .eq("id", recordId);
  if (error) {
    return { error: `Unable to remove the character detail: ${error.message}` };
  }

  revalidatePath(`/player/characters/${characterId}`);
  revalidatePath("/player/characters");
  revalidatePath("/gm/characters");
  return { message: "Character detail removed." };
}
