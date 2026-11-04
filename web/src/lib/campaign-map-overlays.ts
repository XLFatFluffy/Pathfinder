export const campaignMapOverlayTypes = ["region", "route"] as const;

export type CampaignMapOverlayType = (typeof campaignMapOverlayTypes)[number];

export type CampaignMapPoint = {
  x: number;
  y: number;
};

export type CampaignMapOverlay = {
  id: string;
  map_id: string;
  name: string;
  overlay_type: CampaignMapOverlayType;
  points: CampaignMapPoint[];
  color: string;
  player_visible: boolean;
};

export type CampaignMapOverlayInput = {
  id?: string;
  mapId: string;
  name: string;
  overlayType: CampaignMapOverlayType;
  points: CampaignMapPoint[];
  color: string;
  playerVisible: boolean;
};
