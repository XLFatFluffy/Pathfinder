"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRows } from "@/lib/supabase-pagination";
import {
  campaignImportTypes,
  parseCampaignImport,
  type CampaignImportBundle,
  type CampaignImportIssue,
  type CampaignImportType,
} from "@/lib/campaign-import";

type SourceMapping = {
  record_type: CampaignImportType;
  source_key: string;
  entity_id: string;
};

type ImportPreviewItem = {
  type: CampaignImportType;
  key: string;
  name: string;
  visibility: string;
  canon_status: string;
  status: "ready" | "already_imported" | "conflict";
  message?: string;
};

export type CampaignImportPreview = {
  title?: string;
  issues: CampaignImportIssue[];
  records: ImportPreviewItem[];
};

export type CampaignImportResult = {
  title?: string;
  imported: string[];
  skipped: string[];
  error?: string;
};

function typedKey(type: CampaignImportType, key: string) {
  return `${type}:${key}`;
}

function collectRecords(bundle: CampaignImportBundle) {
  return [
    ...bundle.records.locations.map((record) => ({
      type: "locations" as const,
      record,
      name: record.name,
    })),
    ...bundle.records.npcs.map((record) => ({
      type: "npcs" as const,
      record,
      name: record.name,
    })),
    ...bundle.records.houses.map((record) => ({
      type: "houses" as const,
      record,
      name: record.name,
    })),
    ...bundle.records.house_relationships.map((record) => ({
      type: "house_relationships" as const,
      record,
      name: `${record.house_key} — ${record.related_house_key}`,
    })),
    ...bundle.records.factions.map((record) => ({
      type: "factions" as const,
      record,
      name: record.name,
    })),
    ...bundle.records.quests.map((record) => ({
      type: "quests" as const,
      record,
      name: record.name,
    })),
    ...bundle.records.sessions.map((record) => ({
      type: "sessions" as const,
      record,
      name: `Session ${record.session_number}`,
    })),
    ...bundle.records.journal_entries.map((record) => ({
      type: "journal_entries" as const,
      record,
      name: record.title,
    })),
  ];
}

async function getSourceMappings(
  campaignId: string,
): Promise<{ mappings?: SourceMapping[]; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const result = await getAllSupabaseRows((from, to) =>
    supabase
      .from("campaign_import_sources")
      .select("record_type, source_key, entity_id")
      .eq("campaign_id", campaignId)
      .order("record_type")
      .order("source_key")
      .range(from, to),
  );
  if (result.error) {
    return {
      error: `Unable to check previous campaign imports: ${result.error}`,
    };
  }
  return { mappings: (result.data ?? []) as SourceMapping[] };
}

