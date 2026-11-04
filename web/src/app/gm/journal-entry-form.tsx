"use client";

import { useActionState } from "react";
import {
  deleteCampaignJournalEntry,
  saveCampaignJournalEntry,
  type JournalEntryFormState,
} from "./journal-actions";

const initialState: JournalEntryFormState = {};

export type JournalEntryFormValue = {
  id: string;
  title: string;
  content: string;
  campaign_date: string | null;
  player_visible: boolean;
};

export default function JournalEntryForm({
  entry,
}: {
  entry?: JournalEntryFormValue;
}) {
  const [state, saveAction, isSaving] = useActionState(
    saveCampaignJournalEntry,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteCampaignJournalEntry,
    initialState,
  );

  return (
    <section>
      <h3>{entry ? "Edit journal entry" : "Add a journal entry"}</h3>
      <form action={saveAction} className="form-stack">
        {entry ? <input name="entry_id" type="hidden" value={entry.id} /> : null}
        <label>
          Title
          <input
            defaultValue={entry?.title}
            maxLength={200}
            name="title"
            required
          />
        </label>
        <label>
          Campaign date
          <input
            defaultValue={entry?.campaign_date ?? ""}
            maxLength={120}
            name="campaign_date"
          />
        </label>
        <label>
          Notes
          <textarea
            defaultValue={entry?.content}
            maxLength={50000}
            name="content"
            rows={6}
          />
        </label>
        <label className="checkbox-label">
          <input
            defaultChecked={entry?.player_visible}
            name="player_visible"
            type="checkbox"
          />
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
        <button disabled={isSaving} type="submit">
          {isSaving
            ? "Saving…"
            : entry
              ? "Save changes"
              : "Save journal entry"}
        </button>
      </form>
      {entry ? (
        <form
          action={deleteAction}
          className="delete-form"
          onSubmit={(event) => {
            if (!window.confirm("Delete this journal entry? This cannot be undone.")) {
              event.preventDefault();
            }
          }}
        >
          <input name="entry_id" type="hidden" value={entry.id} />
          {deleteState.error ? (
            <p className="error" role="alert">
              {deleteState.error}
            </p>
          ) : null}
          {deleteState.message ? (
            <p className="notice" role="status">
              {deleteState.message}
            </p>
          ) : null}
          <button disabled={isDeleting} type="submit">
            {isDeleting ? "Deleting…" : "Delete journal entry"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
