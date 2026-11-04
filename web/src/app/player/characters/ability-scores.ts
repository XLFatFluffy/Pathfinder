export function getAbilityModifier(score: number | null): number | null {
  if (score === null) {
    return null;
  }
  return Math.floor((score - 10) / 2);
}

export function formatAbilityModifier(score: number | null): string {
  const modifier = getAbilityModifier(score);
  if (modifier === null) {
    return "—";
  }
  return modifier > 0 ? `+${modifier}` : String(modifier);
}
