import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, PrimaryButton, Screen, TextLink, Title } from '../../components/ui';
import { t } from '../../i18n';
import { useAppState } from '../../state/AppState';
import { colors, radius, space } from '../../theme';

export default function Rooms() {
  const { rooms } = useAppState();

  if (rooms.length === 0) {
    return (
      <Screen>
        <SettingsButton />
        <View style={styles.empty}>
          <Title>{t('emptyRoomsTitle')}</Title>
          <Body muted>{t('emptyRoomsBody')}</Body>
        </View>
        <PrimaryButton label={t('newRoom')} onPress={() => router.push('/rooms/new')} />
        <TextLink label={t('joinWithCode')} onPress={() => {}} />
        <View style={{ height: 24 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <SettingsButton />
      <Title>{t('roomsTitle')}</Title>
      <Body muted>{t('dayBoundaryNote')}</Body>
      <FlatList
        data={rooms}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ gap: space.sm }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push({ pathname: '/rooms/[id]', params: { id: item.id } })}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMeta}>
              {item.members.length} / {item.capacity}
            </Text>
          </Pressable>
        )}
      />
      <PrimaryButton label={t('newRoom')} onPress={() => router.push('/rooms/new')} />
      <View style={{ height: 24 }} />
    </Screen>
  );
}

function SettingsButton() {
  return (
    <Pressable
      style={styles.settings}
      hitSlop={12}
      onPress={() => router.push('/settings')}
      accessibilityLabel={t('settings')}
    >
      <Ionicons name="settings-outline" size={24} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  settings: { alignSelf: 'flex-end' },
  empty: { flex: 1, justifyContent: 'center', gap: space.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { color: colors.text, fontSize: 19, fontWeight: '700' },
  cardMeta: { color: colors.textMuted, fontSize: 15 },
});
