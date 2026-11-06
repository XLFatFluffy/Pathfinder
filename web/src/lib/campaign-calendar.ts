export const CAMPAIGN_WEEKDAYS = [
  "Firstday",
  "Secondday",
  "Thirdday",
  "Fourthday",
  "Fifthday",
  "Sixthday",
  "Restday",
] as const;

export const CAMPAIGN_FESTIVALS = [
  "Winter's End",
  "First Planting",
  "Day of the Crown",
  "Highsummer Feast",
  "Harvest Home",
  "Night of Remembrance",
  "Yearturn",
] as const;

export const CURRENT_IN_WORLD_DATE = "1 Harvestfall, 243 AC";

export const CAMPAIGN_MONTHS = [
  "Harvestfall",
  "Month 2",
  "Month 3",
  "Month 4",
  "Month 5",
  "Month 6",
  "Month 7",
  "Month 8",
  "Month 9",
  "Month 10",
  "Month 11",
  "Month 12",
] as const;

export function buildCampaignMonthView(monthName = "Harvestfall") {
  return Array.from({ length: 30 }, (_, index) => ({
    day: index + 1,
    month: monthName,
  }));
}
