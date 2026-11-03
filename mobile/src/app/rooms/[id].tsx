import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarSheet } from '../../components/CalendarSheet';
import { ExportSheet } from '../../components/ExportSheet';
import { Screen, TextLink, Title } from '../../components/ui';
import { t } from '../../i18n';
import { dayKey, localHour } from '../../lib/day';
import { COUNTRIES, LAUNCH_COUNTRY } from '../../lib/countries';
import { useAppState } from '../../state/AppState';
import { colors, radius, space } from '../../theme';

type Cell = { kind: 'member'; name: string; isMe: boolean } | { kind: 'invite' };

// The group's view of the current hour: one tile per member, the viewer's
// own tile is where they record, and a spare tile invites friends.
export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rooms, profile, messages } = useAppState();
  const room = rooms.find((r) => r.id === id);
  const { timeZone, dayBoundaryHour } = COUNTRIES[LAUNCH_COUNTRY];
  const now = new Date();
  const hour = localHour(now, timeZone);
  const today = dayKey(now, timeZone, dayBoundaryHour);
  const [sheet, setSheet] = useState<'export' | 'calendar' | null>(null);

  // Until clips are stored, a day is marked when the group chatted that day.
  const markedDays = useMemo(
    () => new Set((messages[id] ?? []).map((m) => dayKey(new Date(m.sentAt), timeZone, dayBoundaryHour))),
    [messages, id, timeZone, dayBoundaryHour],
  );

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
      <View style={styles.toolbar}>
        <Pressable hitSlop={12} onPress={() => router.back()} accessibilityLabel={t('back')}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={styles.toolbarRight}>
          <IconButton name="share-outline" label={t('share')} onPress={() => setSheet('export')} />
          <IconButton name="calendar-outline" label={t('calendar')} onPress={() => setSheet('calendar')} />
          <IconButton
            name="chatbubble-ellipses-outline"
            label={t('messages')}
            badge={(messages[id] ?? []).length > 0}
            onPress={() => router.push({ pathname: '/rooms/chat/[id]', params: { id: room.id } })}
          />
        </View>
      </View>
      <View style={styles.header}>
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
      <ExportSheet visible={sheet === 'export'} onClose={() => setSheet(null)} />
      <CalendarSheet
        visible={sheet === 'calendar'}
        onClose={() => setSheet(null)}
        today={today}
        markedDays={markedDays}
      />
    </Screen>
  );
}

function IconButton(props: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: boolean;
}) {
  return (
    <Pressable hitSlop={8} onPress={props.onPress} accessibilityLabel={props.label}>
      <Ionicons name={props.name} size={24} color={colors.text} />
      {props.badge && <View style={styles.badge} />}
    </Pressable>
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
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toolbarRight: { flexDirection: 'row', gap: space.lg },
  badge: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary },
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
