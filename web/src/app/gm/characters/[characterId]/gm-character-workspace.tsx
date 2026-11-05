import {
  calculateCharacter,
  type AbilityName,
  type CharacterCalculationInput,
} from "@/lib/character-calculations";
import type {
  CharacterWorkspaceData,
  WorkspaceRow,
} from "@/app/player/characters/[characterId]/workspace";

type Character = {
  id: string;
  name: string;
  ancestry: string;
  class_name: string;
  level: number;
};

const abilities = ["str", "dex", "con", "int", "wis", "cha"] as const;
const labels: Record<AbilityName, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

function stringValue(row: WorkspaceRow | null | undefined, field: string) {
  const value = row?.[field];
  return typeof value === "string" ? value : "";
}

function numberValue(
  row: WorkspaceRow | null | undefined,
  field: string,
  fallback = 0,
) {
  const value = row?.[field];
  return typeof value === "number" ? value : fallback;
}

function abilityValue(value: unknown): AbilityName {
  return abilities.includes(value as AbilityName) ? (value as AbilityName) : "str";
}

export default function GmCharacterWorkspace({
  character,
  data,
}: {
  character: Character;
  data: CharacterWorkspaceData;
}) {
  const abilityRows = new Map(
    data.abilities.map((row) => [stringValue(row, "ability"), row]),
  );
  const combat = data.combat;
  const input: CharacterCalculationInput = {
    abilityScores: abilities.map((ability) => {
      const row = abilityRows.get(ability);
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
      class_skill: row.class_skill === true,
      armor_check_penalty: row.armor_check_penalty === true,
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
  const calculated = calculateCharacter(input);

  return (
    <div className="character-workspace">
      <section className="entry-card">
        <p className="eyebrow">
          {[character.ancestry, character.class_name, `Level ${character.level}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <h3>Calculated Pathfinder totals</h3>
        <div className="character-stat-grid">
          <p>
            <strong>HP</strong> {calculated.combat.current_hp}/
            {calculated.combat.max_hp}
          </p>
          <p>
            <strong>AC</strong> {calculated.combat.armor_class} (touch{" "}
            {calculated.combat.touch_armor_class}, flat-footed{" "}
            {calculated.combat.flat_footed_armor_class})
          </p>
          <p>
            <strong>Initiative</strong> {calculated.combat.initiative}
          </p>
          <p>
            <strong>CMB / CMD</strong> {calculated.combat.cmb} /{" "}
            {calculated.combat.cmd}
          </p>
          {abilities.map((ability) => (
            <p key={ability}>
              <strong>{ability.toUpperCase()}</strong>{" "}
              {calculated.abilities[ability].score ?? "—"} (
              {calculated.abilities[ability].modifier ?? "—"})
            </p>
          ))}
        </div>
        <p>
          <strong>Saves:</strong>{" "}
          {calculated.savingThrows
            .map(
              (save) =>
                `${save.save_type} ${save.total >= 0 ? "+" : ""}${save.total}`,
            )
            .join(" · ") || "No structured saves"}
        </p>
      </section>

      <ReadOnlySection title="Identity and GM-known biography">
        {data.identity
          ? (
              <>
                {(
                  [
                    ["age", "Age"],
                    ["gender", "Gender"],
                    ["height", "Height"],
                    ["weight", "Weight"],
                    ["eyes", "Eyes"],
                    ["hair", "Hair"],
                    ["skin", "Skin"],
                    ["homeland", "Homeland"],
                    ["deity", "Deity"],
                    ["religion", "Religion"],
                    ["languages", "Languages"],
                    ["appearance", "Appearance"],
                    ["biography", "Biography"],
                    ["personality", "Personality"],
                    ["goals", "Goals"],
                    ["bonds", "Bonds"],
                    ["fears", "Fears"],
                    ["secrets", "Secrets"],
                  ] as const
                ).map(([field, label]) => {
                  const value = stringValue(data.identity, field);
                  return value ? (
                    <p className="entry-content" key={field}>
                      <strong>{label}:</strong> {value}
                    </p>
                  ) : null;
                })}
              </>
            )
          : <p className="muted">No structured identity details.</p>}
      </ReadOnlySection>

      <ReadOnlySection title="Classes">
        <ul>
          {data.classes.map((row) => (
            <li key={stringValue(row, "id")}>
              {stringValue(row, "class_name")} {numberValue(row, "level")}
              {stringValue(row, "archetype")
                ? ` · ${stringValue(row, "archetype")}`
                : ""}
              {stringValue(row, "notes")
                ? ` — ${stringValue(row, "notes")}`
                : ""}
            </li>
          ))}
        </ul>
        <h4>Level history</h4>
        <ul>
          {data.levelHistory.map((row) => (
            <li key={stringValue(row, "id")}>
              {stringValue(row, "campaign_date")}:{" "}
              {stringValue(
                data.classes.find((entry) => entry.id === row.class_id),
                "class_name",
              )}{" "}
              <strong>{numberValue(row, "level")}</strong>{" "}
              {stringValue(row, "description")}
            </li>
          ))}
        </ul>
      </ReadOnlySection>

      <ReadOnlySection title="Skills">
        <ul>
          {calculated.skills.map((skill) => (
            <li key={skill.id}>
              {skill.name}: {skill.total >= 0 ? "+" : ""}
              {skill.total} ({labels[skill.key_ability]}; {skill.ranks} ranks)
            </li>
          ))}
        </ul>
      </ReadOnlySection>

      <ReadOnlySection title="Attacks">
        <ul>
          {calculated.attacks.map((attack) => (
            <li key={attack.id}>
              {attack.name}: {attack.total_attack_bonus >= 0 ? "+" : ""}
              {attack.total_attack_bonus}; {attack.damage}
              {attack.damage_modifier
                ? ` ${attack.damage_modifier > 0 ? "+" : ""}${attack.damage_modifier}`
                : ""}
            </li>
          ))}
        </ul>
      </ReadOnlySection>

      <ReadOnlySection title="Feats and features">
        <ul>
          {data.features.map((row) => (
            <li key={stringValue(row, "id")}>
              <strong>{stringValue(row, "name")}</strong> —{" "}
              {stringValue(row, "description")}
            </li>
          ))}
        </ul>
      </ReadOnlySection>

      <ReadOnlySection title="Equipment">
        <ul>
          {data.equipment.map((row) => (
            <li key={stringValue(row, "id")}>
              {stringValue(row, "name")} ×{numberValue(row, "quantity")}
              {row.equipped === true ? " (equipped)" : ""}
              {` · ${numberValue(row, "weight")} lb · ${numberValue(row, "value_gp")} gp`}
            </li>
          ))}
        </ul>
      </ReadOnlySection>

      <ReadOnlySection title="Spellcasting and spells">
        {data.spellcasting.map((entry) => (
          <div className="entry-card" key={stringValue(entry, "id")}>
            <strong>{stringValue(entry, "class_name")}</strong>
            {` · caster level ${numberValue(entry, "caster_level")}`}
            {data.spells
              .filter((spell) => spell.spellcasting_id === entry.id)
              .map((spell) => (
                <p key={stringValue(spell, "id")}>
                  Level {numberValue(spell, "spell_level")}:{" "}
                  {stringValue(spell, "name")}{" "}
                  {stringValue(spell, "description")}
                </p>
              ))}
          </div>
        ))}
        <ul>
          {data.slots.map((slot) => (
            <li key={`${slot.spellcasting_id}-${slot.spell_level}`}>
              Spell level {numberValue(slot, "spell_level")}:{" "}
              {numberValue(slot, "used_slots")}/{numberValue(slot, "total_slots")} slots used
            </li>
          ))}
        </ul>
      </ReadOnlySection>

      <ReadOnlySection title="Campaign relationships">
        <ul>
          {data.relationships.map((row) => (
            <li key={stringValue(row, "id")}>
              {stringValue(row, "relationship_type")} ({stringValue(row, "entity_type")})
              {stringValue(row, "notes") ? ` — ${stringValue(row, "notes")}` : ""}
            </li>
          ))}
        </ul>
      </ReadOnlySection>

      <ReadOnlySection title="Character history">
        <ul>
          {data.history.map((row) => (
            <li key={stringValue(row, "id")}>
              {stringValue(row, "campaign_date")}:{" "}
              <strong>{stringValue(row, "title")}</strong>
              {stringValue(row, "description")
                ? ` — ${stringValue(row, "description")}`
                : ""}
            </li>
          ))}
        </ul>
      </ReadOnlySection>
    </div>
  );
}

function ReadOnlySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="entry-edit">
      <summary>{title}</summary>
      <div className="entry-content">{children}</div>
    </details>
  );
}
