import { router } from 'expo-router';
import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Field, PrimaryButton, Screen, Title } from '../../components/ui';
import { t } from '../../i18n';
import { ageStatus, formatBirthdateInput, parseBirthdate } from '../../lib/age';
import { COUNTRIES, LAUNCH_COUNTRY } from '../../lib/countries';
import { useAppState } from '../../state/AppState';
import { colors, radius, space } from '../../theme';

const country = COUNTRIES[LAUNCH_COUNTRY];

export default function BirthdateStep() {
  const { updateDraft } = useAppState();
  const [input, setInput] = useState('');
  const [consent, setConsent] = useState(false);

  const date = parseBirthdate(input);
  const status = date ? ageStatus(date, country) : null;
  const canContinue = status === 'adult' || (status === 'minor' && consent);

  return (
    <Screen>
      <Title>{t('birthdateTitle')}</Title>
      <Body muted>{t('birthdateHint')}</Body>
      <Field
        value={input}
        onChangeText={(text) => {
          const formatted = formatBirthdateInput(text);
          setInput(formatted);
          // Close the number pad once a full date is entered.
          if (formatted.length === 10) Keyboard.dismiss();
        }}
        placeholder={t('birthdatePlaceholder')}
        keyboardType="number-pad"
        maxLength={10}
      />
      {input.length === 10 && !date && <Text style={styles.error}>{t('birthdateInvalid')}</Text>}
      {status === 'blocked' && (
        <Text style={styles.error}>{t('ageBlocked', { age: country.minimumAge })}</Text>
      )}
      {status === 'minor' && (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
          onPress={() => setConsent((c) => !c)}
          style={styles.consent}
        >
          <View style={[styles.box, consent && styles.boxChecked]} />
          <Text style={styles.consentText}>
            {t('guardianConsent', { age: country.ageOfMajority })}
          </Text>
        </Pressable>
      )}
      <View style={{ flex: 1 }} />
      <PrimaryButton
        label={t('next')}
        disabled={!canContinue}
        onPress={() => {
          if (!status || status === 'blocked') return;
          updateDraft({ birthdate: input, ageStatus: status, guardianConsent: consent });
          router.push('/onboarding/permissions');
        }}
      />
      <View style={{ height: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontSize: 15 },
  consent: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
    marginTop: 1,
  },
  boxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  consentText: { color: colors.text, fontSize: 15, flex: 1, lineHeight: 21 },
});
