"use client";

import { useActionState } from "react";
import {
  deleteCampaignFaction,
  saveCampaignFaction,
  type FactionFormState,
} from "./actions";

type FactionReference = {
  id: string;
  name: string;
};

export type FactionFormValue = {
  id: string;
  name: string;
  faction_type: string;
  description: string;
  player_visible: boolean;
  leader_npc_id: string | null;
  headquarters_location_id: string | null;
  objectives: string;
  resources: string;
  influence: string;
  membership: string;
  allies_and_rivals: string;
  current_activities: string;
  history: string;
  secrets: string;
};

const initialState: FactionFormState = {};

export default function FactionForm({
  faction,
  npcs,
  locations,
}: {
  faction?: FactionFormValue;
  npcs: FactionReference[];
  locations: FactionReference[];
}) {
  const [state, saveAction, isSaving] = useActionState(
    saveCampaignFaction,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteCampaignFaction,
    initialState,
  );

  return (
    <section>
      <h3>{faction ? "Edit faction" : "Add a faction"}</h3>
      <form action={saveAction} className="form-stack">
        {faction ? (
          <input name="faction_id" type="hidden" value={faction.id} />
        ) : null}
        <label>
          Faction name
          <input
            defaultValue={faction?.name}
            maxLength={160}
            name="name"
            required
          />
        </label>
        <div className="form-grid">
          <label>
            Type
            <input
              defaultValue={faction?.faction_type}
              maxLength={120}
              name="faction_type"
              placeholder="Guild, order, government..."
            />
          </label>
          <label>
            Leader
            <select
              defaultValue={faction?.leader_npc_id ?? ""}
              name="leader_npc_id"
            >
              <option value="">Not recorded</option>
              {npcs.map((npc) => (
                <option key={npc.id} value={npc.id}>
                  {npc.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Public description
          <textarea
            defaultValue={faction?.description}
            maxLength={20000}
            name="description"
            rows={4}
          />
        </label>
        <label>
          Headquarters
          <select
            defaultValue={faction?.headquarters_location_id ?? ""}
            name="headquarters_location_id"
          >
            <option value="">Not recorded</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-label">
          <input
            defaultChecked={faction?.player_visible}
            name="player_visible"
            type="checkbox"
          />
          Known to players
        </label>
        <details className="entry-edit">
          <summary>GM-only faction intelligence</summary>
          <div className="form-stack">
            <label>
              Objectives
              <textarea
                defaultValue={faction?.objectives}
                maxLength={10000}
                name="objectives"
                rows={3}
              />
            </label>
            <label>
              Resources
              <textarea
                defaultValue={faction?.resources}
                maxLength={10000}
                name="resources"
                rows={3}
              />
            </label>
            <label>
              Influence and reach
              <textarea
                defaultValue={faction?.influence}
                maxLength={4000}
                name="influence"
                rows={3}
              />
            </label>
            <label>
              Membership
              <textarea
                defaultValue={faction?.membership}
                maxLength={10000}
                name="membership"
                rows={3}
              />
            </label>
            <label>
              Allies and rivals
              <textarea
                defaultValue={faction?.allies_and_rivals}
                maxLength={10000}
                name="allies_and_rivals"
                rows={3}
              />
            </label>
            <label>
              Current activities
              <textarea
                defaultValue={faction?.current_activities}
                maxLength={10000}
                name="current_activities"
                rows={3}
              />
            </label>
            <label>
              History
              <textarea
                defaultValue={faction?.history}
                maxLength={20000}
                name="history"
                rows={4}
              />
            </label>
            <label>
              Secrets
              <textarea
                defaultValue={faction?.secrets}
                maxLength={20000}
                name="secrets"
                rows={4}
              />
            </label>
          </div>
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
          {isSaving ? "Saving…" : faction ? "Save changes" : "Save faction"}
        </button>
      </form>
      {faction ? (
        <form
          action={deleteAction}
          className="delete-form"
          onSubmit={(event) => {
            if (!window.confirm("Delete this faction? This cannot be undone.")) {
              event.preventDefault();
            }
          }}
        >
          <input name="faction_id" type="hidden" value={faction.id} />
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
            {isDeleting ? "Deleting…" : "Delete faction"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