async function getExistingNames(
  campaignId: string,
): Promise<{ names?: Map<CampaignImportType, Set<string>>; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const [
    locations,
    npcs,
    houses,
    factions,
    quests,
    sessions,
    journalEntries,
  ] = await Promise.all([
    getAllSupabaseRows((from, to) =>
      supabase
        .from("campaign_locations")
        .select("id, name")
        .eq("campaign_id", campaignId)
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRows((from, to) =>
      supabase
        .from("campaign_npcs")
        .select("id, name")
        .eq("campaign_id", campaignId)
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRows((from, to) =>
      supabase
        .from("campaign_houses")
        .select("id, name")
        .eq("campaign_id", campaignId)
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRows((from, to) =>
      supabase
        .from("campaign_factions")
        .select("id, name")
        .eq("campaign_id", campaignId)
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRows((from, to) =>
      supabase
        .from("campaign_quests")
        .select("id, name")
        .eq("campaign_id", campaignId)
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRows((from, to) =>
      supabase
        .from("campaign_sessions")
        .select("id, session_number")
        .eq("campaign_id", campaignId)
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRows((from, to) =>
      supabase
        .from("campaign_journal_entries")
        .select("id, title")
        .eq("campaign_id", campaignId)
        .order("id")
        .range(from, to),
    ),
  ]);
  const errors = [
    ["locations", locations.error],
    ["npcs", npcs.error],
    ["houses", houses.error],
    ["factions", factions.error],
    ["quests", quests.error],
    ["sessions", sessions.error],
    ["journal entries", journalEntries.error],
  ] as const;
  const failed = errors.find(([, error]) => error);
  if (failed?.[1]) {
    return {
      error: `Unable to check existing ${failed[0]} records: ${failed[1]}`,
    };
  }
  const normalize = (values: Array<string | number>) =>
    new Set(values.map((value) => String(value).trim().toLocaleLowerCase()));
  return {
    names: new Map<CampaignImportType, Set<string>>([
      ["locations", normalize(locations.data?.map((row) => row.name) ?? [])],
      ["npcs", normalize(npcs.data?.map((row) => row.name) ?? [])],
      ["houses", normalize(houses.data?.map((row) => row.name) ?? [])],
      ["factions", normalize(factions.data?.map((row) => row.name) ?? [])],
      ["quests", normalize(quests.data?.map((row) => row.name) ?? [])],
      ["sessions", normalize(sessions.data?.map((row) => row.session_number) ?? [])],
      ["journal_entries", normalize(journalEntries.data?.map((row) => row.title) ?? [])],
    ]),
  };
}

function collectReferenceKeys(bundle: CampaignImportBundle) {
  const references: Array<{
    type: CampaignImportType;
    key: string;
    path: string;
  }> = [];
  bundle.records.locations.forEach((record, index) => {
    if (record.parent_key) {
      references.push({
        type: "locations",
        key: record.parent_key,
        path: `records.locations[${index}].parent_key`,
      });
    }
  });
  bundle.records.npcs.forEach((record, index) => {
    if (record.location_key) {
      references.push({
        type: "locations",
        key: record.location_key,
        path: `records.npcs[${index}].location_key`,
      });
    }
  });
  bundle.records.houses.forEach((record, index) => {
    if (record.gm_details.current_ruler_key) {
      references.push({
        type: "npcs",
        key: record.gm_details.current_ruler_key,
        path: `records.houses[${index}].gm_details.current_ruler_key`,
      });
    }
    if (record.gm_details.ancestral_seat_key) {
      references.push({
        type: "locations",
        key: record.gm_details.ancestral_seat_key,
        path: `records.houses[${index}].gm_details.ancestral_seat_key`,
      });
    }
  });
  bundle.records.house_relationships.forEach((record, index) => {
    references.push(
      {
        type: "houses",
        key: record.house_key,
        path: `records.house_relationships[${index}].house_key`,
      },
      {
        type: "houses",
        key: record.related_house_key,
        path: `records.house_relationships[${index}].related_house_key`,
      },
    );
  });
  bundle.records.factions.forEach((record, index) => {
    if (record.leader_key) {
      references.push({
        type: "npcs",
        key: record.leader_key,
        path: `records.factions[${index}].leader_key`,
      });
    }
    if (record.headquarters_key) {
      references.push({
        type: "locations",
        key: record.headquarters_key,
        path: `records.factions[${index}].headquarters_key`,
      });
    }
  });
  bundle.records.quests.forEach((record, index) => {
    if (record.location_key) {
      references.push({
        type: "locations",
        key: record.location_key,
        path: `records.quests[${index}].location_key`,
      });
    }
  });
  return references;
}

function collectKeys(bundle: CampaignImportBundle) {
  return new Set(
    collectRecords(bundle).map(({ type, record }) => typedKey(type, record.key)),
  );
}

async function buildPreview(raw: string): Promise<CampaignImportPreview> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return {
      issues: [{ path: "$", message: "Only the campaign GM can import campaign data." }],
      records: [],
    };
  }

  const parsed = parseCampaignImport(raw);
  if (!parsed.bundle) {
    return { issues: parsed.issues, records: [] };
  }

  const [mappingResult, namesResult] = await Promise.all([
    getSourceMappings(member.campaign_id),
    getExistingNames(member.campaign_id),
  ]);
  if (mappingResult.error) {
    return {
      title: parsed.bundle.title,
      issues: [{ path: "$", message: mappingResult.error }],
      records: [],
    };
  }
  if (namesResult.error || !namesResult.names) {
    return {
      title: parsed.bundle.title,
      issues: [
        {
          path: "$",
          message: namesResult.error ?? "Unable to inspect existing campaign records.",
        },
      ],
      records: [],
    };
  }

  const mappings = mappingResult.mappings ?? [];
  const importedKeys = new Set(
    mappings.map((mapping) => typedKey(mapping.record_type, mapping.source_key)),
  );
  const bundleKeys = collectKeys(parsed.bundle);
  const issues = [...parsed.issues];
  for (const reference of collectReferenceKeys(parsed.bundle)) {
    if (
      !bundleKeys.has(typedKey(reference.type, reference.key)) &&
      !importedKeys.has(typedKey(reference.type, reference.key))
    ) {
      issues.push({
        path: reference.path,
        message: `No ${reference.type.replace(/s$/, "")} with key "${reference.key}" exists in this file or an earlier import.`,
      });
    }
  }

  const records = collectRecords(parsed.bundle).map(({ type, record, name }) => {
    if (importedKeys.has(typedKey(type, record.key))) {
      return {
        type,
        key: record.key,
        name,
        visibility: record.visibility,
        canon_status: record.canon_status,
        status: "already_imported" as const,
        message: "This source key was imported before; its existing record will not be overwritten.",
      };
    }
    const existingNames = namesResult.names?.get(type);
    if (
      type !== "house_relationships" &&
      existingNames?.has(name.trim().toLocaleLowerCase())
    ) {
      return {
        type,
        key: record.key,
        name,
        visibility: record.visibility,
        canon_status: record.canon_status,
        status: "conflict" as const,
        message: "A record with this name already exists but was not created by this import key.",
      };
    }
    if (type === "sessions") {
      const session = record as CampaignImportBundle["records"]["sessions"][number];
      if (existingNames?.has(String(session.session_number))) {
        return {
          type,
          key: record.key,
          name,
          visibility: record.visibility,
          canon_status: record.canon_status,
          status: "conflict" as const,
          message: "A session with this number already exists.",
        };
      }
    }
    return {
      type,
      key: record.key,
      name,
      visibility: record.visibility,
      canon_status: record.canon_status,
      status: "ready" as const,
    };
  });

  return {
    title: parsed.bundle.title,
    issues,
    records,
  };
}

export async function previewCampaignDataImport(
  raw: string,
): Promise<CampaignImportPreview> {
  if (typeof raw !== "string") {
    return {
      issues: [{ path: "$", message: "Select or paste a JSON import file." }],
      records: [],
    };
  }
  return buildPreview(raw);
}

async function getEntityIdsBySourceKey(
  campaignId: string,
): Promise<{ ids?: Map<string, string>; error?: string }> {
  const result = await getSourceMappings(campaignId);
  if (result.error) {
    return { error: result.error };
  }
  return {
    ids: new Map(
      (result.mappings ?? []).map((mapping) => [
        typedKey(mapping.record_type, mapping.source_key),
        mapping.entity_id,
      ]),
    ),
  };
}

function topologicallySortLocations(
  records: CampaignImportBundle["records"]["locations"],
  knownKeys: Set<string>,
): CampaignImportBundle["records"]["locations"] | null {
  const remaining = [...records];
  const sorted: typeof records = [];
  const readyKeys = new Set(
    [...knownKeys].filter((key) => key.startsWith("locations:")),
  );
  while (remaining.length) {
    const nextIndex = remaining.findIndex(
      (record) =>
        !record.parent_key || readyKeys.has(typedKey("locations", record.parent_key)),
    );
    if (nextIndex < 0) {
      return null;
    }
    const [record] = remaining.splice(nextIndex, 1);
    sorted.push(record);
    readyKeys.add(typedKey("locations", record.key));
  }
  return sorted;
}

export async function applyCampaignDataImport(
  raw: string,
): Promise<CampaignImportResult> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return {
      imported: [],
      skipped: [],
      error: "Only the campaign GM can import campaign data.",
    };
  }

  const preview = await buildPreview(raw);
  const parsed = parseCampaignImport(raw);
  if (!parsed.bundle) {
    return {
      imported: [],
      skipped: [],
      error: preview.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"),
    };
  }
  const conflicts = preview.records.filter((record) => record.status === "conflict");
  if (preview.issues.length || conflicts.length) {
    return {
      title: parsed.bundle.title,
      imported: [],
      skipped: [],
      error: [
        ...preview.issues.map((issue) => `${issue.path}: ${issue.message}`),
        ...conflicts.map((record) => `${record.type}/${record.key}: ${record.message}`),
      ].join("\n"),
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return {
      title: parsed.bundle.title,
      imported: [],
      skipped: [],
      error: `Unable to verify the current user: ${userError.message}`,
    };
  }
  if (!user) {
    return {
      title: parsed.bundle.title,
      imported: [],
      skipped: [],
      error: "Sign in again before importing campaign data.",
    };
  }

  const sourceIdsResult = await getEntityIdsBySourceKey(member.campaign_id);
  if (sourceIdsResult.error || !sourceIdsResult.ids) {
    return {
      title: parsed.bundle.title,
      imported: [],
      skipped: [],
      error: sourceIdsResult.error ?? "Unable to resolve earlier import records.",
    };
  }
  const ids = sourceIdsResult.ids;
  const imported: string[] = [];
  const skipped: string[] = [];
  const locationRecords = topologicallySortLocations(
    parsed.bundle.records.locations.filter(
      (record) => !ids.has(typedKey("locations", record.key)),
    ),
    new Set(ids.keys()),
  );
  if (!locationRecords) {
    return {
      title: parsed.bundle.title,
      imported,
      skipped,
      error: "Location parent links contain a cycle or unresolved parent.",
    };
  }

  const saveMapping = async (
    type: CampaignImportType,
    record: {
      key: string;
      name?: string;
      title?: string;
      canon_status: string;
      visibility: string;
      knowledge_type: string;
      provenance: string;
    },
    entityId: string,
  ) => {
    const { error } = await supabase.from("campaign_import_sources").insert({
      campaign_id: member.campaign_id,
      record_type: type,
      source_key: record.key,
      entity_id: entityId,
      record_name: record.name ?? record.title ?? "Untitled",
      canon_status: record.canon_status,
      visibility: record.visibility,
      knowledge_type: record.knowledge_type,
      provenance: record.provenance,
    });
    if (error) {
      return `The campaign record was saved, but its source key could not be recorded: ${error.message}`;
    }
    ids.set(typedKey(type, record.key), entityId);
    return null;
  };
  const resolve = (
    type: CampaignImportType,
    key: string,
    path: string,
  ): { id?: string; error?: string } => {
    if (!key) {
      return {};
    }
    const id = ids.get(typedKey(type, key));
    return id
      ? { id }
      : { error: `${path}: Could not resolve ${type.replace(/s$/, "")} key "${key}".` };
  };
  const fail = (path: string, message: string): CampaignImportResult => ({
    title: parsed.bundle?.title,
    imported,
    skipped,
    error: `${path}: ${message}\nThe import stopped here. Records reported as imported are recorded by source key. If this failure happened after a campaign record was saved but before its source key was recorded, that record may appear as a name conflict on retry; review the campaign list before retrying. Re-importing never overwrites existing records.`,
  });
  const saveRecord = async (
    type: CampaignImportType,
    record: Parameters<typeof saveMapping>[1],
    rpc: string,
    args: Record<string, unknown>,
  ) => {
    if (ids.has(typedKey(type, record.key))) {
      skipped.push(`${type}/${record.key}`);
      return null;
    }
    const { data, error } = await supabase.rpc(rpc, args);
    if (error) {
      return error.message;
    }
    if (typeof data !== "string") {
      return "The database did not return the saved record ID.";
    }
    const mappingError = await saveMapping(type, record, data);
    if (mappingError) {
      return mappingError;
    }
    imported.push(`${type}/${record.key}`);
    return null;
  };

  for (const [index, record] of locationRecords.entries()) {
    const parent = resolve("locations", record.parent_key, `records.locations/${record.key}.parent_key`);
    if (parent.error) return fail(`records.locations[${index}]`, parent.error);
    const error = await saveRecord("locations", record, "create_campaign_location", {
      target_campaign_id: member.campaign_id,
      target_parent_id: parent.id ?? null,
      target_name: record.name,
      target_location_type: record.location_type,
      target_description: record.description,
      target_player_visible: record.visibility === "PLAYER_SHARED",
      target_gm_notes: record.gm_notes,
    });
    if (error) return fail(`records.locations[${index}]`, error);
  }

  for (const [index, record] of parsed.bundle.records.npcs.entries()) {
    const location = resolve("locations", record.location_key, `records.npcs/${record.key}.location_key`);
    if (location.error) return fail(`records.npcs[${index}]`, location.error);
    const error = await saveRecord("npcs", record, "save_campaign_npc", {
      target_campaign_id: member.campaign_id,
      target_npc_id: null,
      target_location_id: location.id ?? null,
      target_name: record.name,
      target_race: record.race,
      target_age: record.age,
      target_gender: record.gender,
      target_occupation: record.occupation,
      target_titles: record.titles,
      target_description: record.description,
      target_status: record.status,
      target_player_visible: record.visibility === "PLAYER_SHARED",
      target_gm_notes: record.gm_notes,
      target_status_date: record.status_date,
      target_status_reason: record.status_reason,
    });
    if (error) return fail(`records.npcs[${index}]`, error);
  }

  for (const [index, record] of parsed.bundle.records.houses.entries()) {
    const ruler = resolve("npcs", record.gm_details.current_ruler_key, `records.houses/${record.key}.gm_details.current_ruler_key`);
    const seat = resolve("locations", record.gm_details.ancestral_seat_key, `records.houses/${record.key}.gm_details.ancestral_seat_key`);
    if (ruler.error || seat.error) {
      return fail(`records.houses[${index}]`, ruler.error ?? seat.error ?? "House links could not be resolved.");
    }
    const error = await saveRecord("houses", record, "save_campaign_house", {
      target_campaign_id: member.campaign_id,
      target_house_id: null,
      target_name: record.name,
      target_heraldry_description: record.heraldry_description,
      target_motto: record.motto,
      target_description: record.description,
      target_player_visible: record.visibility === "PLAYER_SHARED",
      target_founding_history: record.gm_details.founding_history,
      target_current_ruler_id: ruler.id ?? null,
      target_ancestral_seat_location_id: seat.id ?? null,
      target_holdings: record.gm_details.holdings,
      target_succession: record.gm_details.succession,
      target_military_strength: record.gm_details.military_strength,
      target_wealth: record.gm_details.wealth,
      target_resources: record.gm_details.resources,
      target_political_influence: record.gm_details.political_influence,
      target_religious_affiliations: record.gm_details.religious_affiliations,
      target_objectives: record.gm_details.objectives,
      target_secrets: record.gm_details.secrets,
    });
    if (error) return fail(`records.houses[${index}]`, error);
  }

  for (const [index, record] of parsed.bundle.records.house_relationships.entries()) {
    const house = resolve("houses", record.house_key, `records.house_relationships/${record.key}.house_key`);
    const relatedHouse = resolve("houses", record.related_house_key, `records.house_relationships/${record.key}.related_house_key`);
    if (house.error || relatedHouse.error) {
      return fail(`records.house_relationships[${index}]`, house.error ?? relatedHouse.error ?? "House links could not be resolved.");
    }
    const error = await saveRecord("house_relationships", record, "save_campaign_house_relationship", {
      target_campaign_id: member.campaign_id,
      target_relationship_id: null,
      target_house_id: house.id,
      target_related_house_id: relatedHouse.id,
      target_relationship_type: record.relationship_type,
      target_description: record.description,
      target_player_visible: record.visibility === "PLAYER_SHARED",
      target_gm_notes: record.gm_notes,
      target_campaign_date: record.campaign_date,
      target_reason: record.reason,
    });
    if (error) return fail(`records.house_relationships[${index}]`, error);
  }

  for (const [index, record] of parsed.bundle.records.factions.entries()) {
    const leader = resolve("npcs", record.leader_key, `records.factions/${record.key}.leader_key`);
    const headquarters = resolve("locations", record.headquarters_key, `records.factions/${record.key}.headquarters_key`);
    if (leader.error || headquarters.error) {
      return fail(`records.factions[${index}]`, leader.error ?? headquarters.error ?? "Faction links could not be resolved.");
    }
    const error = await saveRecord("factions", record, "save_campaign_faction", {
      target_campaign_id: member.campaign_id,
      target_faction_id: null,
      target_name: record.name,
      target_faction_type: record.faction_type,
      target_description: record.description,
      target_leader_npc_id: leader.id ?? null,
      target_headquarters_location_id: headquarters.id ?? null,
      target_player_visible: record.visibility === "PLAYER_SHARED",
      target_objectives: record.gm_details.objectives,
      target_resources: record.gm_details.resources,
      target_influence: record.gm_details.influence,
      target_membership: record.gm_details.membership,
      target_allies_and_rivals: record.gm_details.allies_and_rivals,
      target_current_activities: record.gm_details.current_activities,
      target_history: record.gm_details.history,
      target_secrets: record.gm_details.secrets,
    });
    if (error) return fail(`records.factions[${index}]`, error);
  }

  for (const [index, record] of parsed.bundle.records.quests.entries()) {
    const location = resolve("locations", record.location_key, `records.quests/${record.key}.location_key`);
    if (location.error) return fail(`records.quests[${index}]`, location.error);
    const error = await saveRecord("quests", record, "save_campaign_quest", {
      target_campaign_id: member.campaign_id,
      target_quest_id: null,
      target_name: record.name,
      target_status: record.status,
      target_summary: record.summary,
      target_giver: record.giver,
      target_location_id: location.id ?? null,
      target_player_visible: record.visibility === "PLAYER_SHARED",
      target_gm_notes: record.gm_notes,
    });
    if (error) return fail(`records.quests[${index}]`, error);
  }

  for (const [index, record] of parsed.bundle.records.sessions.entries()) {
    const error = await saveRecord("sessions", record, "save_campaign_session", {
      target_campaign_id: member.campaign_id,
      target_session_id: null,
      target_session_number: record.session_number,
      target_campaign_date: record.campaign_date,
      target_summary: record.summary,
      target_player_visible: record.visibility === "PLAYER_SHARED",
      target_gm_notes: record.gm_notes,
    });
    if (error) return fail(`records.sessions[${index}]`, error);
  }

  for (const [index, record] of parsed.bundle.records.journal_entries.entries()) {
    if (ids.has(typedKey("journal_entries", record.key))) {
      skipped.push(`journal_entries/${record.key}`);
      continue;
    }
    const { data, error } = await supabase
      .from("campaign_journal_entries")
      .insert({
        campaign_id: member.campaign_id,
        title: record.title,
        content: record.content,
        campaign_date: record.campaign_date || null,
        player_visible: record.visibility === "PLAYER_SHARED",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) return fail(`records.journal_entries[${index}]`, error.message);
    const mappingError = await saveMapping("journal_entries", record, data.id);
    if (mappingError) return fail(`records.journal_entries[${index}]`, mappingError);
    imported.push(`journal_entries/${record.key}`);
  }

  for (const path of [
    "/gm/import",
    "/gm",
    "/gm/locations",
    "/gm/npcs",
    "/gm/houses",
    "/gm/factions",
    "/gm/quests",
    "/gm/sessions",
    "/gm/characters",
    "/player",
    "/player/journal",
    "/player/locations",
    "/player/npcs",
    "/player/houses",
    "/player/factions",
    "/player/quests",
    "/player/sessions",
  ]) {
    revalidatePath(path);
  }

  return {
    title: parsed.bundle.title,
    imported,
    skipped,
  };
}
