import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlayerSessionsPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: sessions, error } = await supabase
    .from("campaign_sessions")
    .select("id, session_number, campaign_date, summary")
    .eq("campaign_id", member.campaign_id)
    .order("session_number", { ascending: false });

  if (error) {
    throw new Error(`Unable to load shared session recaps: ${error.message}`);
  }

  return (
    <>
      <p className="eyebrow">Chronicle</p>
      <h2>Session history</h2>
      <p className="muted">
        Read the session recaps your GM has chosen to share with the party.
      </p>
      <p className="muted">
        <Link href="/player">Return to your campaign</Link>
      </p>
      <section className="entry-list" aria-labelledby="sessions-heading">
        <h3 id="sessions-heading">Shared session recaps</h3>
        {sessions.length ? (
          sessions.map((session) => (
            <article className="entry-card" key={session.id}>
              <p className="eyebrow">
                Session {session.session_number}
                {session.campaign_date ? ` · ${session.campaign_date}` : ""}
              </p>
              <h4>Session {session.session_number}</h4>
              {session.summary ? (
                <p className="entry-content">{session.summary}</p>
              ) : (
                <p className="muted">No recap has been added.</p>
              )}
            </article>
          ))
        ) : (
          <p className="notice">
            Your GM has not shared any session recaps yet.
          </p>
        )}
      </section>
    </>
  );
}
