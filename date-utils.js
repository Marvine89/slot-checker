const MONTHS = new Map([
  ["januar", 0],
  ["februar", 1],
  ["mars", 2],
  ["april", 3],
  ["mai", 4],
  ["juni", 5],
  ["juli", 6],
  ["august", 7],
  ["september", 8],
  ["oktober", 9],
  ["november", 10],
  ["desember", 11],
]);

export function extractDates(text) {
  const dates = [];
  const numericPattern = /\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/g;
  const namedPattern = new RegExp(
    `\\b(\\d{1,2})\\.?\\s+(${[...MONTHS.keys()].join("|")})\\s+(20\\d{2})\\b`,
    "gi",
  );

  for (const match of text.matchAll(numericPattern)) {
    dates.push(toValidDate(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
  }

  for (const match of text.matchAll(namedPattern)) {
    dates.push(toValidDate(Number(match[3]), MONTHS.get(match[2].toLowerCase()), Number(match[1])));
  }

  return dates.filter(Boolean);
}

export function isBeforeCutoff(date, cutoff) {
  return date.getTime() < cutoff.getTime();
}

function toValidDate(year, month, day) {
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}
