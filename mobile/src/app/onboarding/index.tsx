import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, PrimaryButton, Screen } from '../../components/ui';
import { currentLanguage, setLanguage, t } from '../../i18n';
import { colors, radius, space } from '../../theme';

// Language names are shown in their own language.
const LANGUAGES = [
  { code: 'th', label: 'ไทย' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

export default function Welcome() {
  // Re-render this screen when the language changes; later screens read
  // the new language when they mount.
  const [language, setLanguageState] = useState(currentLanguage());

  return (
    <Screen>
      <View style={styles.languages}>
        {LANGUAGES.map((l) => (
          <Pressable
            key={l.code}
            accessibilityRole="radio"
            accessibilityState={{ selected: language === l.code }}
            onPress={() => {
              setLanguage(l.code);
              setLanguageState(l.code);
            }}
            style={[styles.lang, language === l.code && styles.langOn]}
          >
            <Text style={[styles.langText, language === l.code && styles.langTextOn]}>
              {l.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.hero}>
        <Text style={styles.logo}>{t('appName')}</Text>
        <Body muted>{t('tagline')}</Body>
      </View>
      <PrimaryButton label={t('getStarted')} onPress={() => router.push('/onboarding/name')} />
      <View style={{ height: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  languages: { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end' },
  lang: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 6,
  },
  langOn: { backgroundColor: colors.surfaceRaised, borderColor: colors.accent },
  langText: { color: colors.textMuted, fontSize: 14 },
  langTextOn: { color: colors.text, fontWeight: '600' },
  hero: { flex: 1, justifyContent: 'center', gap: 12 },
  logo: { color: colors.accent, fontSize: 48, fontWeight: '800', letterSpacing: -1 },
});
