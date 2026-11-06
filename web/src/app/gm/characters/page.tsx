import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";
import GmCharacterNotesForm from "./gm-notes-form";

export const dynamic = "force-dynamic";

export default async function GmCharactersPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [characters, privateNotes] = await Promise.all([
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_characters")
        .select("id, name, ancestry, class_name, level")
        .eq("campaign_id", member.campaign_id)
        .order("name")
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_character_gm_notes")
        .select("character_id, notes")
        .eq("campaign_id", member.campaign_id)
        .order("character_id")
        .range(from, to),
    ),
  ]);

  const notesByCharacterId = new Map(
    privateNotes.map((entry) => [entry.character_id, entry.notes]),
  );

  return (
    <>
      <p className="eyebrow">Campaign roster</p>
      <h2>Player characters</h2>
      <p className="muted">
        The editable PDF is each player&apos;s character sheet. Keep any GM-only
        reminders here; the old structured character records remain stored but
        are no longer shown or edited in this workspace.
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
              <details className="entry-edit">
                <summary>GM-only notes</summary>
                <GmCharacterNotesForm
                  characterId={character.id}
                  notes={notesByCharacterId.get(character.id) ?? ""}
                />
              </details>
            </article>
          ))
        ) : (
          <p className="notice">
            No players have added character records yet.
          </p>
        )}
      </section>
    </>
  );
}
