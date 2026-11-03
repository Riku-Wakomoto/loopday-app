// Per-country settings. Features that differ by market (quiet hours, day
// boundary, storage region, age of majority) are read from here so that
// Saudi Arabia and Mexico can be added without touching screen code.

export type CountryCode = 'TH' | 'SA' | 'MX';

export type StorageRegion = 'apac' | 'me' | 'us-west';

export interface CountryConfig {
  code: CountryCode;
  /** UI languages offered, first one is the default. */
  languages: readonly string[];
  /** Users under this age are blocked from signing up. */
  minimumAge: number;
  /** Users under this age need guardian consent and cannot purchase. */
  ageOfMajority: number;
  /** Local hour at which one "day" of clips ends and the next begins. */
  dayBoundaryHour: number;
  storageRegion: StorageRegion;
  /** IANA time zone used for hourly prompts and day boundaries. */
  timeZone: string;
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  TH: {
    code: 'TH',
    languages: ['th', 'en'],
    minimumAge: 13,
    ageOfMajority: 20,
    dayBoundaryHour: 4,
    storageRegion: 'apac',
    timeZone: 'Asia/Bangkok',
  },
  SA: {
    code: 'SA',
    languages: ['ar', 'en'],
    // The Saudi plan targets 18+ only.
    minimumAge: 18,
    ageOfMajority: 18,
    dayBoundaryHour: 4,
    storageRegion: 'me',
    timeZone: 'Asia/Riyadh',
  },
  MX: {
    code: 'MX',
    languages: ['es', 'en'],
    minimumAge: 13,
    ageOfMajority: 18,
    dayBoundaryHour: 4,
    storageRegion: 'us-west',
    timeZone: 'America/Mexico_City',
  },
};

export const LAUNCH_COUNTRY: CountryCode = 'TH';
