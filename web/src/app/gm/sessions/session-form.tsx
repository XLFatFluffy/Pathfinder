"use client";

import { useActionState } from "react";
import {
  deleteCampaignSession,
  saveCampaignSession,
  type SessionFormState,
} from "./actions";

export type SessionFormValue = {
  id: string;
  session_number: number;
  campaign_date: string;
  summary: string;
  player_visible: boolean;
  gm_notes: string;
};

const initialState: SessionFormState = {};

export default function SessionForm({
  session,
}: {
  session?: SessionFormValue;
}) {
  const [state, saveAction, isSaving] = useActionState(
    saveCampaignSession,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteCampaignSession,
    initialState,
  );

  return (
    <section>
      <h3>{session ? "Edit session log" : "Add a session log"}</h3>
      <form action={saveAction} className="form-stack">
        {session ? (
          <input name="session_id" type="hidden" value={session.id} />
        ) : null}
        <div className="form-grid">
          <label>
            Session number
            <input
              defaultValue={session?.session_number}
              min={1}
              name="session_number"
              required
              type="number"
            />
          </label>
          <label>
            Campaign date
            <input
              defaultValue={session?.campaign_date}
              maxLength={120}
              name="campaign_date"
              placeholder="Use your campaign calendar"
            />
          </label>
        </div>
        <label>
          Session recap
          <textarea
            defaultValue={session?.summary}
            maxLength={50000}
            name="summary"
            rows={7}
          />
        </label>
        <label className="checkbox-label">
          <input
            defaultChecked={session?.player_visible}
            name="player_visible"
            type="checkbox"
          />
          Share recap with players
        </label>
        <details className="entry-edit">
          <summary>GM-only notes</summary>
          <label>
            Private session notes
            <textarea
              defaultValue={session?.gm_notes}
              maxLength={20000}
              name="gm_notes"
              rows={5}
            />
          </label>
        </details>
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
          {isSaving ? "Saving…" : session ? "Save changes" : "Save session log"}
        </button>
      </form>
      {session ? (
        <form
          action={deleteAction}
          className="delete-form"
          onSubmit={(event) => {
            if (!window.confirm("Delete this session log? This cannot be undone.")) {
              event.preventDefault();
            }
          }}
        >
          <input name="session_id" type="hidden" value={session.id} />
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
            {isDeleting ? "Deleting…" : "Delete session log"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
