// A "day" in Loopday runs from the boundary hour (default 04:00 local time)
// until the same hour the next day, so late-night clips belong to the
// evening they started in.

function localParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') };
}

/** Returns the day a clip belongs to as YYYY-MM-DD. */
export function dayKey(instant: Date, timeZone: string, boundaryHour = 4): string {
  const p = localParts(instant, timeZone);
  // Use UTC arithmetic on the local calendar date to step back one day safely.
  const date = new Date(Date.UTC(p.year, p.month - 1, p.day));
  if (p.hour < boundaryHour) date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** Local hour (0-23) of an instant; used to place a clip in the hourly grid. */
export function localHour(instant: Date, timeZone: string): number {
  return localParts(instant, timeZone).hour;
}
