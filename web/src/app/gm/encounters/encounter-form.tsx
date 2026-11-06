"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  deleteCampaignEncounter,
  saveCampaignEncounter,
  type EncounterFormState,
} from "./actions";

type Option = {
  id: string;
  name: string;
};

type EncounterNpc = Option & {
  selected: boolean;
};

export type EncounterFormValue = {
  id: string;
  name: string;
  description: string;
  campaign_date: string;
  location_id: string | null;
  quest_id: string | null;
  session_id: string | null;
  map_id: string | null;
  difficulty: string;
  status: string;
  outcome: string;
  aftermath: string;
  player_visible: boolean;
  gm_notes: string;
  npc_ids: string[];
};

const initialState: EncounterFormState = {};

export default function EncounterForm({
  encounter,
  locations,
  quests,
  sessions,
  maps,
  npcs,
}: {
  encounter?: EncounterFormValue;
  locations: Option[];
  quests: Option[];
  sessions: Option[];
  maps: Option[];
  npcs: EncounterNpc[];
}) {
  const [state, saveAction, isSaving] = useActionState(
    saveCampaignEncounter,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteCampaignEncounter,
    initialState,
  );

  return (
    <section>
      <h3>{encounter ? "Edit encounter" : "Plan an encounter"}</h3>
      <form action={saveAction} className="form-stack">
        {encounter ? (
          <input name="encounter_id" type="hidden" value={encounter.id} />
        ) : null}
        <label>
          Encounter name
          <input
            defaultValue={encounter?.name}
            maxLength={200}
            name="name"
            required
          />
        </label>
        <div className="form-grid">
          <label>
            Campaign date
            <input
              defaultValue={encounter?.campaign_date}
              maxLength={120}
              name="campaign_date"
              placeholder="For example, 1 Harvestfall, 243 AC"
            />
          </label>
          <label>
            Status
            <select defaultValue={encounter?.status ?? "planned"} name="status">
              <option value="planned">Planned</option>
              <option value="ready">Ready</option>
              <option value="played">Played</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label>
            Difficulty or threat
            <input
              defaultValue={encounter?.difficulty}
              maxLength={80}
              name="difficulty"
              placeholder="Optional"
            />
          </label>
        </div>
        <label>
          Player-facing description
          <textarea
            defaultValue={encounter?.description}
            maxLength={20000}
            name="description"
            rows={4}
          />
        </label>
        <div className="form-grid">
          <label>
            Linked location
            <select
              defaultValue={encounter?.location_id ?? ""}
              name="location_id"
            >
              <option value="">No linked location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Related quest
            <select defaultValue={encounter?.quest_id ?? ""} name="quest_id">
              <option value="">No related quest</option>
              {quests.map((quest) => (
                <option key={quest.id} value={quest.id}>
                  {quest.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Related session
            <select
              defaultValue={encounter?.session_id ?? ""}
              name="session_id"
            >
              <option value="">No related session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Map from library
            <select defaultValue={encounter?.map_id ?? ""} name="map_id">
              <option value="">No attached map</option>
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="muted">
          Need a new encounter map?{" "}
          <Link href="/gm/maps">Upload it to the campaign map library</Link>,
          then attach it here. The encounter references the existing map and
          does not duplicate its artwork.
        </p>
        <fieldset className="form-stack">
          <legend>NPCs involved</legend>
          {npcs.length ? (
            <div className="checkbox-grid">
              {npcs.map((npc) => (
                <label className="checkbox-label" key={npc.id}>
                  <input
                    defaultChecked={
                      encounter?.npc_ids.includes(npc.id) ?? npc.selected
                    }
                    name="npc_ids"
                    type="checkbox"
                    value={npc.id}
                  />
                  {npc.name}
                </label>
              ))}
            </div>
          ) : (
            <p className="muted">Add NPCs to the campaign to link them here.</p>
          )}
        </fieldset>
        <label>
          Outcome
          <textarea
            defaultValue={encounter?.outcome}
            maxLength={10000}
            name="outcome"
            rows={3}
          />
        </label>
        <label>
          Aftermath
          <textarea
            defaultValue={encounter?.aftermath}
            maxLength={10000}
            name="aftermath"
            rows={3}
          />
        </label>
        <label className="checkbox-label">
          <input
            defaultChecked={encounter?.player_visible}
            name="player_visible"
            type="checkbox"
          />
          Share with players
        </label>
        <details className="entry-edit">
          <summary>GM-only preparation notes</summary>
          <label>
            Private notes
            <textarea
              defaultValue={encounter?.gm_notes}
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
          {isSaving
            ? "Saving…"
            : encounter
              ? "Save changes"
              : "Save encounter"}
        </button>
      </form>
      {encounter ? (
        <form
          action={deleteAction}
          className="delete-form"
          onSubmit={(event) => {
            if (
              !window.confirm(
                "Delete this encounter? Its linked NPC list and private notes will also be deleted.",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input name="encounter_id" type="hidden" value={encounter.id} />
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
            {isDeleting ? "Deleting…" : "Delete encounter"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
