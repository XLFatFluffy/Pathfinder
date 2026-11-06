import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const JOURNAL_PAGE_SIZE = 50;

export default async function PlayerJournalPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page: pageParam } = await searchParams;
  const parsedPage = typeof pageParam === "string" ? Number(pageParam) : 1;
  const requestedPage =
    Number.isSafeInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { count, error: countError } = await supabase
    .from("campaign_journal_entries")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", member.campaign_id);
  if (countError) {
    throw new Error(
      `Unable to count shared journal entries: ${countError.message}`,
    );
  }

  const pageCount = Math.max(1, Math.ceil((count ?? 0) / JOURNAL_PAGE_SIZE));
  if (requestedPage > pageCount) {
    redirect(
      pageCount === 1 ? "/player/journal" : `/player/journal?page=${pageCount}`,
    );
  }
  const journalStart = (requestedPage - 1) * JOURNAL_PAGE_SIZE;
  const { data: entries, error: entriesError } = await supabase
    .from("campaign_journal_entries")
    .select("id, title, content, campaign_date, created_at")
    .eq("campaign_id", member.campaign_id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(journalStart, journalStart + JOURNAL_PAGE_SIZE - 1);
  if (entriesError) {
    throw new Error(
      `Unable to load shared journal entries: ${entriesError.message}`,
    );
  }

  return (
    <>
      <p className="eyebrow">Chronicle</p>
      <h2>Campaign journal</h2>
      <p className="muted">
        Read the journal entries your GM has chosen to share with the party.
      </p>
      <p className="muted">
        <Link href="/player">Return to your campaign</Link>
      </p>
      <section className="entry-list" aria-labelledby="journal-heading">
        <div className="section-heading">
          <h3 id="journal-heading">Shared journal entries</h3>
          <span className="muted">{count ?? 0} entries</span>
        </div>
        {entries.length ? (
          entries.map((entry) => (
            <article className="entry-card" key={entry.id}>
              {entry.campaign_date ? (
                <p className="eyebrow">{entry.campaign_date}</p>
              ) : null}
              <h4>{entry.title}</h4>
              <p className="entry-content">{entry.content}</p>
            </article>
          ))
        ) : (
          <p className="notice">
            Your GM has not shared any journal entries yet.
          </p>
        )}
        {pageCount > 1 ? (
          <nav
            className="journal-pagination"
            aria-label="Campaign journal pages"
          >
            {requestedPage > 1 ? (
              <Link
                href={
                  requestedPage === 2
                    ? "/player/journal"
                    : `/player/journal?page=${requestedPage - 1}`
                }
              >
                Newer entries
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            <span className="muted">
              Page {requestedPage} of {pageCount}
            </span>
            {requestedPage < pageCount ? (
              <Link href={`/player/journal?page=${requestedPage + 1}`}>
                Older entries
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
          </nav>
        ) : null}
      </section>
    </>
  );
}
