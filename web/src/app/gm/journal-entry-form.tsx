"use client";

import { useActionState } from "react";
import { createCampaignJournalEntry, type JournalEntryFormState } from "./journal-actions";

const initialState: JournalEntryFormState = {};

export default function JournalEntryForm() {
  const [state, action, isPending] = useActionState(
    createCampaignJournalEntry,
    initialState,
  );

  return (
    <section>
      <h3>Add a journal entry</h3>
      <form action={action} className="form-stack">
        <label>
          Title
          <input maxLength={200} name="title" required />
        </label>
        <label>
          Campaign date
          <input maxLength={120} name="campaign_date" />
        </label>
        <label>
          Notes
          <textarea maxLength={50000} name="content" rows={6} />
        </label>
        <label className="checkbox-label">
          <input name="player_visible" type="checkbox" />
          Visible to players
        </label>
        {state.error ? (
          <p className="error" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p className="notice" role="status">
            {state.message}
          </p>
        ) : null}
        <button disabled={isPending} type="submit">
          {isPending ? "Saving…" : "Save journal entry"}
        </button>
      </form>
    </section>
  );
}
