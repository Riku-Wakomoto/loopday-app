import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Body, PrimaryButton, Screen } from '../../components/ui';
import { t } from '../../i18n';
import { colors } from '../../theme';

export default function Welcome() {
  return (
    <Screen>
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
  hero: { flex: 1, justifyContent: 'center', gap: 12 },
  logo: { color: colors.accent, fontSize: 48, fontWeight: '800', letterSpacing: -1 },
});
