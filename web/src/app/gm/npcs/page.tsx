import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";
import NpcForm from "./npc-form";

export const dynamic = "force-dynamic";

export default async function GmNpcsPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [npcs, privateNotes, statusHistory, locations] = await Promise.all([
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_npcs")
        .select(
          "id, name, race, age, gender, occupation, titles, description, status, location_id, player_visible",
        )
        .eq("campaign_id", member.campaign_id)
        .order("name")
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_npc_gm_notes")
        .select("npc_id, notes")
        .eq("campaign_id", member.campaign_id)
        .order("npc_id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_npc_status_history")
        .select("id, npc_id, status, campaign_date, reason, created_at")
        .eq("campaign_id", member.campaign_id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
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
  ]);

  const notesByNpcId = new Map(
    privateNotes.map((entry) => [entry.npc_id, entry.notes]),
  );
  const locationsById = new Map(locations.map((location) => [location.id, location]));
  const historyByNpcId = new Map<string, typeof statusHistory>();
  for (const entry of statusHistory) {
    const history = historyByNpcId.get(entry.npc_id) ?? [];
    history.push(entry);
    historyByNpcId.set(entry.npc_id, history);
  }

  return (
    <>
      <p className="muted">
        Manage NPC profiles, their player-known descriptions, current status,
        and linked locations. Private notes and status history are GM-only.
      </p>
      <p className="muted">
        <Link href="/gm">Return to overview</Link>
      </p>
      <NpcForm locations={locations} />
      <section className="entry-list" aria-labelledby="npcs-heading">
        <h3 id="npcs-heading">Campaign NPCs</h3>
        {npcs.length ? (
          npcs.map((npc) => (
            <article className="entry-card" key={npc.id}>
              <p className="eyebrow">
                {npc.player_visible ? "Known to players" : "GM-only"}
                {npc.status ? ` · ${npc.status}` : ""}
                {npc.occupation ? ` · ${npc.occupation}` : ""}
              </p>
              <h4>{npc.name}</h4>
              <p className="muted">
                {[npc.race, npc.age, npc.gender]
                  .filter(Boolean)
                  .join(" · ")}
                {npc.location_id && locationsById.has(npc.location_id)
                  ? ` · ${locationsById.get(npc.location_id)?.name}`
                  : ""}
              </p>
              {npc.titles ? <p className="entry-content">{npc.titles}</p> : null}
              {npc.description ? (
                <p className="entry-content">{npc.description}</p>
              ) : null}
              {notesByNpcId.get(npc.id) ? (
                <p className="private-notes">
                  <strong>GM-only:</strong> {notesByNpcId.get(npc.id)}
                </p>
              ) : null}
              <details className="entry-edit">
                <summary>Edit or delete this NPC</summary>
                <NpcForm
                  locations={locations}
                  npc={{
                    ...npc,
                    gm_notes: notesByNpcId.get(npc.id) ?? "",
                  }}
                />
              </details>
              <details className="entry-edit">
                <summary>
                  Status history ({historyByNpcId.get(npc.id)?.length ?? 0})
                </summary>
                {historyByNpcId.get(npc.id)?.length ? (
                  <ul className="history-list">
                    {historyByNpcId.get(npc.id)?.map((entry) => (
                      <li key={entry.id}>
                        <strong>{entry.status}</strong>
                        {entry.campaign_date ? ` · ${entry.campaign_date}` : ""}
                        {entry.reason ? ` — ${entry.reason}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No status changes recorded.</p>
                )}
              </details>
            </article>
          ))
        ) : (
          <p className="muted">No campaign NPCs yet.</p>
        )}
      </section>
    </>
  );
}
