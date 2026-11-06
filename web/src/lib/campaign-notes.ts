export const CAMPAIGN_NOTE_CATEGORIES = [
  { value: "session_prep", label: "Session preparation" },
  { value: "session_recap", label: "Session recap" },
  { value: "npc", label: "NPC information" },
  { value: "location", label: "Location information" },
  { value: "politics", label: "Political developments" },
  { value: "quest", label: "Quest planning" },
  { value: "encounter", label: "Encounter preparation" },
  { value: "worldbuilding", label: "Worldbuilding" },
  { value: "rules", label: "Rules reference" },
  { value: "unsorted", label: "Unsorted" },
] as const;

export const CAMPAIGN_NOTE_LINK_TYPES = [
  "location",
  "npc",
  "house",
  "faction",
  "quest",
  "session",
  "event",
  "map",
] as const;

export type CampaignNoteLinkType = (typeof CAMPAIGN_NOTE_LINK_TYPES)[number];

export type CampaignNoteLink = {
  type: CampaignNoteLinkType;
  id: string;
};
