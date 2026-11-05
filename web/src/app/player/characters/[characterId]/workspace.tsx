"use client";

import { useActionState } from "react";
import {
  calculateCharacter,
  type AbilityName,
  type CharacterCalculationInput,
} from "@/lib/character-calculations";
import {
  deleteStructuredCharacterRecord,
  saveStructuredCharacterSection,
} from "../structured-actions";
import type { CharacterFormState } from "../actions";

export type WorkspaceRow = Record<string, unknown> & { id?: string };

export type CharacterWorkspaceData = {
  identity: WorkspaceRow | null;
  abilities: WorkspaceRow[];
  combat: WorkspaceRow | null;
  saves: WorkspaceRow[];
  classes: WorkspaceRow[];
  levelHistory: WorkspaceRow[];
  skills: WorkspaceRow[];
  attacks: WorkspaceRow[];
  features: WorkspaceRow[];
  equipment: WorkspaceRow[];
  spellcasting: WorkspaceRow[];
  spells: WorkspaceRow[];
  slots: WorkspaceRow[];
  relationships: WorkspaceRow[];
  history: WorkspaceRow[];
  relatedEntities: Record<
    "npc" | "faction" | "house" | "location" | "quest",
    WorkspaceRow[]
  >;
};

type Character = {
  id: string;
  name: string;
  ancestry: string;
  class_name: string;
  level: number;
};

const abilityNames = ["str", "dex", "con", "int", "wis", "cha"] as const;
const abilityLabels: Record<AbilityName, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};
const saveTypes = ["fortitude", "reflex", "will"] as const;
const saveLabels: Record<(typeof saveTypes)[number], string> = {
  fortitude: "Fortitude",
  reflex: "Reflex",
  will: "Will",
};
const entityTypes = ["npc", "faction", "house", "location", "quest"] as const;

const initialState: CharacterFormState = {};

function stringValue(row: WorkspaceRow | null | undefined, field: string, fallback = "") {
  const value = row?.[field];
  return typeof value === "string" ? value : fallback;
}

function numberValue(
  row: WorkspaceRow | null | undefined,
  field: string,
  fallback = 0,
) {
  const value = row?.[field];
  return typeof value === "number" ? value : fallback;
}

function booleanValue(row: WorkspaceRow | null | undefined, field: string) {
  return row?.[field] === true;
}

function abilityValue(value: unknown): AbilityName {
  return abilityNames.includes(value as AbilityName) ? (value as AbilityName) : "str";
}

