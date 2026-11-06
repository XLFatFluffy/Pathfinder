import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { getCampaignMapArtwork } from "@/lib/campaign-map-artwork";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";
import EncounterForm, { type EncounterFormValue } from "./encounter-form";

export const dynamic = "force-dynamic";

export default async function GmEncountersPage() {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [encounters, notes, npcLinks, locations, quests, sessions, maps, npcs] =
    await Promise.all([
      getAllSupabaseRowsOrThrow((from, to) =>
        supabase
          .from("campaign_encounters")
          .select(
            "id, name, description, campaign_date, location_id, quest_id, session_id, map_id, difficulty, status, outcome, aftermath, player_visible, updated_at",
          )
          .eq("campaign_id", member.campaign_id)
          .order("updated_at", { ascending: false })
          .order("id")
          .range(from, to),
      ),
      getAllSupabaseRowsOrThrow((from, to) =>
        supabase
          .from("campaign_encounter_gm_notes")
          .select("encounter_id, notes")
          .eq("campaign_id", member.campaign_id)
          .order("encounter_id")
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
  const notesByEncounter = new Map(
    notes.map((item) => [item.encounter_id, item.notes]),
  );
  const npcsByEncounter = new Map<string, string[]>();
  for (const link of npcLinks) {
    const linked = npcsByEncounter.get(link.encounter_id) ?? [];
    linked.push(link.npc_id);
    npcsByEncounter.set(link.encounter_id, linked);
  }

  const formOptions = {
    locations: locations.map(({ id, name }) => ({ id, name })),
    quests: quests.map(({ id, name }) => ({ id, name })),
    sessions: sessions.map(({ id, session_number }) => ({
      id,
      name: `Session ${session_number}`,
    })),
    maps: maps.map(({ id, name }) => ({ id, name })),
    npcs: npcs.map(({ id, name }) => ({ id, name, selected: false })),
  };

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Encounter planning</p>
          <h2>Encounters</h2>
        </div>
        <Link href="/gm">Return to overview</Link>
      </div>
      <p className="muted">
        Plan scenes and track their campaign date, threat, location, related
        quest and session, involved NPCs, outcome, and aftermath. Private
        preparation notes are stored separately from player-facing details.
      </p>
      <EncounterForm {...formOptions} />
      <section className="entry-list" aria-labelledby="encounters-heading">
        <h3 id="encounters-heading">Encounter records</h3>
        {encounters.length ? (
          encounters.map((encounter) => {
            const map = encounter.map_id ? mapsById.get(encounter.map_id) : null;
            const linkedNpcIds = npcsByEncounter.get(encounter.id) ?? [];
            const encounterValue: EncounterFormValue = {
              ...encounter,
              gm_notes: notesByEncounter.get(encounter.id) ?? "",
              npc_ids: linkedNpcIds,
            };
            const linkedNpcNames = linkedNpcIds
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
              <details className="entry-card entry-edit" key={encounter.id}>
                <summary>
                  <span className="eyebrow">
                    {encounter.status}
                    {encounter.player_visible ? " · Shared with players" : " · GM-only"}
                    {encounter.campaign_date
                      ? ` · ${encounter.campaign_date}`
                      : ""}
                  </span>
                  <strong>{encounter.name}</strong>
                </summary>
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
                    <strong>NPCs:</strong> {linkedNpcNames.join(", ")}
                  </p>
                ) : null}
                <p className="entry-content">
                  {encounter.description || "No player-facing description."}
                </p>
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
                    alt={`Map for ${encounter.name}: ${map.name}`}
                    className="map-preview"
                    src={map.url}
                  />
                ) : map?.error ? (
                  <p className="error" role="status">
                    Unable to load the attached map: {map.error}
                  </p>
                ) : map ? (
                  <p className="muted">Attached map: {map.name}</p>
                ) : null}
                {notesByEncounter.get(encounter.id) ? (
                  <details className="entry-edit">
                    <summary>GM-only preparation notes</summary>
                    <p className="entry-content">
                      {notesByEncounter.get(encounter.id)}
                    </p>
                  </details>
                ) : null}
                <EncounterForm
                  encounter={encounterValue}
                  {...formOptions}
                />
              </details>
            );
          })
        ) : (
          <p className="muted">No encounters planned yet.</p>
        )}
      </section>
    </>
  );
}
