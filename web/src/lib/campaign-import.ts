export const campaignImportFormat = "pathfinder-campaign-import";
export const campaignImportVersion = 1;
export const campaignImportMaxBytes = 500_000;

export const campaignImportTypes = [
  "locations",
  "npcs",
  "houses",
  "house_relationships",
  "factions",
  "quests",
  "sessions",
  "journal_entries",
] as const;

export type CampaignImportType = (typeof campaignImportTypes)[number];
export type CampaignCanonStatus =
  | "PROPOSED"
  | "APPROVED"
  | "ESTABLISHED"
  | "REJECTED"
  | "REVISED"
  | "UNRESOLVED";
export type CampaignImportVisibility = "GM_ONLY" | "PLAYER_SHARED";
export type CampaignKnowledgeType =
  | "fact"
  | "rumor"
  | "belief"
  | "discovery"
  | "gm_truth"
  | "proposal";

type ImportMetadata = {
  key: string;
  canon_status: CampaignCanonStatus;
  visibility: CampaignImportVisibility;
  knowledge_type: CampaignKnowledgeType;
  provenance: string;
};

export type CampaignLocationImport = ImportMetadata & {
  name: string;
  location_type: string;
  description: string;
  gm_notes: string;
  parent_key: string;
};

export type CampaignNpcImport = ImportMetadata & {
  name: string;
  race: string;
  age: string;
  gender: string;
  occupation: string;
  titles: string;
  description: string;
  status: string;
  gm_notes: string;
  status_date: string;
  status_reason: string;
  location_key: string;
};

export type CampaignHouseImport = ImportMetadata & {
  name: string;
  heraldry_description: string;
  motto: string;
  description: string;
  gm_details: {
    founding_history: string;
    current_ruler_key: string;
    ancestral_seat_key: string;
    holdings: string;
    succession: string;
    military_strength: string;
    wealth: string;
    resources: string;
    political_influence: string;
    religious_affiliations: string;
    objectives: string;
    secrets: string;
  };
};

export type CampaignFactionImport = ImportMetadata & {
  name: string;
  faction_type: string;
  description: string;
  leader_key: string;
  headquarters_key: string;
  gm_details: {
    objectives: string;
    resources: string;
    influence: string;
    membership: string;
    allies_and_rivals: string;
    current_activities: string;
    history: string;
    secrets: string;
  };
};

export type CampaignQuestImport = ImportMetadata & {
  name: string;
  status: "undiscovered" | "active" | "completed" | "failed" | "rewarded" | "cancelled";
  summary: string;
  giver: string;
  location_key: string;
  gm_notes: string;
};

export type CampaignSessionImport = ImportMetadata & {
  session_number: number;
  campaign_date: string;
  summary: string;
  gm_notes: string;
};

export type CampaignJournalImport = ImportMetadata & {
  title: string;
  content: string;
  campaign_date: string;
};

export type CampaignHouseRelationshipImport = ImportMetadata & {
  house_key: string;
  related_house_key: string;
  relationship_type:
    | "allied"
    | "friendly"
    | "neutral"
    | "hostile"
    | "rival"
    | "enemy"
    | "vassal"
    | "overlord"
    | "at_war"
    | "marriage_alliance"
    | "blood_relation";
  description: string;
  gm_notes: string;
  campaign_date: string;
  reason: string;
};

export type CampaignImportBundle = {
  format: typeof campaignImportFormat;
  version: typeof campaignImportVersion;
  title: string;
  records: {
    locations: CampaignLocationImport[];
    npcs: CampaignNpcImport[];
    houses: CampaignHouseImport[];
    house_relationships: CampaignHouseRelationshipImport[];
    factions: CampaignFactionImport[];
    quests: CampaignQuestImport[];
    sessions: CampaignSessionImport[];
    journal_entries: CampaignJournalImport[];
  };
};

export type CampaignImportIssue = {
  path: string;
  message: string;
};