function SaveForm({
  characterId,
  section,
  children,
}: {
  characterId: string;
  section: string;
  children: React.ReactNode;
}) {
  const [state, formAction, isPending] = useActionState(
    saveStructuredCharacterSection,
    initialState,
  );
  return (
    <form action={formAction} className="form-stack">
      <input name="character_id" type="hidden" value={characterId} />
      <input name="section" type="hidden" value={section} />
      {children}
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
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function DeleteRecord({
  characterId,
  section,
  recordId,
}: {
  characterId: string;
  section: string;
  recordId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    deleteStructuredCharacterRecord,
    initialState,
  );
  return (
    <form action={formAction} className="inline-form">
      <input name="character_id" type="hidden" value={characterId} />
      <input name="section" type="hidden" value={section} />
      <input name="record_id" type="hidden" value={recordId} />
      {state.error ? (
        <span className="error" role="alert">
          {state.error}
        </span>
      ) : null}
      <button disabled={isPending} type="submit">
        {isPending ? "Removing…" : "Remove"}
      </button>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="entry-edit">
      <summary>{title}</summary>
      <div className="entry-list">{children}</div>
    </details>
  );
}

export default function CharacterWorkspace({
  character,
  characterId,
  data,
}: {
  character: Character;
  characterId: string;
  data: CharacterWorkspaceData;
}) {
  const scoreByAbility = new Map(
    data.abilities.map((row) => [stringValue(row, "ability"), row]),
  );
  const combat = data.combat;
  const calculationInput: CharacterCalculationInput = {
    abilityScores: abilityNames.map((ability) => {
      const row = scoreByAbility.get(ability);
      return {
        ability,
        base_score:
          typeof row?.base_score === "number" ? row.base_score : null,
        permanent_modifier: numberValue(row, "permanent_modifier"),
        temporary_modifier: numberValue(row, "temporary_modifier"),
      };
    }),
    skills: data.skills.map((row) => ({
      id: stringValue(row, "id"),
      name: stringValue(row, "name"),
      key_ability: abilityValue(row.key_ability),
      ranks: numberValue(row, "ranks"),
      class_skill: booleanValue(row, "class_skill"),
      armor_check_penalty: booleanValue(row, "armor_check_penalty"),
      misc_modifier: numberValue(row, "misc_modifier"),
    })),
    savingThrows: data.saves.map((row) => ({
      save_type: stringValue(row, "save_type") as
        | "fortitude"
        | "reflex"
        | "will",
      base_bonus: numberValue(row, "base_bonus"),
      resistance_bonus: numberValue(row, "resistance_bonus"),
      misc_modifier: numberValue(row, "misc_modifier"),
    })),
    combat: {
      current_hp: numberValue(combat, "current_hp"),
      max_hp: numberValue(combat, "max_hp"),
      temporary_hp: numberValue(combat, "temporary_hp"),
      nonlethal_damage: numberValue(combat, "nonlethal_damage"),
      armor_bonus: numberValue(combat, "armor_bonus"),
      shield_bonus: numberValue(combat, "shield_bonus"),
      natural_armor_bonus: numberValue(combat, "natural_armor_bonus"),
      deflection_bonus: numberValue(combat, "deflection_bonus"),
      dodge_bonus: numberValue(combat, "dodge_bonus"),
      misc_ac_bonus: numberValue(combat, "misc_ac_bonus"),
      base_attack_bonus: numberValue(combat, "base_attack_bonus"),
      initiative_misc: numberValue(combat, "initiative_misc"),
      cmb_misc: numberValue(combat, "cmb_misc"),
      cmd_misc: numberValue(combat, "cmd_misc"),
    },
    attacks: data.attacks.map((row) => ({
      id: stringValue(row, "id"),
      name: stringValue(row, "name"),
      attack_type: stringValue(row, "attack_type"),
      key_ability: abilityValue(row.key_ability),
      damage_ability:
        row.damage_ability === "none"
          ? "none"
          : abilityValue(row.damage_ability),
      attack_bonus: numberValue(row, "attack_bonus"),
      damage_bonus: numberValue(row, "damage_bonus"),
      enhancement: numberValue(row, "enhancement"),
      damage: stringValue(row, "damage"),
    })),
    spellcasting: data.spellcasting.map((row) => ({
      id: stringValue(row, "id"),
      class_name: stringValue(row, "class_name"),
      caster_level: numberValue(row, "caster_level"),
      casting_ability: abilityValue(row.casting_ability),
      spell_dc_misc: numberValue(row, "spell_dc_misc"),
    })),
    armorCheckPenalty: numberValue(combat, "armor_check_penalty"),
  };
  const calculated = calculateCharacter(calculationInput);

  return (
    <div className="character-workspace">
      <section className="entry-card" aria-labelledby="calculated-heading">
        <p className="eyebrow">
          {[character.ancestry, character.class_name, `Level ${character.level}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <h3 id="calculated-heading">Calculated totals</h3>
        <div className="character-stat-grid">
          <p>
            <strong>HP</strong>{" "}
            {calculated.combat.current_hp}/{calculated.combat.max_hp}
            {calculated.combat.temporary_hp
              ? ` (+${calculated.combat.temporary_hp} temp)`
              : ""}
          </p>
          {abilityNames.map((ability) => (
            <p key={ability}>
              <strong>{ability.toUpperCase()}</strong>{" "}
              {calculated.abilities[ability].score ?? "—"} (
              {calculated.abilities[ability].modifier == null
                ? "—"
                : calculated.abilities[ability].modifier! >= 0
                  ? `+${calculated.abilities[ability].modifier}`
                  : calculated.abilities[ability].modifier}
              )
            </p>
          ))}
          <p>
            <strong>AC</strong> {calculated.combat.armor_class}{" "}
            <span className="muted">
              (touch {calculated.combat.touch_armor_class}, flat-footed{" "}
              {calculated.combat.flat_footed_armor_class})
            </span>
          </p>
          <p>
            <strong>Initiative</strong> {calculated.combat.initiative}
          </p>
          <p>
            <strong>CMB / CMD</strong> {calculated.combat.cmb} /{" "}
            {calculated.combat.cmd}
          </p>
        </div>
        {calculated.savingThrows.length ? (
          <p>
            <strong>Saves</strong>{" "}
            {calculated.savingThrows
              .map(
                (save) =>
                  `${saveLabels[save.save_type]} ${save.total >= 0 ? "+" : ""}${save.total}`,
              )
              .join(" · ")}
          </p>
        ) : null}
        {calculated.skills.length ? (
          <div className="character-stat-grid">
            {calculated.skills.map((skill) => (
              <p key={skill.id}>
                <strong>{skill.name}</strong>{" "}
                {skill.total >= 0 ? "+" : ""}
                {skill.total}
              </p>
            ))}
          </div>
        ) : null}
      </section>

      <Section title="Identity, background, and biography">
        <SaveForm characterId={characterId} section="identity">
          <div className="form-grid">
            {(
              [
                ["age", "Age", 80],
                ["gender", "Gender", 80],
                ["height", "Height", 80],
                ["weight", "Weight", 80],
                ["eyes", "Eyes", 80],
                ["hair", "Hair", 80],
                ["skin", "Skin", 80],
                ["homeland", "Homeland", 2000],
                ["deity", "Deity", 200],
                ["religion", "Religion", 2000],
                ["languages", "Languages", 4000],
              ] as const
            ).map(([name, label, maximum]) => (
              <label key={name}>
                {label}
                <input
                  defaultValue={stringValue(data.identity, name)}
                  maxLength={maximum}
                  name={name}
                />
              </label>
            ))}
          </div>
          {(
            [
              ["appearance", "Appearance", 3],
              ["biography", "Biography and background", 5],
              ["personality", "Personality", 3],
              ["goals", "Goals", 3],
              ["bonds", "Bonds", 3],
              ["fears", "Fears", 3],
              ["secrets", "Secrets", 4],
            ] as const
          ).map(([name, label, rows]) => (
            <label key={name}>
              {label}
              <textarea
                defaultValue={stringValue(data.identity, name)}
                name={name}
                rows={rows}
              />
            </label>
          ))}
        </SaveForm>
      </Section>

      <Section title="Ability scores">
        <SaveForm characterId={characterId} section="abilities">
          <div className="form-grid">
            {abilityNames.map((ability) => {
              const row = scoreByAbility.get(ability);
              return (
                <fieldset className="character-fieldset" key={ability}>
                  <legend>{abilityLabels[ability]}</legend>
                  <label>
                    Base score
                    <input
                      defaultValue={
                        typeof row?.base_score === "number" ? row.base_score : ""
                      }
                      max={100}
                      min={1}
                      name={`${ability}_score`}
                      type="number"
                    />
                  </label>
                  <label>
                    Permanent modifier
                    <input
                      defaultValue={numberValue(row, "permanent_modifier")}
                      max={100}
                      min={-100}
                      name={`${ability}_permanent`}
                      type="number"
                    />
                  </label>
                  <label>
                    Temporary modifier
                    <input
                      defaultValue={numberValue(row, "temporary_modifier")}
                      max={100}
                      min={-100}
                      name={`${ability}_temporary`}
                      type="number"
                    />
                  </label>
                </fieldset>
              );
            })}
          </div>
        </SaveForm>
      </Section>

      <Section title="Combat statistics and armor class">
        <SaveForm characterId={characterId} section="combat">
          <div className="form-grid">
            {(
              [
                ["current_hp", "Current HP", -9999, 999999],
                ["max_hp", "Maximum HP", 0, 999999],
                ["temporary_hp", "Temporary HP", 0, 999999],
                ["nonlethal_damage", "Nonlethal damage", 0, 999999],
                ["armor_bonus", "Armor bonus", -100, 100],
                ["shield_bonus", "Shield bonus", -100, 100],
                ["natural_armor_bonus", "Natural armor", -100, 100],
                ["deflection_bonus", "Deflection bonus", -100, 100],
                ["dodge_bonus", "Dodge bonus", -100, 100],
                ["misc_ac_bonus", "Other AC bonus", -100, 100],
                ["armor_check_penalty", "Armor check penalty", -100, 0],
                ["base_attack_bonus", "Base attack bonus", -100, 100],
                ["initiative_misc", "Initiative misc.", -100, 100],
                ["cmb_misc", "CMB misc.", -100, 100],
                ["cmd_misc", "CMD misc.", -100, 100],
              ] as const
            ).map(([name, label, min, max]) => (
              <label key={name}>
                {label}
                <input
                  defaultValue={numberValue(combat, name)}
                  max={max}
                  min={min}
                  name={name}
                  type="number"
                />
              </label>
            ))}
            <label>
              Speed
              <input
                defaultValue={stringValue(combat, "speed")}
                maxLength={120}
                name="speed"
              />
            </label>
          </div>
        </SaveForm>
      </Section>

      <Section title="Saving throws">
        <SaveForm characterId={characterId} section="saves">
          <div className="form-grid">
            {saveTypes.map((saveType) => {
              const row = data.saves.find(
                (item) => item.save_type === saveType,
              );
              return (
                <fieldset className="character-fieldset" key={saveType}>
                  <legend>{saveLabels[saveType]}</legend>
                  {(
                    [
                      ["base", "Base bonus", "base_bonus"],
                      ["resistance", "Resistance bonus", "resistance_bonus"],
                      ["misc", "Misc. modifier", "misc_modifier"],
                    ] as const
                  ).map(([suffix, label, field]) => (
                    <label key={suffix}>
                      {label}
                      <input
                        defaultValue={numberValue(row, field)}
                        max={100}
                        min={-100}
                        name={`${saveType}_${suffix}`}
                        type="number"
                      />
                    </label>
                  ))}
                </fieldset>
              );
            })}
          </div>
        </SaveForm>
      </Section>

      <Section title="Classes and levels">
        <div className="entry-list">
          {data.classes.map((row) => (
            <article className="entry-card" key={stringValue(row, "id")}>
              <strong>
                {stringValue(row, "class_name")} {numberValue(row, "level")}
              </strong>
              {stringValue(row, "archetype")
                ? ` · ${stringValue(row, "archetype")}`
                : ""}
            </article>
          ))}
        </div>
        {data.levelHistory.length ? (
          <div className="entry-list" aria-label="Class level history">
            {data.levelHistory.map((row) => (
              <article className="entry-card" key={stringValue(row, "id")}>
                <strong>
                  {stringValue(
                    data.classes.find((entry) => entry.id === row.class_id),
                    "class_name",
                  ) || "Class"}{" "}
                  {numberValue(row, "level")}
                </strong>
                {stringValue(row, "campaign_date")
                  ? ` · ${stringValue(row, "campaign_date")}`
                  : ""}
                {stringValue(row, "description") ? (
                  <p className="entry-content">
                    {stringValue(row, "description")}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
        <SaveForm characterId={characterId} section="class">
          <div className="form-grid">
            <label>
              Class
              <input maxLength={120} name="class_name" required />
            </label>
            <label>
              Class type
              <select defaultValue="base" name="class_type">
                <option value="base">Base</option>
                <option value="prestige">Prestige</option>
                <option value="racial">Racial</option>
              </select>
            </label>
            <label>
              Class level
              <input max={20} min={1} name="class_level" required type="number" />
            </label>
            <label>
              Archetype
              <input maxLength={160} name="archetype" />
            </label>
          </div>
          <label>
            Class notes
            <textarea maxLength={5000} name="class_notes" rows={2} />
          </label>
          <div className="form-grid">
            <label>
              Campaign date
              <input maxLength={120} name="class_campaign_date" />
            </label>
            <label>
              Level history note
              <input
                maxLength={4000}
                name="class_history_description"
                placeholder="Optional"
              />
            </label>
          </div>
          <label className="checkbox-label">
            <input name="favored_class" type="checkbox" /> Favored class
          </label>
        </SaveForm>
      </Section>

      <Section title="Skills">
        <div className="entry-list">
          {calculated.skills.map((skill) => (
            <article className="entry-card" key={skill.id}>
              <strong>{skill.name}</strong> {skill.total >= 0 ? "+" : ""}
              {skill.total}
              <p className="muted">
                {abilityLabels[skill.key_ability]} · {skill.ranks} ranks
                {skill.class_skill ? " · class skill" : ""}
              </p>
              <DeleteRecord
                characterId={characterId}
                recordId={skill.id}
                section="skill"
              />
            </article>
          ))}
        </div>
        <SaveForm characterId={characterId} section="skill">
          <div className="form-grid">
            <label>
              Skill name
              <input maxLength={120} name="name" required />
            </label>
            <label>
              Key ability
              <select name="key_ability">
                {abilityNames.map((ability) => (
                  <option key={ability} value={ability}>
                    {abilityLabels[ability]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ranks
              <input max={100} min={0} name="ranks" required type="number" />
            </label>
            <label>
              Misc. modifier
              <input
                defaultValue={0}
                max={100}
                min={-100}
                name="misc_modifier"
                type="number"
              />
            </label>
          </div>
          <label className="checkbox-label">
            <input name="class_skill" type="checkbox" /> Class skill
          </label>
          <label className="checkbox-label">
            <input name="armor_check_penalty" type="checkbox" /> Applies armor
            check penalty
          </label>
          <label>
            Notes
            <textarea maxLength={4000} name="notes" rows={2} />
          </label>
        </SaveForm>
      </Section>

      <Section title="Attacks">
        <div className="entry-list">
          {calculated.attacks.map((attack) => (
            <article className="entry-card" key={attack.id}>
              <strong>{attack.name}</strong>{" "}
              {attack.total_attack_bonus >= 0 ? "+" : ""}
              {attack.total_attack_bonus}
              <p className="muted">
                {attack.damage}
                {attack.damage_modifier
                  ? ` ${attack.damage_modifier > 0 ? "+" : ""}${attack.damage_modifier}`
                  : ""}
                {attack.attack_type ? ` · ${attack.attack_type}` : ""}
              </p>
              <DeleteRecord
                characterId={characterId}
                recordId={attack.id}
                section="attack"
              />
            </article>
          ))}
        </div>
        <SaveForm characterId={characterId} section="attack">
          <div className="form-grid">
            <label>
              Attack name
              <input maxLength={160} name="name" required />
            </label>
            <label>
              Attack type
              <input maxLength={80} name="attack_type" placeholder="Melee, ranged, touch…" />
            </label>
            <label>
              Attack ability
              <select name="key_ability">
                {abilityNames.map((ability) => (
                  <option key={ability} value={ability}>
                    {abilityLabels[ability]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Damage ability
              <select name="damage_ability">
                <option value="str">Strength</option>
                <option value="dex">Dexterity</option>
                <option value="none">None</option>
              </select>
            </label>
            <label>
              Attack misc.
              <input defaultValue={0} max={100} min={-100} name="attack_bonus" type="number" />
            </label>
            <label>
              Damage misc.
              <input defaultValue={0} max={100} min={-100} name="damage_bonus" type="number" />
            </label>
            <label>
              Enhancement
              <input defaultValue={0} max={100} min={-100} name="enhancement" type="number" />
            </label>
            <label>
              Damage dice
              <input maxLength={500} name="damage" placeholder="e.g. 1d8" />
            </label>
          </div>
        </SaveForm>
      </Section>

      <Section title="Feats and class features">
        <RecordList characterId={characterId} records={data.features} section="feature">
          {(row) => (
            <>
              <strong>{stringValue(row, "name")}</strong>{" "}
              <span className="muted">{stringValue(row, "feature_type")}</span>
              {stringValue(row, "description") ? (
                <p className="entry-content">{stringValue(row, "description")}</p>
              ) : null}
            </>
          )}
        </RecordList>
        <SaveForm characterId={characterId} section="feature">
          <div className="form-grid">
            <label>
              Name
              <input maxLength={160} name="name" required />
            </label>
            <label>
              Type
              <select name="feature_type">
                <option value="feat">Feat</option>
                <option value="class_feature">Class feature</option>
                <option value="special_ability">Special ability</option>
                <option value="custom">Other</option>
              </select>
            </label>
          </div>
          <label>
            Description
            <textarea maxLength={10000} name="description" rows={3} />
          </label>
        </SaveForm>
      </Section>

      <Section title="Equipment and inventory">
        <RecordList characterId={characterId} records={data.equipment} section="equipment">
          {(row) => (
            <>
              <strong>{stringValue(row, "name")}</strong>
              <p className="muted">
                {stringValue(row, "item_type")} · Qty {numberValue(row, "quantity")}
                {` · ${numberValue(row, "weight")} lb · ${numberValue(row, "value_gp")} gp`}
                {booleanValue(row, "equipped") ? " · equipped" : ""}
              </p>
            </>
          )}
        </RecordList>
        <SaveForm characterId={characterId} section="equipment">
          <div className="form-grid">
            <label>
              Item
              <input maxLength={160} name="name" required />
            </label>
            <label>
              Type
              <select name="item_type">
                <option value="general">General</option>
                <option value="weapon">Weapon</option>
                <option value="armor">Armor</option>
                <option value="shield">Shield</option>
                <option value="magic_item">Magic item</option>
              </select>
            </label>
            <label>
              Quantity
              <input defaultValue={1} max={999999} min={0} name="quantity" type="number" />
            </label>
            <label>
              Weight (lb)
              <input defaultValue={0} min={0} name="weight" step="0.01" type="number" />
            </label>
            <label>
              Value (gp)
              <input defaultValue={0} min={0} name="value_gp" step="0.01" type="number" />
            </label>
          </div>
          <label className="checkbox-label">
            <input name="equipped" type="checkbox" /> Equipped
          </label>
          <label className="checkbox-label">
            <input name="magical" type="checkbox" /> Magical
          </label>
          <label>
            Notes
            <textarea maxLength={5000} name="notes" rows={2} />
          </label>
        </SaveForm>
      </Section>

      <Section title="Spellcasting, spells, and daily slots">
        <div className="entry-list">
          {data.spellcasting.map((entry) => (
            <article className="entry-card" key={stringValue(entry, "id")}>
              <strong>{stringValue(entry, "class_name")}</strong>
              <p className="muted">
                Caster level {numberValue(entry, "caster_level")} ·{" "}
                {abilityLabels[abilityValue(entry.casting_ability)]} · DC{" "}
                {calculated.spellcasting.find((spell) => spell.id === entry.id)
                  ?.spell_dc_for_level_0 ?? "—"} + spell level
              </p>
              <DeleteRecord
                characterId={characterId}
                recordId={stringValue(entry, "id")}
                section="spellcasting"
              />
            </article>
          ))}
        </div>
        <SaveForm characterId={characterId} section="spellcasting">
          <div className="form-grid">
            <label>
              Spellcasting class
              <input maxLength={120} name="class_name" required />
            </label>
            <label>
              Caster level
              <input defaultValue={1} max={40} min={1} name="caster_level" type="number" />
            </label>
            <label>
              Casting ability
              <select name="casting_ability">
                {abilityNames.map((ability) => (
                  <option key={ability} value={ability}>
                    {abilityLabels[ability]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Spell DC misc.
              <input defaultValue={0} max={100} min={-100} name="spell_dc_misc" type="number" />
            </label>
            <label>
              Casting model
              <select name="casting_model">
                <option value="prepared">Prepared</option>
                <option value="spontaneous">Spontaneous</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
        </SaveForm>
        {data.spellcasting.length ? (
          <>
            <RecordList characterId={characterId} records={data.spells} section="spell">
              {(row) => (
                <>
                  <strong>{stringValue(row, "name")}</strong>
                  <p className="muted">
                    Level {numberValue(row, "spell_level")}
                    {stringValue(row, "school") ? ` · ${stringValue(row, "school")}` : ""}
                    {booleanValue(row, "prepared") ? " · prepared" : ""}
                    {booleanValue(row, "known") ? " · known" : ""}
                  </p>
                </>
              )}
            </RecordList>
            <SaveForm characterId={characterId} section="spell">
              <div className="form-grid">
                <label>
                  Casting class
                  <select name="spellcasting_id" required>
                    {data.spellcasting.map((entry) => (
                      <option key={stringValue(entry, "id")} value={stringValue(entry, "id")}>
                        {stringValue(entry, "class_name")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Spell name
                  <input maxLength={160} name="name" required />
                </label>
                <label>
                  Spell level
                  <input max={9} min={0} name="spell_level" required type="number" />
                </label>
                <label>
                  School
                  <input maxLength={120} name="school" />
                </label>
              </div>
              <label>
                Description
                <textarea maxLength={10000} name="description" rows={3} />
              </label>
              <label className="checkbox-label">
                <input name="prepared" type="checkbox" /> Prepared
              </label>
              <label className="checkbox-label">
                <input name="known" type="checkbox" /> Known
              </label>
            </SaveForm>
            <RecordList characterId={characterId} records={data.slots} section="spell_slot">
              {(row) => (
                <>
                  <strong>Level {numberValue(row, "spell_level")}</strong>{" "}
                  {numberValue(row, "used_slots")}/{numberValue(row, "total_slots")} used
                </>
              )}
            </RecordList>
            <SaveForm characterId={characterId} section="spell_slot">
              <div className="form-grid">
                <label>
                  Casting class
                  <select name="spellcasting_id" required>
                    {data.spellcasting.map((entry) => (
                      <option key={stringValue(entry, "id")} value={stringValue(entry, "id")}>
                        {stringValue(entry, "class_name")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Spell level
                  <input max={9} min={0} name="spell_level" required type="number" />
                </label>
                <label>
                  Total slots
                  <input defaultValue={0} max={100} min={0} name="total_slots" type="number" />
                </label>
                <label>
                  Used slots
                  <input defaultValue={0} max={100} min={0} name="used_slots" type="number" />
                </label>
              </div>
              <label>
                Notes
                <input maxLength={2000} name="notes" />
              </label>
            </SaveForm>
          </>
        ) : (
          <p className="notice">Add a spellcasting class before entering spells or slots.</p>
        )}
      </Section>

      <Section title="Campaign relationships">
        <RecordList
          characterId={characterId}
          records={data.relationships}
          section="relationship"
        >
          {(row) => {
            const type = stringValue(row, "entity_type") as (typeof entityTypes)[number];
            const foreignKey = `${type}_id`;
            const entity = data.relatedEntities[type]?.find(
              (option) => option.id === row[foreignKey],
            );
            return (
              <>
                <strong>{stringValue(row, "relationship_type")}</strong>
                {entity ? ` · ${stringValue(entity, "name")}` : ""}
                {stringValue(row, "notes") ? (
                  <p className="entry-content">{stringValue(row, "notes")}</p>
                ) : null}
              </>
            );
          }}
        </RecordList>
        <SaveForm characterId={characterId} section="relationship">
          <div className="form-grid">
            <label>
              Campaign entity
              <select name="entity_id" required>
                {entityTypes.map((type) => (
                  <optgroup key={type} label={type}>
                    {data.relatedEntities[type].map((entity) => (
                      <option
                        key={`${type}-${entity.id}`}
                        value={`${type}:${stringValue(entity, "id")}`}
                      >
                        {stringValue(entity, "name")}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label>
              Relationship
              <input maxLength={120} name="relationship_type" placeholder="ally, rival, owes a favor…" required />
            </label>
          </div>
          <label>
            Notes
            <textarea maxLength={10000} name="notes" rows={2} />
          </label>
          {!entityTypes.some((type) => data.relatedEntities[type].length > 0) ? (
            <p className="muted">
              Relationships can be added after campaign entities are visible to players.
            </p>
          ) : null}
        </SaveForm>
      </Section>

      <Section title="Character history">
        <RecordList
          canDelete={false}
          characterId={characterId}
          records={data.history}
          section="history"
        >
          {(row) => (
            <>
              <p className="eyebrow">
                {stringValue(row, "campaign_date") || "Campaign history"} ·{" "}
                {stringValue(row, "event_type")}
              </p>
              <strong>{stringValue(row, "title")}</strong>
              {stringValue(row, "description") ? (
                <p className="entry-content">{stringValue(row, "description")}</p>
              ) : null}
            </>
          )}
        </RecordList>
        <SaveForm characterId={characterId} section="history">
          <div className="form-grid">
            <label>
              Event type
              <input maxLength={80} name="event_type" placeholder="level, milestone, relationship…" required />
            </label>
            <label>
              Campaign date
              <input maxLength={120} name="campaign_date" />
            </label>
            <label>
              Title
              <input maxLength={200} name="title" required />
            </label>
          </div>
          <label>
            Description
            <textarea maxLength={10000} name="description" rows={3} />
          </label>
          <p className="muted">
            New history entries are visible to you and your GM.
          </p>
        </SaveForm>
      </Section>
    </div>
  );
}

function RecordList({
  characterId,
  records,
  section,
  canDelete = true,
  children,
}: {
  characterId: string;
  records: WorkspaceRow[];
  section: string;
  canDelete?: boolean;
  children: (row: WorkspaceRow) => React.ReactNode;
}) {
  if (!records.length) {
    return <p className="muted">No records yet.</p>;
  }
  return (
    <div className="entry-list">
      {records.map((row, index) => {
        const id = stringValue(row, "id");
        return (
          <article className="entry-card" key={id || `${section}-${index}`}>
            {children(row)}
            {id && canDelete ? (
              <DeleteRecord
                characterId={characterId}
                recordId={id}
                section={section}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
