import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CharacterWorkspace, { type CharacterWorkspaceData } from "./workspace";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown> & { id?: string };
type Character = {
  id: string;
  name: string;
  ancestry: string;
  class_name: string;
  level: number;
};

function readRows(
  result: { data: Row[] | null; error: { message: string } | null },
  label: string,
): Row[] {
  if (result.error) {
    throw new Error(`Unable to load ${label}: ${result.error.message}`);
  }
  return result.data ?? [];
}

function readRow(
  result: { data: Row | null; error: { message: string } | null },
  label: string,
): Row | null {
  if (result.error) {
    throw new Error(`Unable to load ${label}: ${result.error.message}`);
  }
  return result.data;
}

export default async function CharacterWorkspacePage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "player") {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: character, error: characterError } = await supabase
    .from("campaign_characters")
    .select("id, name, ancestry, class_name, level")
    .eq("campaign_id", member.campaign_id)
    .eq("id", characterId)
    .maybeSingle();

  if (characterError) {
    throw new Error(`Unable to load the character sheet: ${characterError.message}`);
  }
  if (!character) {
    notFound();
  }

  const [
    identityResult,
    abilityResult,
    combatResult,
    saveResult,
    classResult,
    levelHistoryResult,
    skillResult,
    attackResult,
    featureResult,
    equipmentResult,
    spellcastingResult,
    spellResult,
    slotResult,
    relationshipResult,
    historyResult,
    npcResult,
    factionResult,
    houseResult,
    locationResult,
    questResult,
  ] = await Promise.all([
    supabase
      .from("campaign_character_identity")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId)
      .maybeSingle(),
    supabase
      .from("campaign_character_ability_scores")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId),
    supabase
      .from("campaign_character_combat")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId)
      .maybeSingle(),
    supabase
      .from("campaign_character_saving_throws")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId),
    supabase
      .from("campaign_character_classes")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId)
      .order("class_name"),
    supabase
      .from("campaign_character_level_history")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId)
      .order("created_at"),
    supabase
      .from("campaign_character_skills")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId)
      .order("sort_order")
      .order("name"),
    supabase
      .from("campaign_character_attacks")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId)
      .order("sort_order")
      .order("name"),
    supabase
      .from("campaign_character_features")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId)
      .order("sort_order")
      .order("name"),
    supabase
      .from("campaign_character_equipment")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId)
      .order("sort_order")
      .order("name"),
    supabase
      .from("campaign_character_spellcasting")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId)
      .order("class_name"),
    supabase
      .from("campaign_character_spells")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId)
      .order("spell_level")
      .order("name"),
    supabase
      .from("campaign_character_spell_slots")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId)
      .order("spell_level"),
    supabase
      .from("campaign_character_relationships")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaign_character_history")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaign_npcs")
      .select("id, name")
      .eq("campaign_id", member.campaign_id)
      .eq("player_visible", true)
      .order("name"),
    supabase
      .from("campaign_factions")
      .select("id, name")
      .eq("campaign_id", member.campaign_id)
      .eq("player_visible", true)
      .order("name"),
    supabase
      .from("campaign_houses")
      .select("id, name")
      .eq("campaign_id", member.campaign_id)
      .eq("player_visible", true)
      .order("name"),
    supabase
      .from("campaign_locations")
      .select("id, name")
      .eq("campaign_id", member.campaign_id)
      .eq("player_visible", true)
      .order("name"),
    supabase
      .from("campaign_quests")
      .select("id, name")
      .eq("campaign_id", member.campaign_id)
      .eq("player_visible", true)
      .order("name"),
  ]);

  const data: CharacterWorkspaceData = {
    identity: readRow(identityResult, "character identity"),
    abilities: readRows(abilityResult, "character ability scores"),
    combat: readRow(combatResult, "character combat statistics"),
    saves: readRows(saveResult, "character saving throws"),
    classes: readRows(classResult, "character classes"),
    levelHistory: readRows(levelHistoryResult, "class level history"),
    skills: readRows(skillResult, "character skills"),
    attacks: readRows(attackResult, "character attacks"),
    features: readRows(featureResult, "character features"),
    equipment: readRows(equipmentResult, "character equipment"),
    spellcasting: readRows(spellcastingResult, "spellcasting"),
    spells: readRows(spellResult, "spells"),
    slots: readRows(slotResult, "spell slots"),
    relationships: readRows(relationshipResult, "character relationships"),
    history: readRows(historyResult, "character history"),
    relatedEntities: {
      npc: readRows(npcResult, "visible NPCs"),
      faction: readRows(factionResult, "visible factions"),
      house: readRows(houseResult, "visible houses"),
      location: readRows(locationResult, "visible locations"),
      quest: readRows(questResult, "visible quests"),
    },
  };

  return (
    <>
      <p className="eyebrow">Character sheet</p>
      <h2>{(character as Character).name}</h2>
      <p className="muted">
        Structured Pathfinder 1e data and calculated totals. Your GM can review
        this sheet; other players cannot.
      </p>
      <p className="muted">
        <Link href="/player/characters">Return to your characters</Link>
      </p>
      <CharacterWorkspace
        character={character as Character}
        data={data}
        characterId={characterId}
      />
    </>
  );
}
