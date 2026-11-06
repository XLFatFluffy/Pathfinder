import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";
import PlayerNoteForm from "./note-form";

export const dynamic = "force-dynamic";

export default async function PlayerNotesPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const notes = await getAllSupabaseRowsOrThrow((from, to) =>
    supabase
      .from("campaign_player_notes")
      .select("id, title, content")
      .eq("campaign_id", member.campaign_id)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to),
  );

  return (
    <>
      <p className="eyebrow">Private player space</p>
      <h2>My notes</h2>
      <p className="muted">
        Keep your own clues, plans, and session reminders here. These notes are
        private to your account and cannot be seen by the GM or other players.
      </p>
      <p className="muted">
        <Link href="/player">Return to your campaign</Link>
      </p>
      <section className="entry-list" aria-labelledby="create-note-heading">
        <h3 id="create-note-heading">Add a note</h3>
        <PlayerNoteForm />
      </section>
      <section className="entry-list" aria-labelledby="notes-heading">
        <h3 id="notes-heading">Your saved notes</h3>
        {notes.length ? (
          notes.map((note) => <PlayerNoteForm key={note.id} note={note} />)
        ) : (
          <p className="notice">
            You do not have any notes yet. Use the form above to record your
            first clue or reminder.
          </p>
        )}
      </section>
    </>
  );
}
