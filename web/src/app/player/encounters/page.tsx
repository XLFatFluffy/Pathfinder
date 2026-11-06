import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { getCampaignMapArtwork } from "@/lib/campaign-map-artwork";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";

export const dynamic = "force-dynamic";

export default async function PlayerEncountersPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [encounters, npcLinks, locations, quests, sessions, maps, npcs] =
    await Promise.all([
      getAllSupabaseRowsOrThrow((from, to) =>
        supabase
          .from("campaign_encounters")
          .select(
            "id, name, description, campaign_date, location_id, quest_id, session_id, map_id, difficulty, status, outcome, aftermath",
          )
          .eq("campaign_id", member.campaign_id)
          .eq("player_visible", true)
          .order("campaign_date")
          .order("name")
          .range(from, to),
      ),
      getAllSupabaseRowsOrThrow((from, to) =>
        supabase
          .from("campaign_encounter_npcs")
          .select("encounter_id, npc_id")
          .eq("campaign_id", member.campaign_id)
          .order("encounter_id")
          .range(from, to),
      ),
      getAllSupabaseRowsOrThrow((from, to) =>
        supabase
          .from("campaign_locations")
          .select("id, name")
          .eq("campaign_id", member.campaign_id)
          .order("name")
          .order("id")
          .range(from, to),
      ),
      getAllSupabaseRowsOrThrow((from, to) =>
        supabase
          .from("campaign_quests")
          .select("id, name")
          .eq("campaign_id", member.campaign_id)
          .order("name")
          .order("id")
          .range(from, to),
      ),
      getAllSupabaseRowsOrThrow((from, to) =>
        supabase
          .from("campaign_sessions")
          .select("id, session_number")
          .eq("campaign_id", member.campaign_id)
          .order("session_number", { ascending: false })
          .range(from, to),
      ),
      getAllSupabaseRowsOrThrow((from, to) =>
        supabase
          .from("campaign_maps")
          .select("id, name, artwork_path")
          .eq("campaign_id", member.campaign_id)
          .order("name")
          .order("id")
          .range(from, to),
      ),
      getAllSupabaseRowsOrThrow((from, to) =>
        supabase
          .from("campaign_npcs")
          .select("id, name")
          .eq("campaign_id", member.campaign_id)
          .order("name")
          .order("id")
          .range(from, to),
      ),
    ]);

  const mapsWithArtwork = await Promise.all(
    maps.map(async (map) => ({
      ...map,
      ...(await getCampaignMapArtwork(supabase, map.artwork_path)),
    })),
  );
  const locationsById = new Map(locations.map((item) => [item.id, item.name]));
  const questsById = new Map(quests.map((item) => [item.id, item.name]));
  const sessionsById = new Map(
    sessions.map((item) => [item.id, `Session ${item.session_number}`]),
  );
  const mapsById = new Map(mapsWithArtwork.map((item) => [item.id, item]));
  const npcsById = new Map(npcs.map((item) => [item.id, item.name]));
  const npcsByEncounter = new Map<string, string[]>();
  for (const link of npcLinks) {
    const linked = npcsByEncounter.get(link.encounter_id) ?? [];
    linked.push(link.npc_id);
    npcsByEncounter.set(link.encounter_id, linked);
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Shared campaign records</p>
          <h2>Encounters</h2>
        </div>
        <Link href="/player">Return to campaign</Link>
      </div>
      <p className="muted">
        Encounters and linked details appear here only when shared by the GM.
      </p>
      <section className="entry-list" aria-label="Shared encounters">
        {encounters.length ? (
          encounters.map((encounter) => {
            const map = encounter.map_id ? mapsById.get(encounter.map_id) : null;
            const linkedNpcNames = (npcsByEncounter.get(encounter.id) ?? [])
              .map((id) => npcsById.get(id))
              .filter((name): name is string => Boolean(name));
            const relatedNames = [
              encounter.location_id
                ? locationsById.get(encounter.location_id)
                : null,
              encounter.quest_id ? questsById.get(encounter.quest_id) : null,
              encounter.session_id
                ? sessionsById.get(encounter.session_id)
                : null,
            ].filter((name): name is string => Boolean(name));

            return (
              <article className="entry-card" key={encounter.id}>
                <p className="eyebrow">
                  {encounter.status}
                  {encounter.campaign_date
                    ? ` · ${encounter.campaign_date}`
                    : ""}
                </p>
                <h3>{encounter.name}</h3>
                {encounter.difficulty ? (
                  <p>
                    <strong>Difficulty:</strong> {encounter.difficulty}
                  </p>
                ) : null}
                {relatedNames.length ? (
                  <p className="muted">{relatedNames.join(" · ")}</p>
                ) : null}
                {linkedNpcNames.length ? (
                  <p className="muted">
                    <strong>Involved NPCs:</strong> {linkedNpcNames.join(", ")}
                  </p>
                ) : null}
                {encounter.description ? (
                  <p className="entry-content">{encounter.description}</p>
                ) : null}
                {encounter.outcome ? (
                  <p className="entry-content">
                    <strong>Outcome:</strong> {encounter.outcome}
                  </p>
                ) : null}
                {encounter.aftermath ? (
                  <p className="entry-content">
                    <strong>Aftermath:</strong> {encounter.aftermath}
                  </p>
                ) : null}
                {map?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`Shared map for ${encounter.name}: ${map.name}`}
                    className="map-preview"
                    src={map.url}
                  />
                ) : map?.error ? (
                  <p className="error" role="status">
                    Unable to load the shared map: {map.error}
                  </p>
                ) : map ? (
                  <p className="muted">Map: {map.name}</p>
                ) : null}
              </article>
            );
          })
        ) : (
          <p className="muted">No encounters have been shared yet.</p>
        )}
      </section>
    </>
  );
}
