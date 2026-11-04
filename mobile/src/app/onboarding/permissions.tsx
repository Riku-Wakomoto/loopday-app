import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Body, PrimaryButton, Screen, Title } from '../../components/ui';
import { t } from '../../i18n';
import { openLegal } from '../../lib/links';
import { useAppState } from '../../state/AppState';
import { colors, radius, space } from '../../theme';

// The OS permission prompts are wired up when the camera and push modules
// land; this screen explains them first, as the store guidelines expect.
export default function PermissionsStep() {
  const { completeOnboarding } = useAppState();

  return (
    <Screen>
      <Title>{t('permissionsTitle')}</Title>
      <Row label={t('cameraPermission')} why={t('cameraPermissionWhy')} />
      <Row label={t('notificationPermission')} why={t('notificationPermissionWhy')} />
      <Body muted>{t('privacyNote')}</Body>
      <View style={{ flex: 1 }} />
      <Text style={styles.terms}>
        {t('termsLead')}
        <Text style={styles.link} onPress={() => openLegal('terms')}>
          {t('termsOfUse')}
        </Text>
        {t('termsAnd')}
        <Text style={styles.link} onPress={() => openLegal('privacy')}>
          {t('privacyPolicy')}
        </Text>
        {t('termsTail')}
      </Text>
      <PrimaryButton
        label={t('agreeAndContinue')}
        onPress={() => {
          completeOnboarding();
          router.replace('/rooms');
        }}
      />
      <View style={{ height: 24 }} />
    </Screen>
  );
}

function Row({ label, why }: { label: string; why: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowWhy}>{why}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.md, gap: 4 },
  rowLabel: { color: colors.text, fontSize: 17, fontWeight: '600', textAlign: 'auto' },
  rowWhy: { color: colors.textMuted, fontSize: 15, lineHeight: 21, textAlign: 'auto' },
  terms: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  link: { color: colors.accent, textDecorationLine: 'underline' },
});
