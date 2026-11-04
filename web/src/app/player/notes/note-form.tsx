"use client";

import { useActionState } from "react";
import {
  deletePlayerNote,
  savePlayerNote,
  type PlayerNoteFormState,
} from "./actions";

export type PlayerNote = {
  id: string;
  title: string;
  content: string;
};

const initialState: PlayerNoteFormState = {};

export default function PlayerNoteForm({ note }: { note?: PlayerNote }) {
  const [state, saveAction, isSaving] = useActionState(
    savePlayerNote,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deletePlayerNote,
    initialState,
  );

  return (
    <article className="entry-card">
      <form action={saveAction} className="form-stack">
        {note ? <input name="note_id" type="hidden" value={note.id} /> : null}
        <label>
          Note title
          <input
            defaultValue={note?.title}
            maxLength={160}
            name="title"
            required
          />
        </label>
        <label>
          Your notes
          <textarea
            defaultValue={note?.content}
            maxLength={20000}
            name="content"
            rows={note ? 5 : 4}
          />
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
          {isSaving ? "Saving…" : note ? "Save changes" : "Save note"}
        </button>
      </form>
      {note ? (
        <form
          action={deleteAction}
          className="delete-form"
          onSubmit={(event) => {
            if (!window.confirm("Delete this personal note? This cannot be undone.")) {
              event.preventDefault();
            }
          }}
        >
          <input name="note_id" type="hidden" value={note.id} />
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
            {isDeleting ? "Deleting…" : "Delete note"}
          </button>
        </form>
      ) : null}
    </article>
  );
}
