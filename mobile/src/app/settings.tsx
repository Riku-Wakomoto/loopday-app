import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, Title } from '../components/ui';
import { t } from '../i18n';
import { openLegal, openSupport } from '../lib/links';
import { useAppState } from '../state/AppState';
import { colors, radius, space } from '../theme';

export default function Settings() {
  const { deleteAccount, blocked } = useAppState();

  const confirmDelete = () =>
    Alert.alert(t('deleteAccount'), t('deleteAccountConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteAccountButton'),
        style: 'destructive',
        onPress: () => {
          // TODO(supabase): call the delete_account RPC, which removes the
          // profile (cascading to clips, messages, reactions) and the R2 files.
          deleteAccount();
          router.replace('/onboarding');
        },
      },
    ]);

  return (
    <Screen>
      <Pressable hitSlop={12} onPress={() => router.back()} accessibilityLabel={t('back')}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <Title>{t('settings')}</Title>
      <View style={styles.group}>
        <Row icon="shield-checkmark-outline" label={t('privacyPolicy')} onPress={() => openLegal('privacy')} />
        <Row icon="document-text-outline" label={t('termsOfUse')} onPress={() => openLegal('terms')} />
        <Row icon="mail-outline" label={t('contactSupport')} onPress={() => openSupport()} />
      </View>
      {blocked.length > 0 && (
        <Text style={styles.note}>{t('blockedCount', { count: blocked.length })}</Text>
      )}
      <View style={styles.group}>
        <Row icon="trash-outline" label={t('deleteAccount')} danger onPress={confirmDelete} />
      </View>
      <View style={{ flex: 1 }} />
      <Text style={styles.note}>{`Loopday ${Constants.expoConfig?.version ?? ''}`}</Text>
      <View style={{ height: 24 }} />
    </Screen>
  );
}

function Row(props: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const color = props.danger ? colors.danger : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={props.icon} size={20} color={color} />
      <Text style={[styles.rowLabel, { color }]}>{props.label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  note: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
});