const canonStatuses: CampaignCanonStatus[] = [
  "PROPOSED",
  "APPROVED",
  "ESTABLISHED",
  "REJECTED",
  "REVISED",
  "UNRESOLVED",
];
const visibilities: CampaignImportVisibility[] = ["GM_ONLY", "PLAYER_SHARED"];
const knowledgeTypes: CampaignKnowledgeType[] = [
  "fact",
  "rumor",
  "belief",
  "discovery",
  "gm_truth",
  "proposal",
];
const relationshipTypes: CampaignHouseRelationshipImport["relationship_type"][] = [
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
];
const questStatuses: CampaignQuestImport["status"][] = [
  "undiscovered",
  "active",
  "completed",
  "failed",
  "rewarded",
  "cancelled",
];

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function checkKeys(
  value: JsonObject,
  allowed: readonly string[],
  path: string,
  issues: CampaignImportIssue[],
) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      issues.push({
        path: `${path}.${key}`,
        message: "This field is not supported by this import version; no data was imported.",
      });
    }
  }
}

function readObject(
  value: unknown,
  path: string,
  allowed: readonly string[],
  issues: CampaignImportIssue[],
): JsonObject {
  if (!isObject(value)) {
    issues.push({ path, message: "Expected an object." });
    return {};
  }
  checkKeys(value, allowed, path, issues);
  return value;
}

function readString(
  value: unknown,
  path: string,
  maximum: number,
  issues: CampaignImportIssue[],
  required = false,
): string {
  if (value === undefined && !required) {
    return "";
  }
  if (typeof value !== "string") {
    issues.push({
      path,
      message: required ? "A text value is required." : "Expected a text value.",
    });
    return "";
  }
  const result = value.trim();
  if (required && !result) {
    issues.push({ path, message: "A non-empty value is required." });
  }
  if (result.length > maximum) {
    issues.push({ path, message: `Must be no more than ${maximum} characters.` });
  }
  return result;
}

function readChoice<T extends string>(
  value: unknown,
  path: string,
  choices: readonly T[],
  issues: CampaignImportIssue[],
): T {
  if (typeof value === "string" && choices.includes(value as T)) {
    return value as T;
  }
  issues.push({ path, message: `Choose one of: ${choices.join(", ")}.` });
  return choices[0];
}

function readMetadata(
  item: JsonObject,
  path: string,
  issues: CampaignImportIssue[],
): ImportMetadata {
  const key = readString(item.key, `${path}.key`, 120, issues, true);
  if (key && !/^[a-z0-9][a-z0-9._-]*$/i.test(key)) {
    issues.push({
      path: `${path}.key`,
      message: "Use letters, numbers, periods, underscores, and hyphens; start with a letter or number.",
    });
  }
  const canonStatus = readChoice(
    item.canon_status,
    `${path}.canon_status`,
    canonStatuses,
    issues,
  );
  const visibility = readChoice(
    item.visibility,
    `${path}.visibility`,
    visibilities,
    issues,
  );
  const knowledgeType = readChoice(
    item.knowledge_type,
    `${path}.knowledge_type`,
    knowledgeTypes,
    issues,
  );
  const provenance = readString(
    item.provenance,
    `${path}.provenance`,
    1000,
    issues,
    true,
  );

  if (
    visibility === "PLAYER_SHARED" &&
    ["PROPOSED", "REJECTED", "UNRESOLVED"].includes(canonStatus)
  ) {
    issues.push({
      path: `${path}.visibility`,
      message: `${canonStatus} records must remain GM_ONLY.`,
    });
  }
  if (
    visibility === "PLAYER_SHARED" &&
    ["gm_truth", "proposal"].includes(knowledgeType)
  ) {
    issues.push({
      path: `${path}.visibility`,
      message: `${knowledgeType} records must remain GM_ONLY.`,
    });
  }

  return {
    key,
    canon_status: canonStatus,
    visibility,
    knowledge_type: knowledgeType,
    provenance,
  };
}

