import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";
import SessionForm from "./session-form";

export const dynamic = "force-dynamic";

export default async function GmSessionsPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [sessions, privateNotes] = await Promise.all([
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_sessions")
        .select("id, session_number, campaign_date, summary, player_visible")
        .eq("campaign_id", member.campaign_id)
        .order("session_number", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_session_gm_notes")
        .select("session_id, notes")
        .eq("campaign_id", member.campaign_id)
        .order("session_id")
        .range(from, to),
    ),
  ]);

  const notesBySessionId = new Map(
    privateNotes.map((entry) => [entry.session_id, entry.notes]),
  );

  return (
    <>
      <p className="muted">
        Keep a numbered record of each game, use your custom campaign dates,
        and decide which recaps are shared with players. GM notes are stored
        separately from the shared recap.
      </p>
      <p className="muted">
        <Link href="/gm">Return to overview</Link>
      </p>
      <SessionForm />
      <section className="entry-list" aria-labelledby="sessions-heading">
        <h3 id="sessions-heading">Session history</h3>
        {sessions.length ? (
          sessions.map((session) => (
            <article className="entry-card" key={session.id}>
              <p className="eyebrow">
                Session {session.session_number}
                {session.campaign_date ? ` · ${session.campaign_date}` : ""}
                {session.player_visible ? " · Shared with players" : " · GM-only"}
              </p>
              <h4>Session {session.session_number}</h4>
              {session.summary ? (
                <p className="entry-content">{session.summary}</p>
              ) : null}
              {notesBySessionId.get(session.id) ? (
                <p className="private-notes">
                  <strong>GM-only:</strong> {notesBySessionId.get(session.id)}
                </p>
              ) : null}
              <details className="entry-edit">
                <summary>Edit or delete this session log</summary>
                <SessionForm
                  session={{
                    ...session,
                    gm_notes: notesBySessionId.get(session.id) ?? "",
                  }}
                />
              </details>
            </article>
          ))
        ) : (
          <p className="muted">No session logs yet.</p>
        )}
      </section>
    </>
  );
}
