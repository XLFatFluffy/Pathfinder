"use client";

import { useActionState } from "react";
import {
  deletePlayerCharacter,
  savePlayerCharacter,
  type CharacterFormState,
} from "./actions";

export type CharacterSheet = {
  id: string;
  name: string;
  ancestry: string;
  class_name: string;
  level: number;
  alignment: string;
  background: string;
  strength: number | null;
  dexterity: number | null;
  constitution: number | null;
  intelligence: number | null;
  wisdom: number | null;
  charisma: number | null;
  current_hp: number;
  max_hp: number;
  armor_class: number;
  speed: string;
  saving_throws: string;
  skills: string;
  attacks: string;
  features: string;
  equipment: string;
  spells: string;
  appearance: string;
};

const initialState: CharacterFormState = {};

export default function CharacterForm({ character }: { character?: CharacterSheet }) {
  const [state, saveAction, isSaving] = useActionState(
    savePlayerCharacter,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deletePlayerCharacter,
    initialState,
  );

  return (
    <article className="entry-card">
      <form action={saveAction} className="form-stack">
        {character ? (
          <input name="character_id" type="hidden" value={character.id} />
        ) : null}
        <div className="form-grid">
          <label>
            Character name
            <input
              defaultValue={character?.name}
              maxLength={160}
              name="name"
              required
            />
          </label>
          <label>
            Ancestry
            <input
              defaultValue={character?.ancestry}
              maxLength={120}
              name="ancestry"
              placeholder="Human, elf, dwarf..."
            />
          </label>
          <label>
            Class
            <input
              defaultValue={character?.class_name}
              maxLength={120}
              name="class_name"
              placeholder="Fighter, wizard, rogue..."
            />
          </label>
          <label>
            Level
            <input
              defaultValue={character?.level ?? 1}
              max={20}
              min={1}
              name="level"
              required
              type="number"
            />
          </label>
          <label>
            Alignment
            <input
              defaultValue={character?.alignment}
              maxLength={40}
              name="alignment"
              placeholder="Optional"
            />
          </label>
          <label>
            Speed
            <input
              defaultValue={character?.speed}
              maxLength={120}
              name="speed"
              placeholder="e.g. 30 ft."
            />
          </label>
        </div>
        <div>
          <p>Ability scores</p>
          <div className="form-grid">
            {(
              [
                ["strength", "STR"],
                ["dexterity", "DEX"],
                ["constitution", "CON"],
                ["intelligence", "INT"],
                ["wisdom", "WIS"],
                ["charisma", "CHA"],
              ] as const
            ).map(([field, label]) => (
              <label key={field}>
                {label}
                <input
                  defaultValue={character?.[field] ?? ""}
                  max={100}
                  min={1}
                  name={field}
                  type="number"
                />
              </label>
            ))}
          </div>
        </div>
        <div className="form-grid">
          <label>
            Current HP
            <input
              defaultValue={character?.current_hp ?? 0}
              max={999999}
              min={-9999}
              name="current_hp"
              required
              type="number"
            />
          </label>
          <label>
            Maximum HP
            <input
              defaultValue={character?.max_hp ?? 0}
              max={999999}
              min={0}
              name="max_hp"
              required
              type="number"
            />
          </label>
          <label>
            Armor Class
            <input
              defaultValue={character?.armor_class ?? 10}
              max={999}
              min={-100}
              name="armor_class"
              required
              type="number"
            />
          </label>
        </div>
        <label>
          Background and backstory
          <textarea
            defaultValue={character?.background}
            maxLength={10000}
            name="background"
            rows={5}
          />
        </label>
        <details className="entry-edit" open={!character}>
          <summary>Skills, attacks, abilities, equipment, and spells</summary>
          <div className="form-stack">
            <label>
              Saving throws
              <textarea
                defaultValue={character?.saving_throws}
                maxLength={4000}
                name="saving_throws"
                rows={2}
              />
            </label>
            <label>
              Skills
              <textarea
                defaultValue={character?.skills}
                maxLength={10000}
                name="skills"
                rows={4}
              />
            </label>
            <label>
              Attacks
              <textarea
                defaultValue={character?.attacks}
                maxLength={10000}
                name="attacks"
                rows={4}
              />
            </label>
            <label>
              Class features and abilities
              <textarea
                defaultValue={character?.features}
                maxLength={12000}
                name="features"
                rows={4}
              />
            </label>
            <label>
              Equipment
              <textarea
                defaultValue={character?.equipment}
                maxLength={20000}
                name="equipment"
                rows={4}
              />
            </label>
            <label>
              Spells
              <textarea
                defaultValue={character?.spells}
                maxLength={20000}
                name="spells"
                rows={4}
              />
            </label>
            <label>
              Appearance
              <textarea
                defaultValue={character?.appearance}
                maxLength={4000}
                name="appearance"
                rows={3}
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
          {isSaving ? "Saving…" : character ? "Save changes" : "Save character"}
        </button>
      </form>
      {character ? (
        <form
          action={deleteAction}
          className="delete-form"
          onSubmit={(event) => {
            if (
              !window.confirm(
                `Delete ${character.name}'s character sheet? This cannot be undone.`,
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input name="character_id" type="hidden" value={character.id} />
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
            {isDeleting ? "Deleting…" : "Delete character"}
          </button>
        </form>
      ) : null}
    </article>
  );
}