function readDetails(
  value: unknown,
  path: string,
  fields: Readonly<Record<string, number>>,
  issues: CampaignImportIssue[],
): Record<string, string> {
  const item = readObject(value ?? {}, path, Object.keys(fields), issues);
  return Object.fromEntries(
    Object.entries(fields).map(([field, maximum]) => [
      field,
      readString(item[field], `${path}.${field}`, maximum, issues),
    ]),
  );
}

function readRecords<T>(
  records: JsonObject,
  type: CampaignImportType,
  allowed: readonly string[],
  issues: CampaignImportIssue[],
  parse: (item: JsonObject, path: string) => T,
): T[] {
  const value = records[type];
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    issues.push({ path: `records.${type}`, message: "Expected a list of records." });
    return [];
  }
  if (value.length > 500) {
    issues.push({
      path: `records.${type}`,
      message: "Import at most 500 records of each type at a time.",
    });
  }
  return value.map((entry, index) => {
    const path = `records.${type}[${index}]`;
    return parse(readObject(entry, path, allowed, issues), path);
  });
}

export function parseCampaignImport(
  raw: string,
): { bundle?: CampaignImportBundle; issues: CampaignImportIssue[] } {
  const issues: CampaignImportIssue[] = [];
  if (new TextEncoder().encode(raw).byteLength > campaignImportMaxBytes) {
    return {
      issues: [
        {
          path: "$",
          message: `Import files must be ${campaignImportMaxBytes.toLocaleString()} bytes or smaller.`,
        },
      ],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { issues: [{ path: "$", message: "The file is not valid JSON." }] };
  }

  const root = readObject(
    parsed,
    "$",
    ["format", "version", "title", "records"],
    issues,
  );
  if (root.format !== campaignImportFormat) {
    issues.push({
      path: "$.format",
      message: `Expected "${campaignImportFormat}".`,
    });
  }
  if (root.version !== campaignImportVersion) {
    issues.push({
      path: "$.version",
      message: `Only import version ${campaignImportVersion} is supported.`,
    });
  }
  const title = readString(root.title, "$.title", 160, issues, true);
  const recordKeys = campaignImportTypes;
  const records = readObject(root.records, "$.records", recordKeys, issues);

  const locations = readRecords(
    records,
    "locations",
    [
      "key", "canon_status", "visibility", "knowledge_type", "provenance",
      "name", "location_type", "description", "gm_notes", "parent_key",
    ],
    issues,
    (item, path): CampaignLocationImport => ({
      ...readMetadata(item, path, issues),
      name: readString(item.name, `${path}.name`, 160, issues, true),
      location_type: readString(item.location_type, `${path}.location_type`, 80, issues),
      description: readString(item.description, `${path}.description`, 20000, issues),
      gm_notes: readString(item.gm_notes, `${path}.gm_notes`, 20000, issues),
      parent_key: readString(item.parent_key, `${path}.parent_key`, 120, issues),
    }),
  );
  const npcs = readRecords(
    records,
    "npcs",
    [
      "key", "canon_status", "visibility", "knowledge_type", "provenance",
      "name", "race", "age", "gender", "occupation", "titles", "description",
      "status", "gm_notes", "status_date", "status_reason", "location_key",
    ],
    issues,
    (item, path): CampaignNpcImport => ({
      ...readMetadata(item, path, issues),
      name: readString(item.name, `${path}.name`, 160, issues, true),
      race: readString(item.race, `${path}.race`, 80, issues),
      age: readString(item.age, `${path}.age`, 80, issues),
      gender: readString(item.gender, `${path}.gender`, 80, issues),
      occupation: readString(item.occupation, `${path}.occupation`, 120, issues),
      titles: readString(item.titles, `${path}.titles`, 2000, issues),
      description: readString(item.description, `${path}.description`, 20000, issues),
      status: readString(item.status ?? "Alive", `${path}.status`, 80, issues, true),
      gm_notes: readString(item.gm_notes, `${path}.gm_notes`, 20000, issues),
      status_date: readString(item.status_date, `${path}.status_date`, 120, issues),
      status_reason: readString(item.status_reason, `${path}.status_reason`, 2000, issues),
      location_key: readString(item.location_key, `${path}.location_key`, 120, issues),
    }),
  );
  const houses = readRecords(
    records,
    "houses",
    [
      "key", "canon_status", "visibility", "knowledge_type", "provenance",
      "name", "heraldry_description", "motto", "description", "gm_details",
    ],
    issues,
    (item, path): CampaignHouseImport => {
      const details = readObject(
        item.gm_details ?? {},
        `${path}.gm_details`,
        [
          "founding_history", "current_ruler_key", "ancestral_seat_key", "holdings",
          "succession", "military_strength", "wealth", "resources",
          "political_influence", "religious_affiliations", "objectives", "secrets",
        ],
        issues,
      );
      return {
        ...readMetadata(item, path, issues),
        name: readString(item.name, `${path}.name`, 160, issues, true),
        heraldry_description: readString(item.heraldry_description, `${path}.heraldry_description`, 2000, issues),
        motto: readString(item.motto, `${path}.motto`, 500, issues),
        description: readString(item.description, `${path}.description`, 20000, issues),
        gm_details: {
          founding_history: readString(details.founding_history, `${path}.gm_details.founding_history`, 20000, issues),
          current_ruler_key: readString(details.current_ruler_key, `${path}.gm_details.current_ruler_key`, 120, issues),
          ancestral_seat_key: readString(details.ancestral_seat_key, `${path}.gm_details.ancestral_seat_key`, 120, issues),
          holdings: readString(details.holdings, `${path}.gm_details.holdings`, 10000, issues),
          succession: readString(details.succession, `${path}.gm_details.succession`, 10000, issues),
          military_strength: readString(details.military_strength, `${path}.gm_details.military_strength`, 4000, issues),
          wealth: readString(details.wealth, `${path}.gm_details.wealth`, 4000, issues),
          resources: readString(details.resources, `${path}.gm_details.resources`, 10000, issues),
          political_influence: readString(details.political_influence, `${path}.gm_details.political_influence`, 4000, issues),
          religious_affiliations: readString(details.religious_affiliations, `${path}.gm_details.religious_affiliations`, 4000, issues),
          objectives: readString(details.objectives, `${path}.gm_details.objectives`, 10000, issues),
          secrets: readString(details.secrets, `${path}.gm_details.secrets`, 20000, issues),
        },
      };
    },
  );
  const houseRelationships = readRecords(
    records,
    "house_relationships",
    [
      "key", "canon_status", "visibility", "knowledge_type", "provenance",
      "house_key", "related_house_key", "relationship_type", "description",
      "gm_notes", "campaign_date", "reason",
    ],
    issues,
    (item, path): CampaignHouseRelationshipImport => ({
      ...readMetadata(item, path, issues),
      house_key: readString(item.house_key, `${path}.house_key`, 120, issues, true),
      related_house_key: readString(item.related_house_key, `${path}.related_house_key`, 120, issues, true),
      relationship_type: readChoice(item.relationship_type, `${path}.relationship_type`, relationshipTypes, issues),
      description: readString(item.description, `${path}.description`, 10000, issues),
      gm_notes: readString(item.gm_notes, `${path}.gm_notes`, 20000, issues),
      campaign_date: readString(item.campaign_date, `${path}.campaign_date`, 120, issues),
      reason: readString(item.reason, `${path}.reason`, 4000, issues),
    }),
  );
  const factions = readRecords(
    records,
    "factions",
    [
      "key", "canon_status", "visibility", "knowledge_type", "provenance",
      "name", "faction_type", "description", "leader_key", "headquarters_key",
      "gm_details",
    ],
    issues,
    (item, path): CampaignFactionImport => {
      const details = readDetails(
        item.gm_details,
        `${path}.gm_details`,
        {
          objectives: 10000,
          resources: 10000,
          influence: 4000,
          membership: 10000,
          allies_and_rivals: 10000,
          current_activities: 10000,
          history: 20000,
          secrets: 20000,
        },
        issues,
      );
      return {
        ...readMetadata(item, path, issues),
        name: readString(item.name, `${path}.name`, 160, issues, true),
        faction_type: readString(item.faction_type, `${path}.faction_type`, 120, issues),
        description: readString(item.description, `${path}.description`, 20000, issues),
        leader_key: readString(item.leader_key, `${path}.leader_key`, 120, issues),
        headquarters_key: readString(item.headquarters_key, `${path}.headquarters_key`, 120, issues),
        gm_details: {
          objectives: details.objectives,
          resources: details.resources,
          influence: details.influence,
          membership: details.membership,
          allies_and_rivals: details.allies_and_rivals,
          current_activities: details.current_activities,
          history: details.history,
          secrets: details.secrets,
        },
      };
    },
  );
  const quests = readRecords(
    records,
    "quests",
    [
      "key", "canon_status", "visibility", "knowledge_type", "provenance",
      "name", "status", "summary", "giver", "location_key", "gm_notes",
    ],
    issues,
    (item, path): CampaignQuestImport => ({
      ...readMetadata(item, path, issues),
      name: readString(item.name, `${path}.name`, 160, issues, true),
      status: readChoice(item.status ?? "undiscovered", `${path}.status`, questStatuses, issues),
      summary: readString(item.summary, `${path}.summary`, 4000, issues),
      giver: readString(item.giver, `${path}.giver`, 4000, issues),
      location_key: readString(item.location_key, `${path}.location_key`, 120, issues),
      gm_notes: readString(item.gm_notes, `${path}.gm_notes`, 20000, issues),
    }),
  );
  const sessions = readRecords(
    records,
    "sessions",
    [
      "key", "canon_status", "visibility", "knowledge_type", "provenance",
      "session_number", "campaign_date", "summary", "gm_notes",
    ],
    issues,
    (item, path): CampaignSessionImport => {
      const number = item.session_number;
      if (!Number.isSafeInteger(number) || (number as number) < 1) {
        issues.push({
          path: `${path}.session_number`,
          message: "Enter a positive whole session number.",
        });
      }
      return {
        ...readMetadata(item, path, issues),
        session_number: Number.isSafeInteger(number) && (number as number) >= 1
          ? (number as number)
          : 1,
        campaign_date: readString(item.campaign_date, `${path}.campaign_date`, 120, issues),
        summary: readString(item.summary, `${path}.summary`, 50000, issues),
        gm_notes: readString(item.gm_notes, `${path}.gm_notes`, 20000, issues),
      };
    },
  );
  const journalEntries = readRecords(
    records,
    "journal_entries",
    [
      "key", "canon_status", "visibility", "knowledge_type", "provenance",
      "title", "content", "campaign_date",
    ],
    issues,
    (item, path): CampaignJournalImport => ({
      ...readMetadata(item, path, issues),
      title: readString(item.title, `${path}.title`, 200, issues, true),
      content: readString(item.content, `${path}.content`, 50000, issues),
      campaign_date: readString(item.campaign_date, `${path}.campaign_date`, 120, issues),
    }),
  );

  const allRecords: Array<{ type: CampaignImportType; record: ImportMetadata & { name?: string; title?: string } }> = [
    ...locations.map((record) => ({ type: "locations" as const, record })),
    ...npcs.map((record) => ({ type: "npcs" as const, record })),
    ...houses.map((record) => ({ type: "houses" as const, record })),
    ...houseRelationships.map((record) => ({ type: "house_relationships" as const, record })),
    ...factions.map((record) => ({ type: "factions" as const, record })),
    ...quests.map((record) => ({ type: "quests" as const, record })),
    ...sessions.map((record) => ({ type: "sessions" as const, record })),
    ...journalEntries.map((record) => ({ type: "journal_entries" as const, record })),
  ];
  const keys = new Set<string>();
  const sourceKeys = new Set<string>();
  const namesByType = new Map<string, Set<string>>();
  for (const { type, record } of allRecords) {
    const typedKey = `${type}:${record.key}`;
    if (keys.has(typedKey)) {
      issues.push({
        path: `records.${type}`,
        message: `Duplicate key "${record.key}".`,
      });
    }
    keys.add(typedKey);
    if (sourceKeys.has(record.key)) {
      issues.push({
        path: `records.${type}`,
        message: `Source key "${record.key}" is used more than once. Keys must be unique across record types so links are unambiguous.`,
      });
    }
    sourceKeys.add(record.key);
    const name = record.name ?? record.title ?? "";
    if (name) {
      const normalizedName = name.toLocaleLowerCase();
      const names = namesByType.get(type) ?? new Set<string>();
      if (names.has(normalizedName)) {
        issues.push({
          path: `records.${type}`,
          message: `Duplicate name "${name}" within the import.`,
        });
      }
      names.add(normalizedName);
      namesByType.set(type, names);
    }
  }

  const keyTypes = new Map(
    allRecords.map(({ type, record }) => [`${type}:${record.key}`, type]),
  );
  const checkReference = (
    reference: string,
    expectedType: CampaignImportType,
    path: string,
  ) => {
    if (!reference) {
      return;
    }
    const referencedType = [...keyTypes.entries()].find(([typedKey]) =>
      typedKey.endsWith(`:${reference}`),
    )?.[1];
    if (referencedType && referencedType !== expectedType) {
      issues.push({
        path,
        message: `Key "${reference}" refers to a ${referencedType.replace(/s$/, "")}, not a ${expectedType.replace(/s$/, "")}.`,
      });
    }
  };
  for (const [index, record] of locations.entries()) {
    checkReference(record.parent_key, "locations", `records.locations[${index}].parent_key`);
    if (record.parent_key === record.key) {
      issues.push({
        path: `records.locations[${index}].parent_key`,
        message: "A location cannot be its own parent.",
      });
    }
  }
  for (const [index, record] of npcs.entries()) {
    checkReference(record.location_key, "locations", `records.npcs[${index}].location_key`);
  }
  for (const [index, record] of houses.entries()) {
    checkReference(record.gm_details.current_ruler_key, "npcs", `records.houses[${index}].gm_details.current_ruler_key`);
    checkReference(record.gm_details.ancestral_seat_key, "locations", `records.houses[${index}].gm_details.ancestral_seat_key`);
  }
  for (const [index, record] of houseRelationships.entries()) {
    checkReference(record.house_key, "houses", `records.house_relationships[${index}].house_key`);
    checkReference(record.related_house_key, "houses", `records.house_relationships[${index}].related_house_key`);
    if (record.house_key && record.house_key === record.related_house_key) {
      issues.push({
        path: `records.house_relationships[${index}]`,
        message: "A house cannot have a relationship with itself.",
      });
    }
  }
  for (const [index, record] of factions.entries()) {
    checkReference(record.leader_key, "npcs", `records.factions[${index}].leader_key`);
    checkReference(record.headquarters_key, "locations", `records.factions[${index}].headquarters_key`);
  }
  for (const [index, record] of quests.entries()) {
    checkReference(record.location_key, "locations", `records.quests[${index}].location_key`);
  }

  if (issues.length) {
    return { issues };
  }
  return {
    bundle: {
      format: campaignImportFormat,
      version: campaignImportVersion,
      title,
      records: {
        locations,
        npcs,
        houses,
        house_relationships: houseRelationships,
        factions,
        quests,
        sessions,
        journal_entries: journalEntries,
      },
    },
    issues,
  };
}
