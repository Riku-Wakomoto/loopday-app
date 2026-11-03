import type { CountryConfig } from './countries.ts';

export type AgeStatus = 'blocked' | 'minor' | 'adult';

/** Full years between birthdate and `now`, using calendar dates. */
export function ageInYears(birthdate: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - birthdate.getFullYear();
  const beforeBirthday =
    now.getMonth() < birthdate.getMonth() ||
    (now.getMonth() === birthdate.getMonth() && now.getDate() < birthdate.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/**
 * blocked: may not sign up.
 * minor:   needs guardian consent, no purchases, no personalised ads.
 * adult:   no extra restrictions.
 */
export function ageStatus(
  birthdate: Date,
  country: Pick<CountryConfig, 'minimumAge' | 'ageOfMajority'>,
  now: Date = new Date(),
): AgeStatus {
  const age = ageInYears(birthdate, now);
  if (age < country.minimumAge) return 'blocked';
  if (age < country.ageOfMajority) return 'minor';
  return 'adult';
}

/** Parses YYYY-MM-DD strictly; returns null for impossible dates. */
export function parseBirthdate(input: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}
