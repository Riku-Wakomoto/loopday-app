import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, TextLink, Title } from '../../components/ui';
import { t } from '../../i18n';
import { localHour } from '../../lib/day';
import { COUNTRIES, LAUNCH_COUNTRY } from '../../lib/countries';
import { useAppState } from '../../state/AppState';
import { colors, radius, space } from '../../theme';

type Cell = { kind: 'member'; name: string; isMe: boolean } | { kind: 'invite' };

// The group's view of the current hour: one tile per member, the viewer's
// own tile is where they record, and a spare tile invites friends.
export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rooms, profile } = useAppState();
  const room = rooms.find((r) => r.id === id);
  const hour = localHour(new Date(), COUNTRIES[LAUNCH_COUNTRY].timeZone);

  const cells = useMemo<Cell[]>(() => {
    if (!room) return [];
    const members: Cell[] = room.members.map((name) => ({
      kind: 'member',
      name,
      isMe: name === profile?.displayName,
    }));
    return room.members.length < room.capacity ? [...members, { kind: 'invite' }] : members;
  }, [room, profile]);

  if (!room) {
    return (
      <Screen>
        <TextLink label={t('back')} onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <TextLink label={t('back')} onPress={() => router.back()} />
        <Title>{room.name}</Title>
        <Text style={styles.hour}>{`${String(hour).padStart(2, '0')}:00`}</Text>
      </View>
      <FlatList
        data={cells}
        numColumns={2}
        keyExtractor={(c, i) => (c.kind === 'member' ? c.name : 'invite') + i}
        columnWrapperStyle={{ gap: space.sm }}
        contentContainerStyle={{ gap: space.sm }}
        renderItem={({ item }) => <Tile cell={item} />}
      />
    </Screen>
  );
}

function Tile({ cell }: { cell: Cell }) {
  if (cell.kind === 'invite') {
    return (
      <Pressable style={[styles.tile, styles.inviteTile]} onPress={() => {}}>
        <Text style={styles.plus}>+</Text>
        <Text style={styles.tileMeta}>{t('inviteFriend')}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable style={[styles.tile, cell.isMe && styles.myTile]} onPress={() => {}}>
      <Text style={styles.tileName}>{cell.name}</Text>
      <Text style={styles.tileMeta}>{cell.isMe ? t('tapToRecord') : t('noClipYet')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.xs },
  hour: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  tile: {
    flex: 1,
    // Clips are landscape, so tiles are too.
    aspectRatio: 16 / 9,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.sm,
    justifyContent: 'space-between',
  },
  myTile: { borderColor: colors.accent, borderWidth: 2 },
  inviteTile: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderColor: colors.border, borderWidth: 1 },
  plus: { color: colors.accent, fontSize: 28, fontWeight: '300' },
  tileName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  tileMeta: { color: colors.textMuted, fontSize: 13 },
});
