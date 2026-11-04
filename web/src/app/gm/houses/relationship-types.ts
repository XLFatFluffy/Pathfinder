export const houseRelationshipTypes = [
  "allied",
  "friendly",
  "neutral",
  "hostile",
  "rival",
  "enemy",
  "vassal",
  "overlord",
  "at_war",
  "marriage_alliance",
  "blood_relation",
] as const;

export function isHouseRelationshipType(
  value: string,
): value is (typeof houseRelationshipTypes)[number] {
  return houseRelationshipTypes.some((type) => type === value);
}

export function formatHouseRelationshipType(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
