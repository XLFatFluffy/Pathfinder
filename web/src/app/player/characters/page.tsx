import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import CharacterForm from "./character-form";
import { formatAbilityModifier } from "./ability-scores";

export const dynamic = "force-dynamic";

export default async function PlayerCharactersPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: characters, error } = await supabase
    .from("campaign_characters")
    .select(
      "id, name, ancestry, class_name, level, alignment, background, strength, dexterity, constitution, intelligence, wisdom, charisma, current_hp, max_hp, armor_class, speed, saving_throws, skills, attacks, features, equipment, spells, appearance",
    )
    .eq("campaign_id", member.campaign_id)
    .order("name");

  if (error) {
    throw new Error(`Unable to load your character sheets: ${error.message}`);
  }

  return (
    <>
      <p className="eyebrow">Your player space</p>
      <h2>My characters</h2>
      <p className="muted">
        Your character sheets are visible only to you and the campaign GM.
        Other players cannot read or change them. GM notes are kept in a
        separate private record.
      </p>
      <p>
        <a
          className="button-link"
          href="/pathfinder-character-sheet.pdf"
          rel="noreferrer"
          target="_blank"
        >
          Open the original editable PDF sheet
        </a>
      </p>
      <p className="muted">
        <Link href="/player">Return to your campaign</Link>
      </p>
      <section className="entry-list" aria-labelledby="create-character-heading">
        <h3 id="create-character-heading">Create a character</h3>
        <CharacterForm />
      </section>
      <section className="entry-list" aria-labelledby="characters-heading">
        <h3 id="characters-heading">Your character sheets</h3>
        {characters.length ? (
          characters.map((character) => (
            <article className="entry-card" key={character.id}>
              <p className="eyebrow">
                {[character.ancestry, character.class_name, `Level ${character.level}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <h4>{character.name}</h4>
              <p className="muted">
                HP {character.current_hp}/{character.max_hp}
                {` · AC ${character.armor_class}`}
                {character.alignment ? ` · ${character.alignment}` : ""}
              </p>
              <p className="muted">
                STR {character.strength ?? "—"} (
                {formatAbilityModifier(character.strength)}) · DEX{" "}
                {character.dexterity ?? "—"} (
                {formatAbilityModifier(character.dexterity)}) · CON{" "}
                {character.constitution ?? "—"} (
                {formatAbilityModifier(character.constitution)}) · INT{" "}
                {character.intelligence ?? "—"} (
                {formatAbilityModifier(character.intelligence)}) · WIS{" "}
                {character.wisdom ?? "—"} (
                {formatAbilityModifier(character.wisdom)}) · CHA{" "}
                {character.charisma ?? "—"} (
                {formatAbilityModifier(character.charisma)})
              </p>
              <p>
                <Link
                  className="button-link"
                  href={`/player/characters/${character.id}`}
                >
                  Open structured Pathfinder sheet
                </Link>
              </p>
              <details className="entry-edit">
                <summary>View or edit character sheet</summary>
                <CharacterForm character={character} />
              </details>
            </article>
          ))
        ) : (
          <p className="notice">
            You do not have a character sheet yet. Create one above to keep
            your game details together.
          </p>
        )}
      </section>
    </>
  );
}
