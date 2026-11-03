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

const styles = StyleSheet.create({
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
