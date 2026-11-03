// Group streak: how many days in a row the group made a vlog together.
// A day counts when at least two members recorded (one for a solo group).
// Nobody is required to post, so one person skipping a day never breaks it.

/** The previous day of a YYYY-MM-DD key. */
export function previousDay(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function dayQualifies(posters: number, memberCount: number): boolean {
  return posters >= Math.min(2, Math.max(1, memberCount));
}

/**
 * @param postersByDay day key → names of members who recorded that day
 * @param today the group's current day key
 * Today only adds to the streak once it qualifies; until the day ends, an
 * unfinished today does not break the streak from yesterday.
 */
export function groupStreak(
  postersByDay: Record<string, Iterable<string>>,
  memberCount: number,
  today: string,
): number {
  const qualifies = (key: string) =>
    dayQualifies(new Set(postersByDay[key] ?? []).size, memberCount);
  let day = qualifies(today) ? today : previousDay(today);
  let count = 0;
  while (qualifies(day)) {
    count += 1;
    day = previousDay(day);
  }
  return count;
}
