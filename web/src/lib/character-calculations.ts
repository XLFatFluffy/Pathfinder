export type AbilityName = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type AbilityScoreInput = {
  ability: AbilityName;
  base_score: number | null;
  permanent_modifier: number;
  temporary_modifier: number;
};

export type SkillInput = {
  id: string;
  name: string;
  key_ability: AbilityName;
  ranks: number;
  class_skill: boolean;
  armor_check_penalty: boolean;
  misc_modifier: number;
};

export type SavingThrowInput = {
  save_type: "fortitude" | "reflex" | "will";
  base_bonus: number;
  resistance_bonus: number;
  misc_modifier: number;
};

export type CombatInput = {
  current_hp: number;
  max_hp: number;
  temporary_hp: number;
  nonlethal_damage: number;
  armor_bonus: number;
  shield_bonus: number;
  natural_armor_bonus: number;
  deflection_bonus: number;
  dodge_bonus: number;
  misc_ac_bonus: number;
  base_attack_bonus: number;
  initiative_misc: number;
  cmb_misc: number;
  cmd_misc: number;
};

export type AttackInput = {
  id: string;
  name: string;
  attack_type: string;
  key_ability: AbilityName;
  damage_ability: AbilityName | "none";
  attack_bonus: number;
  damage_bonus: number;
  enhancement: number;
  damage: string;
};

export type SpellcastingInput = {
  id: string;
  class_name: string;
  caster_level: number;
  casting_ability: AbilityName;
  spell_dc_misc: number;
};

export type CharacterCalculationInput = {
  abilityScores: AbilityScoreInput[];
  skills: SkillInput[];
  savingThrows: SavingThrowInput[];
  combat: CombatInput;
  attacks: AttackInput[];
  spellcasting: SpellcastingInput[];
  armorCheckPenalty: number;
};

export type CalculatedAbilityScore = {
  score: number | null;
  modifier: number | null;
};

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function spellDifficultyClass(
  spellLevel: number,
  castingAbilityModifier: number,
  miscModifier: number,
): number {
  return 10 + spellLevel + castingAbilityModifier + miscModifier;
}

export function calculateCharacter(input: CharacterCalculationInput) {
  const abilities = {} as Record<AbilityName, CalculatedAbilityScore>;
  for (const ability of ["str", "dex", "con", "int", "wis", "cha"] as const) {
    const source = input.abilityScores.find((entry) => entry.ability === ability);
    const score =
      source?.base_score == null
        ? null
        : source.base_score +
          source.permanent_modifier +
          source.temporary_modifier;
    abilities[ability] = {
      score,
      modifier: score === null ? null : abilityModifier(score),
    };
  }

  const skills = input.skills.map((skill) => {
    const ability = abilities[skill.key_ability].modifier ?? 0;
    const classSkillBonus = skill.class_skill && skill.ranks > 0 ? 3 : 0;
    const armorPenalty = skill.armor_check_penalty
      ? input.armorCheckPenalty
      : 0;
    return {
      ...skill,
      ability_modifier: ability,
      class_skill_bonus: classSkillBonus,
      armor_check_penalty_value: armorPenalty,
      total:
        skill.ranks +
        ability +
        classSkillBonus +
        armorPenalty +
        skill.misc_modifier,
    };
  });

  const savingThrows = input.savingThrows.map((savingThrow) => {
    const ability =
      savingThrow.save_type === "fortitude"
        ? "con"
        : savingThrow.save_type === "reflex"
          ? "dex"
          : "wis";
    const abilityModifierValue = abilities[ability].modifier ?? 0;
    return {
      ...savingThrow,
      ability_modifier: abilityModifierValue,
      total:
        savingThrow.base_bonus +
        abilityModifierValue +
        savingThrow.resistance_bonus +
        savingThrow.misc_modifier,
    };
  });

  const strength = abilities.str.modifier ?? 0;
  const dexterity = abilities.dex.modifier ?? 0;
  const combat = {
    ...input.combat,
    armor_class:
      10 +
      dexterity +
      input.combat.armor_bonus +
      input.combat.shield_bonus +
      input.combat.natural_armor_bonus +
      input.combat.deflection_bonus +
      input.combat.dodge_bonus +
      input.combat.misc_ac_bonus,
    touch_armor_class:
      10 +
      dexterity +
      input.combat.deflection_bonus +
      input.combat.dodge_bonus +
      input.combat.misc_ac_bonus,
    flat_footed_armor_class:
      10 +
      input.combat.armor_bonus +
      input.combat.shield_bonus +
      input.combat.natural_armor_bonus +
      input.combat.deflection_bonus +
      input.combat.misc_ac_bonus,
    initiative: dexterity + input.combat.initiative_misc,
    cmb: input.combat.base_attack_bonus + strength + input.combat.cmb_misc,
    cmd:
      10 +
      input.combat.base_attack_bonus +
      strength +
      dexterity +
      input.combat.cmd_misc,
  };

  const attacks = input.attacks.map((attack) => ({
    ...attack,
    total_attack_bonus:
      input.combat.base_attack_bonus +
      (abilities[attack.key_ability].modifier ?? 0) +
      attack.attack_bonus +
      attack.enhancement,
    damage_modifier:
      attack.damage_bonus +
      attack.enhancement +
      (attack.damage_ability === "none"
        ? 0
        : (abilities[attack.damage_ability].modifier ?? 0)),
  }));

  const spellcasting = input.spellcasting.map((entry) => {
    const modifier = abilities[entry.casting_ability].modifier ?? 0;
    return {
      ...entry,
      casting_ability_modifier: modifier,
      spell_dc_for_level_0: spellDifficultyClass(
        0,
        modifier,
        entry.spell_dc_misc,
      ),
    };
  });

  return { abilities, skills, savingThrows, combat, attacks, spellcasting };
}
