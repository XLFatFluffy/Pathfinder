import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import QuestForm from "./quest-form";

export const dynamic = "force-dynamic";

export default async function GmQuestsPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [
    { data: quests, error },
    { data: notes, error: notesError },
    { data: locations, error: locationsError },
  ] = await Promise.all([
    supabase
      .from("campaign_quests")
      .select("id, name, status, summary, giver, location_id, player_visible")
      .eq("campaign_id", member.campaign_id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("campaign_quest_gm_notes")
      .select("quest_id, notes")
      .eq("campaign_id", member.campaign_id),
    supabase
      .from("campaign_locations")
      .select("id, name")
      .eq("campaign_id", member.campaign_id)
      .order("name"),
  ]);

  if (error) {
    throw new Error(`Unable to load campaign quests: ${error.message}`);
  }
  if (notesError) {
    throw new Error(`Unable to load private quest notes: ${notesError.message}`);
  }
  if (locationsError) {
    throw new Error(`Unable to load quest locations: ${locationsError.message}`);
  }

  const notesByQuestId = new Map(
    notes.map((entry) => [entry.quest_id, entry.notes]),
  );
  const locationsById = new Map(
    locations.map((location) => [location.id, location.name]),
  );

  return (
    <>
      <p className="muted">
        Track story threads, their current status, quest givers, and linked
        locations. Only explicitly shared quests appear in the player workspace;
        private GM notes are kept separately.
      </p>
      <p className="muted">
        <Link href="/gm">Return to overview</Link>
      </p>
      <QuestForm locations={locations} />
      <section className="entry-list" aria-labelledby="quests-heading">
        <h3 id="quests-heading">Campaign quests</h3>
        {quests.length ? (
          quests.map((quest) => (
            <article className="entry-card" key={quest.id}>
              <p className="eyebrow">
                {quest.player_visible ? "Shared with players" : "GM-only"}
                {` · ${quest.status}`}
              </p>
              <h4>{quest.name}</h4>
              {quest.giver ? (
                <p className="muted">
                  <strong>Giver:</strong> {quest.giver}
                </p>
              ) : null}
              {quest.location_id && locationsById.has(quest.location_id) ? (
                <p className="muted">
                  <strong>Location:</strong> {locationsById.get(quest.location_id)}
                </p>
              ) : null}
              {quest.summary ? (
                <p className="entry-content">{quest.summary}</p>
              ) : null}
              {notesByQuestId.get(quest.id) ? (
                <p className="private-notes">
                  <strong>GM-only:</strong> {notesByQuestId.get(quest.id)}
                </p>
              ) : null}
              <details className="entry-edit">
                <summary>Edit or delete this quest</summary>
                <QuestForm
                  quest={{
                    ...quest,
                    gm_notes: notesByQuestId.get(quest.id) ?? "",
                  }}
                  locations={locations}
                />
              </details>
            </article>
          ))
        ) : (
          <p className="muted">No campaign quests yet.</p>
        )}
      </section>
    </>
  );
}
