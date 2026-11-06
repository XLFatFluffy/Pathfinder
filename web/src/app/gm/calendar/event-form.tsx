"use client";

import { useActionState } from "react";
import {
  deleteCampaignEvent,
  saveCampaignEvent,
  type CampaignEventFormState,
} from "./actions";

type LinkOption = {
  id: string;
  name: string;
};

export type CampaignEventValue = {
  id: string;
  title: string;
  description: string;
  campaign_date: string;
  end_date: string | null;
  date_is_approximate: boolean;
  category: string;
  status: string;
  certainty: string;
  source: string;
  location_id: string | null;
  npc_id: string | null;
  house_id: string | null;
  faction_id: string | null;
  quest_id: string | null;
  session_id: string | null;
  player_visible: boolean;
  gm_notes: string;
};

const initialState: CampaignEventFormState = {};

function CampaignRecordSelect({
  field,
  label,
  value,
  options,
}: {
  field:
    | "location_id"
    | "npc_id"
    | "house_id"
    | "faction_id"
    | "quest_id"
    | "session_id";
  label: string;
  value: string | null | undefined;
  options: LinkOption[];
}) {
  return (
    <label>
      {label}
      <select defaultValue={value ?? ""} name={field}>
        <option value="">None</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function CampaignEventForm({
  event,
  locations,
  npcs,
  houses,
  factions,
  quests,
  sessions,
}: {
  event?: CampaignEventValue;
  locations: LinkOption[];
  npcs: LinkOption[];
  houses: LinkOption[];
  factions: LinkOption[];
  quests: LinkOption[];
  sessions: { id: string; name: string }[];
}) {
  const [state, saveAction, isSaving] = useActionState(
    saveCampaignEvent,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteCampaignEvent,
    initialState,
  );

  return (
    <section>
      <h3>{event ? "Edit campaign event" : "Record a campaign event"}</h3>
      <form action={saveAction} className="form-stack">
        {event ? <input name="event_id" type="hidden" value={event.id} /> : null}
        <div className="form-grid">
          <label>
            Event title
            <input
              defaultValue={event?.title}
              maxLength={200}
              name="title"
              required
            />
          </label>
          <label>
            Category
            <select defaultValue={event?.category ?? "political"} name="category">
              <option value="historical">Historical event</option>
              <option value="political">Political event</option>
              <option value="festival">Festival</option>
              <option value="religious">Religious observance</option>
              <option value="faction">House or faction activity</option>
              <option value="quest_deadline">Quest deadline</option>
              <option value="session">Session event</option>
              <option value="personal">Personal or character event</option>
              <option value="regional">Regional event</option>
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            Campaign date
            <input
              defaultValue={event?.campaign_date}
              maxLength={120}
              name="campaign_date"
              placeholder="1 Harvestfall, 243 AC"
              required
            />
          </label>
          <label>
            End date (optional)
            <input
              defaultValue={event?.end_date ?? ""}
              maxLength={120}
              name="end_date"
              placeholder="Leave blank for a single date"
            />
          </label>
        </div>
        <div className="form-grid">
          <label>
            Status
            <select defaultValue={event?.status ?? "planned"} name="status">
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label>
            Certainty
            <select defaultValue={event?.certainty ?? "confirmed"} name="certainty">
              <option value="confirmed">Confirmed</option>
              <option value="planned">Planned</option>
              <option value="rumored">Rumored</option>
              <option value="unresolved">Unresolved</option>
            </select>
          </label>
        </div>
        <label className="checkbox-label">
          <input
            defaultChecked={event?.date_is_approximate}
            name="date_is_approximate"
            type="checkbox"
          />
          Date is approximate or unresolved
        </label>
        <label>
          Description
          <textarea
            defaultValue={event?.description}
            maxLength={20000}
            name="description"
            rows={5}
          />
        </label>
        <label>
          Source or evidence
          <textarea
            defaultValue={event?.source}
            maxLength={2000}
            name="source"
            rows={2}
          />
        </label>
        <fieldset className="event-links">
          <legend>Linked campaign records (optional)</legend>
          <div className="form-grid">
            <CampaignRecordSelect field="location_id" label="Location" value={event?.location_id} options={locations} />
            <CampaignRecordSelect field="npc_id" label="NPC" value={event?.npc_id} options={npcs} />
            <CampaignRecordSelect field="house_id" label="House" value={event?.house_id} options={houses} />
            <CampaignRecordSelect field="faction_id" label="Faction" value={event?.faction_id} options={factions} />
            <CampaignRecordSelect field="quest_id" label="Quest" value={event?.quest_id} options={quests} />
            <CampaignRecordSelect field="session_id" label="Session" value={event?.session_id} options={sessions} />
          </div>
        </fieldset>
        <label className="checkbox-label">
          <input
            defaultChecked={event?.player_visible}
            name="player_visible"
            type="checkbox"
          />
          Share this event with players
        </label>
        <details className="entry-edit">
          <summary>GM-only notes</summary>
          <label>
            Private notes
            <textarea
              defaultValue={event?.gm_notes}
              maxLength={20000}
              name="gm_notes"
              rows={4}
            />
          </label>
        </details>
        {state.error ? <p className="error" role="alert">{state.error}</p> : null}
        {state.message ? <p className="notice" role="status">{state.message}</p> : null}
        <button disabled={isSaving} type="submit">
          {isSaving ? "Saving…" : event ? "Save event" : "Record event"}
        </button>
      </form>
      {event ? (
        <form
          action={deleteAction}
          className="delete-form"
          onSubmit={(submitEvent) => {
            if (!window.confirm("Delete this campaign event? Its audit history will be retained.")) {
              submitEvent.preventDefault();
            }
          }}
        >
          <input name="event_id" type="hidden" value={event.id} />
          {deleteState.error ? <p className="error" role="alert">{deleteState.error}</p> : null}
          {deleteState.message ? <p className="notice" role="status">{deleteState.message}</p> : null}
          <button disabled={isDeleting} type="submit">
            {isDeleting ? "Deleting…" : "Delete event"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
