import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CharacterWorkspaceData,
  WorkspaceRow,
} from "@/app/player/characters/[characterId]/workspace";
import GmCharacterNotesForm from "../gm-notes-form";
import GmCharacterWorkspace from "./gm-character-workspace";

export const dynamic = "force-dynamic";

type Character = {
  id: string;
  name: string;
  ancestry: string;
  class_name: string;
  level: number;
};

function readRows(
  result: { data: WorkspaceRow[] | null; error: { message: string } | null },
  label: string,
): WorkspaceRow[] {
  if (result.error) {
    throw new Error(`Unable to load ${label}: ${result.error.message}`);
  }
  return result.data ?? [];
}

function readRow(
  result: { data: WorkspaceRow | null; error: { message: string } | null },
  label: string,
): WorkspaceRow | null {
  if (result.error) {
    throw new Error(`Unable to load ${label}: ${result.error.message}`);
  }
  return result.data;
}

export default async function GmCharacterPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const [
    { data: character, error: characterError },
    notesResult,
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
  ] = await Promise.all([
    supabase
      .from("campaign_characters")
      .select("id, name, ancestry, class_name, level")
      .eq("campaign_id", member.campaign_id)
      .eq("id", characterId)
      .maybeSingle(),
    supabase
      .from("campaign_character_gm_notes")
      .select("notes")
      .eq("campaign_id", member.campaign_id)
      .eq("character_id", characterId)
      .maybeSingle(),
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
  ]);

  if (characterError) {
    throw new Error(`Unable to load the campaign character: ${characterError.message}`);
  }
  if (!character) {
    notFound();
  }
  if (notesResult.error) {
    throw new Error(`Unable to load private character notes: ${notesResult.error.message}`);
  }

  const data: CharacterWorkspaceData = {
    identity: readRow(identityResult, "character identity"),
    abilities: readRows(abilityResult, "ability scores"),
    combat: readRow(combatResult, "combat statistics"),
    saves: readRows(saveResult, "saving throws"),
    classes: readRows(classResult, "classes"),
    levelHistory: readRows(levelHistoryResult, "class level history"),
    skills: readRows(skillResult, "skills"),
    attacks: readRows(attackResult, "attacks"),
    features: readRows(featureResult, "features"),
    equipment: readRows(equipmentResult, "equipment"),
    spellcasting: readRows(spellcastingResult, "spellcasting"),
    spells: readRows(spellResult, "spells"),
    slots: readRows(slotResult, "spell slots"),
    relationships: readRows(relationshipResult, "relationships"),
    history: readRows(historyResult, "character history"),
    relatedEntities: {
      npc: [],
      faction: [],
      house: [],
      location: [],
      quest: [],
    },
  };
  const campaignCharacter = character as Character;

  return (
    <>
      <p className="eyebrow">GM campaign roster</p>
      <h2>{campaignCharacter.name}</h2>
      <p className="muted">
        Review the structured sheet and calculated Pathfinder totals. Private GM
        observations are stored separately from the player-owned record.
      </p>
      <p className="muted">
        <Link href="/gm/characters">Return to campaign roster</Link>
      </p>
      <GmCharacterWorkspace character={campaignCharacter} data={data} />
      <section className="entry-list" aria-labelledby="gm-notes-heading">
        <h3 id="gm-notes-heading">GM-only notes</h3>
        <GmCharacterNotesForm
          characterId={campaignCharacter.id}
          notes={notesResult.data?.notes ?? ""}
        />
      </section>
    </>
  );
}
