const DEFAULT_CALENDAR_MONTHS = Array.from({ length: 12 }, (_, index) => ({
  name: `Month ${index + 1}`,
  days: 30
}));

function calendarError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function normalizeCalendarMonths(months) {
  if (!Array.isArray(months) || months.length < 1 || months.length > 100) {
    throw calendarError('The calendar must contain between 1 and 100 months.');
  }

  const names = new Set();
  return months.map((month, index) => {
    const name = String(month?.name || '').trim();
    const days = Number(month?.days);
    if (!name || name.length > 40) {
      throw calendarError(`Month ${index + 1} needs a name of 1 to 40 characters.`);
    }
    if (!Number.isSafeInteger(days) || days < 1 || days > 1000) {
      throw calendarError(`Month "${name}" must have between 1 and 1000 days.`);
    }
    const normalizedName = name.toLowerCase();
    if (names.has(normalizedName)) {
      throw calendarError(`Month names must be unique. "${name}" appears more than once.`);
    }
    names.add(normalizedName);
    return { name, days };
  });
}

function parseCalendarMonthLines(value) {
  if (typeof value !== 'string') {
    throw calendarError('Enter one calendar month per line as "Month name: day count".');
  }

  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const months = lines.map((line, index) => {
    const match = line.match(/^(.+?)\s*:\s*(\d+)$/);
    if (!match) {
      throw calendarError(`Calendar line ${index + 1} must use "Month name: day count".`);
    }
    return { name: match[1].trim(), days: Number(match[2]) };
  });
  return normalizeCalendarMonths(months);
}

function parseCampaignDate(value, months) {
  if (typeof value !== 'string') {
    throw calendarError('Enter the campaign date as day-month-year, for example 1-01-0001.');
  }

  const match = value.trim().match(/^(\d{1,4})-(\d{1,3})-(\d{1,6})$/);
  if (!match) {
    throw calendarError('Enter the campaign date as day-month-year, for example 1-01-0001.');
  }

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  if (month < 1 || month > months.length) {
    throw calendarError(`The campaign date must use a month from 1 to ${months.length}.`);
  }
  if (year < 1 || year > 999999) {
    throw calendarError('The campaign year must be between 1 and 999999.');
  }
  if (day < 1 || day > months[month - 1].days) {
    throw calendarError(`Day ${day} does not exist in ${months[month - 1].name}.`);
  }

  return { day, month, year };
}

function formatCampaignDate({ day, month, year }) {
  return `${day}-${String(month).padStart(2, '0')}-${String(year).padStart(4, '0')}`;
}

function advanceCampaignDate(dateText, amount, unit, months) {
  const calendarMonths = normalizeCalendarMonths(months);
  const currentDate = parseCampaignDate(dateText, calendarMonths);
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000) {
    throw calendarError('The time interval must be a whole number between 1 and 100000.');
  }
  if (!['day', 'week', 'month', 'year', 'custom'].includes(unit)) {
    throw calendarError('Choose days, weeks, months, years, or a custom number of days.');
  }

  if (unit === 'month' || unit === 'year') {
    const monthCount = calendarMonths.length;
    const offset = amount * (unit === 'year' ? monthCount : 1);
    const currentMonthIndex = (currentDate.year - 1) * monthCount + currentDate.month - 1;
    const targetMonthIndex = currentMonthIndex + offset;
    const year = Math.floor(targetMonthIndex / monthCount) + 1;
    if (year > 999999) {
      throw calendarError('The resulting campaign year exceeds 999999.');
    }
    const month = (targetMonthIndex % monthCount) + 1;
    const day = Math.min(currentDate.day, calendarMonths[month - 1].days);
    return formatCampaignDate({ day, month, year });
  }

  const daysToAdvance = amount * (unit === 'week' ? 7 : 1);
  const daysPerYear = calendarMonths.reduce((total, month) => total + month.days, 0);
  let dayOfYear = calendarMonths
    .slice(0, currentDate.month - 1)
    .reduce((total, month) => total + month.days, currentDate.day - 1);
  const absoluteDay = (currentDate.year - 1) * daysPerYear + dayOfYear + daysToAdvance;
  const year = Math.floor(absoluteDay / daysPerYear) + 1;
  if (year > 999999) {
    throw calendarError('The resulting campaign year exceeds 999999.');
  }
  dayOfYear = absoluteDay % daysPerYear;

  let month = 1;
  while (dayOfYear >= calendarMonths[month - 1].days) {
    dayOfYear -= calendarMonths[month - 1].days;
    month += 1;
  }
  return formatCampaignDate({ day: dayOfYear + 1, month, year });
}

module.exports = {
  DEFAULT_CALENDAR_MONTHS,
  normalizeCalendarMonths,
  parseCalendarMonthLines,
  parseCampaignDate,
  formatCampaignDate,
  advanceCampaignDate
};
