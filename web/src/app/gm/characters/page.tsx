import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import GmCharacterNotesForm from "./gm-notes-form";

export const dynamic = "force-dynamic";

export default async function GmCharactersPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [
    { data: characters, error },
    { data: privateNotes, error: notesError },
  ] = await Promise.all([
    supabase
      .from("campaign_characters")
      .select(
        "id, owner_user_id, name, ancestry, class_name, level, alignment, background, strength, dexterity, constitution, intelligence, wisdom, charisma, current_hp, max_hp, armor_class, speed, saving_throws, skills, attacks, features, equipment, spells, appearance",
      )
      .eq("campaign_id", member.campaign_id)
      .order("name"),
    supabase
      .from("campaign_character_gm_notes")
      .select("character_id, notes")
      .eq("campaign_id", member.campaign_id),
  ]);

  if (error) {
    throw new Error(`Unable to load campaign character sheets: ${error.message}`);
  }
  if (notesError) {
    throw new Error(`Unable to load private character notes: ${notesError.message}`);
  }

  const notesByCharacterId = new Map(
    privateNotes.map((entry) => [entry.character_id, entry.notes]),
  );

  return (
    <>
      <p className="eyebrow">Campaign roster</p>
      <h2>Player characters</h2>
      <p className="muted">
        Review player-owned character sheets and keep GM-only observations
        separately. Players manage their own sheets; only you can read GM notes.
      </p>
      <p className="muted">
        <Link href="/gm">Return to overview</Link>
      </p>
      <section className="entry-list" aria-labelledby="characters-heading">
        <h3 id="characters-heading">Campaign characters</h3>
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
              <details className="entry-edit">
                <summary>Review character details and GM notes</summary>
                {character.background ? (
                  <p className="entry-content">{character.background}</p>
                ) : null}
                <div className="form-grid" aria-label="Ability scores">
                  {[
                    ["STR", character.strength],
                    ["DEX", character.dexterity],
                    ["CON", character.constitution],
                    ["INT", character.intelligence],
                    ["WIS", character.wisdom],
                    ["CHA", character.charisma],
                  ].map(([label, score]) => (
                    <p className="muted" key={label}>
                      <strong>{label}:</strong> {score ?? "—"}
                    </p>
                  ))}
                </div>
                {character.speed ? (
                  <p className="muted">
                    <strong>Speed:</strong> {character.speed}
                  </p>
                ) : null}
                {character.saving_throws ? (
                  <p className="entry-content">
                    <strong>Saving throws:</strong> {character.saving_throws}
                  </p>
                ) : null}
                {character.skills ? (
                  <p className="entry-content">
                    <strong>Skills:</strong> {character.skills}
                  </p>
                ) : null}
                {character.attacks ? (
                  <p className="entry-content">
                    <strong>Attacks:</strong> {character.attacks}
                  </p>
                ) : null}
                {character.features ? (
                  <p className="entry-content">
                    <strong>Features:</strong> {character.features}
                  </p>
                ) : null}
                {character.equipment ? (
                  <p className="entry-content">
                    <strong>Equipment:</strong> {character.equipment}
                  </p>
                ) : null}
                {character.spells ? (
                  <p className="entry-content">
                    <strong>Spells:</strong> {character.spells}
                  </p>
                ) : null}
                {character.appearance ? (
                  <p className="entry-content">
                    <strong>Appearance:</strong> {character.appearance}
                  </p>
                ) : null}
                <GmCharacterNotesForm
                  characterId={character.id}
                  notes={notesByCharacterId.get(character.id) ?? ""}
                />
              </details>
            </article>
          ))
        ) : (
          <p className="notice">
            No players have created character sheets yet.
          </p>
        )}
      </section>
    </>
  );
}
