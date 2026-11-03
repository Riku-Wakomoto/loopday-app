import { getLocales } from 'expo-localization';
import { en } from './en';
import { ja } from './ja';
import { th } from './th';

export type Strings = typeof en;
type Key = keyof Strings;

const catalogs: Record<string, Partial<Strings>> = { en, th, ja };

function pickLanguage(): string {
  for (const locale of getLocales()) {
    if (locale.languageCode && catalogs[locale.languageCode]) return locale.languageCode;
  }
  return 'en';
}

let language = pickLanguage();

export function setLanguage(code: string) {
  if (catalogs[code]) language = code;
}

export function currentLanguage() {
  return language;
}

/** Looks up a string, falling back to English, and fills {placeholders}. */
export function t(key: Key, vars: Record<string, string | number> = {}): string {
  const template = catalogs[language]?.[key] ?? en[key];
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
}
