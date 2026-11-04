import { Linking } from 'react-native';
import { currentLanguage } from '../i18n';

// Public pages served by GitHub Pages from /docs. Switch to the app's own
// domain once it is registered; the store listings must use the same URLs.
export const SITE_URL = 'https://riku-wakomoto.github.io/loopday-app';
// TODO: replace with the real support address before submitting for review.
export const SUPPORT_EMAIL = 'support@example.com';

type Page = 'privacy' | 'terms';

/** The legal page in the user's language (Thai or English). */
export function legalUrl(page: Page): string {
  const suffix = currentLanguage() === 'th' ? '.th' : '';
  return `${SITE_URL}/legal/${page}${suffix}`;
}

export function openLegal(page: Page) {
  return Linking.openURL(legalUrl(page));
}

export function openSupport() {
  return Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Loopday`);
}
