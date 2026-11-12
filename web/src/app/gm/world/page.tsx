import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CURRENT_IN_WORLD_DATE } from "@/lib/campaign-calendar";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";
import {
  createWorldReview,
  createWorldReviewItem,
  updateWorldReviewItem,
  updateWorldReviewStatus,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function GmWorldPage() {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") return null;

  const supabase = await createSupabaseServerClient();
  const [reviews, reviewItems, quests, events, npcs, factions] = await Promise.all([
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_world_reviews")
        .select("id, from_campaign_date, to_campaign_date, trigger, summary, status, created_at, reviewed_at, applied_at")
        .eq("campaign_id", member.campaign_id)
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_world_review_items")
        .select("id, review_id, subject_type, subject_id, title, proposal, basis, disposition, gm_notes, created_at, reviewed_at")
        .eq("campaign_id", member.campaign_id)
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
    supabase
      .from("campaign_quests")
      .select("id, name, status, campaign_date")
      .eq("campaign_id", member.campaign_id)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("campaign_events")
      .select("id, title, campaign_date, status, certainty, category")
      .eq("campaign_id", member.campaign_id)
      .neq("status", "cancelled")
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("campaign_npcs")
      .select("id, name, status, occupation, updated_at")
      .eq("campaign_id", member.campaign_id)
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("campaign_factions")
      .select("id, name, faction_type, updated_at")
      .eq("campaign_id", member.campaign_id)
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);

  if (quests.error) throw new Error(`Unable to load active quests: ${quests.error.message}`);
  if (events.error) throw new Error(`Unable to load campaign events: ${events.error.message}`);
  if (npcs.error) throw new Error(`Unable to load NPC activity: ${npcs.error.message}`);
  if (factions.error) throw new Error(`Unable to load faction activity: ${factions.error.message}`);

  const latestReview = reviews[0] ?? null;
  const pendingItems = reviewItems.filter((item) => item.disposition === "pending");
  const reviewById = new Map(reviews.map((review) => [review.id, review]));

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Living world</p>
          <h2>World review cockpit</h2>
        </div>
        <Link href="/gm">Return to overview</Link>
      </div>

      <p className="muted">
        This is the GM-reviewed world engine. It keeps the setting responsive without silently inventing canon.
        Review only what the PCs could plausibly have affected or what meaningful time has changed.
      </p>

      <section className="gm-dashboard" aria-labelledby="world-state-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Current state</p>
            <h3 id="world-state-heading">{CURRENT_IN_WORLD_DATE}</h3>
          </div>
          <span className="header-pill">{pendingItems.length} pending proposals</span>
        </div>
        <div className="gm-dashboard-grid">
          <article className="gm-dashboard-card">
            <span className="muted">Active quests</span>
            <strong>{quests.data?.length ?? 0}</strong>
          </article>
          <article className="gm-dashboard-card">
            <span className="muted">Tracked events</span>
            <strong>{events.data?.length ?? 0}</strong>
          </article>
          <article className="gm-dashboard-card">
            <span className="muted">Recent NPC records</span>
            <strong>{npcs.data?.length ?? 0}</strong>
          </article>
          <article className="gm-dashboard-card">
            <span className="muted">Factions to watch</span>
            <strong>{factions.data?.length ?? 0}</strong>
          </article>
        </div>
      </section>

      <section className="entry-list" aria-labelledby="new-review-heading">
        <div className="section-heading">
          <div>
            <h3 id="new-review-heading">Start a world review</h3>
            <p className="muted">Use this after a session, meaningful downtime, a major PC action, or a deliberate GM review.</p>
          </div>
        </div>
        <form action={createWorldReview} className="form-stack">
          <div className="form-grid">
            <label>
              From campaign date
              <input name="from_campaign_date" defaultValue={latestReview?.to_campaign_date ?? CURRENT_IN_WORLD_DATE} required />
            </label>
            <label>
              To campaign date
              <input name="to_campaign_date" defaultValue={CURRENT_IN_WORLD_DATE} required />
            </label>
          </div>
          <label>
            Trigger
            <select name="trigger" defaultValue="gm_review">
              <option value="session_end">Session ended</option>
              <option value="downtime">Downtime</option>
              <option value="pc_action">PC action</option>
              <option value="gm_review">GM review</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Review summary
            <textarea name="summary" rows={3} placeholder="What changed or why are we reviewing the world?" />
          </label>
          <button type="submit">Start review</button>
        </form>
      </section>

      {latestReview ? (
        <section className="entry-list" aria-labelledby="latest-review-heading">
          <div className="section-heading">
            <div>
              <h3 id="latest-review-heading">Latest review</h3>
              <p className="muted">
                {latestReview.from_campaign_date} → {latestReview.to_campaign_date} · {latestReview.trigger.replaceAll("_", " ")} · {latestReview.status}
              </p>
            </div>
          </div>
          <p className="entry-content">{latestReview.summary || "No summary recorded."}</p>
          <form action={updateWorldReviewStatus} className="form-grid">
            <input type="hidden" name="review_id" value={latestReview.id} />
            <label>
              Review status
              <select name="status" defaultValue={latestReview.status}>
                <option value="draft">Draft</option>
                <option value="reviewed">Reviewed</option>
                <option value="applied">Applied</option>
              </select>
            </label>
            <div>
              <button type="submit">Save review status</button>
            </div>
          </form>
        </section>
      ) : null}

      {latestReview ? (
        <section className="entry-list" aria-labelledby="proposal-heading">
          <div className="section-heading">
            <div>
              <h3 id="proposal-heading">Add consequence proposal</h3>
              <p className="muted">Proposals are not canon until you approve them or they occur in play.</p>
            </div>
          </div>
          <form action={createWorldReviewItem} className="form-stack">
            <input type="hidden" name="review_id" value={latestReview.id} />
            <div className="form-grid">
              <label>
                Subject type
                <select name="subject_type" defaultValue="npc">
                  <option value="npc">NPC</option>
                  <option value="house">House</option>
                  <option value="faction">Faction</option>
                  <option value="quest">Quest</option>
                  <option value="location">Location</option>
                  <option value="event">Event</option>
                  <option value="economy">Economy</option>
                  <option value="geography">Geography</option>
                  <option value="history">History</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Subject ID (optional)
                <input name="subject_id" placeholder="Existing record UUID" />
              </label>
            </div>
            <label>
              Proposal title
              <input name="title" maxLength={200} required placeholder="Example: Millhaven supply dispute worsens" />
            </label>
            <label>
              Proposed consequence
              <textarea name="proposal" rows={4} required placeholder="Describe the plausible change, not the final canon result." />
            </label>
            <label>
              Basis
              <textarea name="basis" rows={3} placeholder="Established motive, knowledge, resources, time, geography, or an event that supports this proposal." />
            </label>
            <button type="submit">Add proposal</button>
          </form>
        </section>
      ) : null}

      <section className="entry-list" aria-labelledby="pending-heading">
        <div className="section-heading">
          <h3 id="pending-heading">Proposal queue</h3>
          <span className="muted">{reviewItems.length} total</span>
        </div>
        {reviewItems.length ? (
          reviewItems.map((item) => {
            const review = reviewById.get(item.review_id);
            return (
              <article className="entry-card" key={item.id}>
                <p className="eyebrow">
                  {item.subject_type} · {item.disposition} · {review?.to_campaign_date ?? "Review"}
                </p>
                <h4>{item.title}</h4>
                <p className="entry-content">{item.proposal}</p>
                {item.basis ? <p className="muted"><strong>Basis:</strong> {item.basis}</p> : null}
                <details className="entry-edit">
                  <summary>Review disposition</summary>
                  <form action={updateWorldReviewItem} className="form-stack">
                    <input type="hidden" name="item_id" value={item.id} />
                    <label>
                      Disposition
                      <select name="disposition" defaultValue={item.disposition}>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="deferred">Deferred</option>
                        <option value="recorded">Recorded</option>
                      </select>
                    </label>
                    <label>
                      GM notes
                      <textarea name="gm_notes" rows={3} defaultValue={item.gm_notes} />
                    </label>
                    <button type="submit">Save disposition</button>
                  </form>
                </details>
              </article>
            );
          })
        ) : (
          <p className="notice">No world-review proposals yet.</p>
        )}
      </section>

      <section className="entry-list" aria-labelledby="watch-heading">
        <div className="section-heading">
          <h3 id="watch-heading">What to watch before play</h3>
        </div>
        <div className="gm-dashboard-grid">
          <article className="entry-card">
            <p className="eyebrow">Active quests</p>
            {quests.data?.length ? (
              <ul className="history-list">
                {quests.data.map((quest) => <li key={quest.id}><strong>{quest.name}</strong>{quest.campaign_date ? ` · ${quest.campaign_date}` : ""}</li>)}
              </ul>
            ) : <p className="muted">No active quests.</p>}
          </article>
          <article className="entry-card">
            <p className="eyebrow">Recent events</p>
            {events.data?.length ? (
              <ul className="history-list">
                {events.data.map((event) => <li key={event.id}><strong>{event.title}</strong> · {event.campaign_date} · {event.certainty}</li>)}
              </ul>
            ) : <p className="muted">No tracked events.</p>}
          </article>
          <article className="entry-card">
            <p className="eyebrow">NPC watch</p>
            {npcs.data?.length ? (
              <ul className="history-list">
                {npcs.data.map((npc) => <li key={npc.id}><strong>{npc.name}</strong> · {npc.status || "Unspecified"}</li>)}
              </ul>
            ) : <p className="muted">No NPC records.</p>}
          </article>
          <article className="entry-card">
            <p className="eyebrow">Faction watch</p>
            {factions.data?.length ? (
              <ul className="history-list">
                {factions.data.map((faction) => <li key={faction.id}><strong>{faction.name}</strong> · {faction.faction_type || "Faction"}</li>)}
              </ul>
            ) : <p className="muted">No faction records.</p>}
          </article>
        </div>
      </section>
    </>
  );
}