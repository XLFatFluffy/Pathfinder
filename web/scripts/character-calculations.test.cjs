const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "../src/lib/character-calculations.ts");
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});
const calculationModule = new Module(sourcePath, module);
calculationModule.filename = sourcePath;
calculationModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
calculationModule._compile(compiled.outputText, sourcePath);

const { abilityModifier, calculateCharacter, spellDifficultyClass } =
  calculationModule.exports;

test("ability modifiers round down for odd and negative scores", () => {
  assert.equal(abilityModifier(18), 4);
  assert.equal(abilityModifier(11), 0);
  assert.equal(abilityModifier(9), -1);
  assert.equal(abilityModifier(1), -5);
});

test("character calculations combine ability, skill, save, combat, and spell data", () => {
  const result = calculateCharacter({
    abilityScores: [
      { ability: "str", base_score: 16, permanent_modifier: 2, temporary_modifier: 0 },
      { ability: "dex", base_score: 15, permanent_modifier: -1, temporary_modifier: 0 },
      { ability: "con", base_score: 12, permanent_modifier: 0, temporary_modifier: 0 },
      { ability: "int", base_score: 10, permanent_modifier: 0, temporary_modifier: 0 },
      { ability: "wis", base_score: 16, permanent_modifier: 0, temporary_modifier: 0 },
      { ability: "cha", base_score: 8, permanent_modifier: 0, temporary_modifier: 0 },
    ],
    skills: [
      {
        id: "perception",
        name: "Perception",
        key_ability: "wis",
        ranks: 5,
        class_skill: true,
        armor_check_penalty: false,
        misc_modifier: 0,
      },
      {
        id: "stealth",
        name: "Stealth",
        key_ability: "dex",
        ranks: 2,
        class_skill: true,
        armor_check_penalty: true,
        misc_modifier: 1,
      },
      {
        id: "untrained",
        name: "Untrained class skill",
        key_ability: "con",
        ranks: 0,
        class_skill: true,
        armor_check_penalty: false,
        misc_modifier: 0,
      },
    ],
    savingThrows: [
      { save_type: "fortitude", base_bonus: 5, resistance_bonus: 1, misc_modifier: 0 },
      { save_type: "reflex", base_bonus: 2, resistance_bonus: 0, misc_modifier: 0 },
      { save_type: "will", base_bonus: 6, resistance_bonus: 0, misc_modifier: 0 },
    ],
    combat: {
      current_hp: 22,
      max_hp: 28,
      temporary_hp: 0,
      nonlethal_damage: 0,
      armor_bonus: 4,
      shield_bonus: 1,
      natural_armor_bonus: 2,
      deflection_bonus: 1,
      dodge_bonus: 1,
      misc_ac_bonus: 0,
      base_attack_bonus: 5,
      initiative_misc: 1,
      cmb_misc: 0,
      cmd_misc: 1,
    },
    attacks: [
      {
        id: "longsword",
        name: "Longsword",
        attack_type: "melee",
        key_ability: "str",
        damage_ability: "str",
        attack_bonus: 1,
        damage_bonus: 1,
        enhancement: 2,
        damage: "1d8",
      },
    ],
    spellcasting: [
      {
        id: "cleric",
        class_name: "Cleric",
        caster_level: 5,
        casting_ability: "wis",
        spell_dc_misc: 1,
      },
    ],
    armorCheckPenalty: -2,
  });

  assert.equal(result.abilities.str.score, 18);
  assert.equal(result.abilities.str.modifier, 4);
  assert.equal(result.skills[0].total, 11);
  assert.equal(result.skills[1].total, 6);
  assert.equal(result.skills[2].total, 1);
  assert.deepEqual(
    result.savingThrows.map((savingThrow) => savingThrow.total),
    [7, 4, 9],
  );
  assert.equal(result.combat.armor_class, 21);
  assert.equal(result.combat.touch_armor_class, 14);
  assert.equal(result.combat.flat_footed_armor_class, 18);
  assert.equal(result.combat.initiative, 3);
  assert.equal(result.combat.cmb, 9);
  assert.equal(result.combat.cmd, 22);
  assert.equal(result.attacks[0].total_attack_bonus, 12);
  assert.equal(result.attacks[0].damage_modifier, 7);
  assert.equal(result.spellcasting[0].spell_dc_for_level_0, 14);
  assert.equal(spellDifficultyClass(2, 3, 1), 16);
});
