import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import CharacterForm from "./character-form";

export const dynamic = "force-dynamic";

export default async function PlayerCharactersPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: characters, error } = await supabase
    .from("campaign_characters")
    .select("id, name, ancestry, class_name, level")
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
        Open a character to edit and save its Pathfinder sheet in the campaign.
        Character records and GM-only notes remain private to you and the GM.
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
              <p>
                <Link
                  className="button-link"
                  href={`/player/characters/${character.id}`}
                >
                  Open editable PDF sheet
                </Link>
              </p>
              <details className="entry-edit">
                <summary>Edit character label or delete record</summary>
                <CharacterForm character={character} />
              </details>
            </article>
          ))
        ) : (
          <p className="notice">
            You do not have a character record yet. Add one above to give your
            editable PDF a name in the campaign.
          </p>
        )}
      </section>
    </>
  );
}
