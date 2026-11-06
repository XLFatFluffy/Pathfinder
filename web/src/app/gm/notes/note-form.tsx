"use client";

import { useActionState } from "react";
import {
  CAMPAIGN_NOTE_CATEGORIES,
  type CampaignNoteLink,
  type CampaignNoteLinkType,
} from "@/lib/campaign-notes";
import {
  deleteCampaignNote,
  saveCampaignNote,
  type CampaignNoteFormState,
} from "./actions";

type LinkOption = {
  id: string;
  name: string;
};

type LinkGroup = {
  type: CampaignNoteLinkType;
  label: string;
  options: LinkOption[];
};

export type CampaignNoteValue = {
  id: string;
  title: string;
  content: string;
  campaign_date: string | null;
  category: string;
  tags: string[];
  pinned: boolean;
  player_visible: boolean;
  updated_at: string;
  links: CampaignNoteLink[];
};

const initialState: CampaignNoteFormState = {};

export default function CampaignNoteForm({
  note,
  linkGroups,
}: {
  note?: CampaignNoteValue;
  linkGroups: LinkGroup[];
}) {
  const [state, saveAction, isSaving] = useActionState(saveCampaignNote, initialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteCampaignNote,
    initialState,
  );
  const selectedLinks = new Set(
    note?.links.map((link) => `${link.type}:${link.id}`) ?? [],
  );

  return (
    <section>
      <h3>{note ? "Edit campaign note" : "Create a campaign note"}</h3>
      <form action={saveAction} className="form-stack">
        {note ? <input name="entry_id" type="hidden" value={note.id} /> : null}
        <div className="form-grid">
          <label>
            Title
            <input
              defaultValue={note?.title}
              maxLength={200}
              name="title"
              required
            />
          </label>
          <label>
            Category
            <select defaultValue={note?.category ?? "unsorted"} name="category">
              {CAMPAIGN_NOTE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            Campaign date (optional)
            <input
              defaultValue={note?.campaign_date ?? ""}
              maxLength={120}
              name="campaign_date"
              placeholder="1 Harvestfall, 243 AC"
            />
          </label>
          <label>
            Tags
            <input
              defaultValue={note?.tags.join(", ")}
              maxLength={800}
              name="tags"
              placeholder="smuggling, harbor, session 3"
            />
          </label>
        </div>
        <label>
          Markdown content
          <textarea
            defaultValue={note?.content}
            maxLength={50000}
            name="content"
            placeholder={"Use Markdown for headings, lists, and links.\n\n## Session preparation"}
            rows={10}
          />
        </label>
        <details className="note-link-picker">
          <summary>
            Link campaign records ({note?.links.length ?? 0} selected)
          </summary>
          <p className="muted">
            Select records or an existing map asset to keep this note connected to campaign canon.
          </p>
          <div className="note-link-groups">
            {linkGroups.map((group) => (
              <fieldset className="note-link-group" key={group.type}>
                <legend>{group.label}</legend>
                {group.options.length ? (
                  group.options.map((option) => (
                    <label className="checkbox-label" key={option.id}>
                      <input
                        defaultChecked={selectedLinks.has(`${group.type}:${option.id}`)}
                        name="links"
                        type="checkbox"
                        value={`${group.type}:${option.id}`}
                      />
                      {option.name}
                    </label>
                  ))
                ) : (
                  <p className="muted">No records available.</p>
                )}
              </fieldset>
            ))}
          </div>
        </details>
        <label className="checkbox-label">
          <input defaultChecked={note?.pinned} name="pinned" type="checkbox" />
          Pin this note
        </label>
        <label className="checkbox-label">
          <input
            defaultChecked={note?.player_visible}
            name="player_visible"
            type="checkbox"
          />
          Share this note with players
        </label>
        {state.error ? <p className="error" role="alert">{state.error}</p> : null}
        {state.message ? <p className="notice" role="status">{state.message}</p> : null}
        <button disabled={isSaving} type="submit">
          {isSaving ? "Saving…" : note ? "Save changes" : "Create note"}
        </button>
      </form>
      {note ? (
        <form
          action={deleteAction}
          className="delete-form"
          onSubmit={(event) => {
            if (!window.confirm("Delete this campaign note? This cannot be undone.")) {
              event.preventDefault();
            }
          }}
        >
          <input name="entry_id" type="hidden" value={note.id} />
          {deleteState.error ? <p className="error" role="alert">{deleteState.error}</p> : null}
          {deleteState.message ? <p className="notice" role="status">{deleteState.message}</p> : null}
          <button disabled={isDeleting} type="submit">
            {isDeleting ? "Deleting…" : "Delete note"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
