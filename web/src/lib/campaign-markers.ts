export const campaignMarkerTypes = [
  "city",
  "settlement",
  "fortress",
  "ruins",
  "landmark",
  "port",
  "hidden",
] as const;

export type CampaignMarkerType = (typeof campaignMarkerTypes)[number];

export type CampaignMapMarker = {
  id: string;
  map_id: string;
  location_id: string | null;
  location_name: string | null;
  name: string;
  marker_type: CampaignMarkerType;
  x: number;
  y: number;
  player_visible: boolean;
};

export type CampaignMapMarkerInput = {
  id?: string;
  mapId: string;
  locationId: string;
  name: string;
  markerType: CampaignMarkerType;
  x: number;
  y: number;
  playerVisible: boolean;
};
