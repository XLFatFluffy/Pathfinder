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
export const YEARTURN_DAYS = [
  "Day of the Dead",
  "Day of Debts",
  "Day of Oaths",
  "Day of Ancestors",
  "New Year's Day",
] as const;

export const CAMPAIGN_MONTHS = [
  "Frostwane",
  "Thawrise",
  "Greenwake",
  "Bloomtide",
  "Suncrest",
  "Highsun",
  "Goldleaf",
  "Harvestfall",
  "Emberwane",
  "Mistfall",
  "Duskreach",
  "Longnight",
] as const;

export function isCampaignLeapYear(year: number): boolean {
  return Number.isInteger(year) && year > 0 && year % 4 === 0;
}

export function getCampaignYearLength(year: number): number {
  return 365 + (isCampaignLeapYear(year) ? 1 : 0);
}

export function campaignDateSortValue(value: string): number | null {
  const normalized = value.replace(/^\s*(approximately|about|circa)\s+/i, "").trim();
  const yearAndEra = normalized.match(/^(.*?)\s*,?\s*(\d+)\s+(AC|BC)$/i);
  if (!yearAndEra) {
    return null;
  }

  const datePart = yearAndEra[1].trim().replace(/,$/, "").trim();
  const year = Number(yearAndEra[2]);
  const era = yearAndEra[3].toUpperCase();
  if (!Number.isSafeInteger(year) || year < 1) {
    return null;
  }

  const yearturnIndex = YEARTURN_DAYS.findIndex(
    (yearturnDay) => yearturnDay.toLowerCase() === datePart.toLowerCase(),
  );
  if (yearturnIndex >= 0) {
    const eraYear = era === "BC" ? -year : year;
    return eraYear * 366 + 360 + yearturnIndex;
  }

  const monthPattern = CAMPAIGN_MONTHS.join("|");
  const match = datePart.match(
    new RegExp(
      `^(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${monthPattern}|Yearturn)$`,
      "i",
    ),
  );
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = match[2].toLowerCase();
  const monthIndex = CAMPAIGN_MONTHS.findIndex(
    (campaignMonth) => campaignMonth.toLowerCase() === month,
  );
  const dayOffset =
    month === "yearturn" ? 360 + day - 1 : monthIndex * 30 + day - 1;
  const maxDay = month === "yearturn" ? 5 : 30;
  if (day < 1 || day > maxDay) {
    return null;
  }

  const eraYear = era === "BC" ? -year : year;
  return eraYear * 366 + dayOffset;
}

export function buildCampaignMonthView(monthName = "Harvestfall") {
  if (!CAMPAIGN_MONTHS.includes(monthName as (typeof CAMPAIGN_MONTHS)[number])) {
    throw new Error(`Unknown campaign month: ${monthName}`);
  }

  return Array.from({ length: 30 }, (_, index) => ({
    day: index + 1,
    month: monthName,
  }));
}
