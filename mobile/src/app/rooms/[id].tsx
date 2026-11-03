import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarSheet } from '../../components/CalendarSheet';
import { ExportSheet } from '../../components/ExportSheet';
import { Screen, TextLink, Title } from '../../components/ui';
import { t } from '../../i18n';
import { dayKey, localHour } from '../../lib/day';
import { groupStreak } from '../../lib/streak';
import { COUNTRIES, LAUNCH_COUNTRY } from '../../lib/countries';
import { useAppState, type Clip } from '../../state/AppState';
import { ClipPlayer } from '../../components/ClipPlayer';
import { colors, radius, space } from '../../theme';

type Cell = { kind: 'member'; name: string; isMe: boolean; clip?: Clip } | { kind: 'invite' };

// The group's view of the current hour: one tile per member, the viewer's
// own tile is where they record, and a spare tile invites friends.
export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rooms, messages, clips, me } = useAppState();
  const room = rooms.find((r) => r.id === id);
  const { timeZone, dayBoundaryHour } = COUNTRIES[LAUNCH_COUNTRY];
  const now = new Date();
  const hour = localHour(now, timeZone);
  const today = dayKey(now, timeZone, dayBoundaryHour);
  const [sheet, setSheet] = useState<'export' | 'calendar' | null>(null);

  const log = clips[id] ?? {};
  const thisHour = log[today]?.[hour] ?? [];
  // Who recorded on each day, for the streak.
  const postersByDay = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(clips[id] ?? {}).map(([day, hours]) => [
          day,
          Object.values(hours).flat().map((c) => c.author),
        ]),
      ),
    [clips, id],
  );
  const streak = room ? groupStreak(postersByDay, room.members.length, today) : 0;
  // Days with clips are marked; until recording uploads exist, days the
  // group chatted are marked too.
  const markedDays = useMemo(
    () =>
      new Set([
        ...Object.keys(postersByDay),
        ...(messages[id] ?? []).map((m) => dayKey(new Date(m.sentAt), timeZone, dayBoundaryHour)),
      ]),
    [postersByDay, messages, id, timeZone, dayBoundaryHour],
  );

  const cells = useMemo<Cell[]>(() => {
    if (!room) return [];
    const members: Cell[] = room.members.map((name) => ({
      kind: 'member',
      name,
      isMe: name === me,
      clip: thisHour.find((c) => c.author === name),
    }));
    return room.members.length < room.capacity ? [...members, { kind: 'invite' }] : members;
  }, [room, me, thisHour]);

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
        <View style={styles.subRow}>
          <Text style={styles.hour}>{`${String(hour).padStart(2, '0')}:00`}</Text>
          <Pressable
            style={styles.streak}
            onPress={() => Alert.alert(t('streak', { count: streak }), t('streakHint'))}
            accessibilityLabel={t('streak', { count: streak })}
          >
            <Ionicons name="flame" size={16} color={streak ? colors.accent : colors.textMuted} />
            <Text style={[styles.streakText, !streak && styles.streakOff]}>
              {t('streak', { count: streak })}
            </Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={cells}
        numColumns={2}
        keyExtractor={(c, i) => (c.kind === 'member' ? c.name : 'invite') + i}
        columnWrapperStyle={{ gap: space.sm }}
        contentContainerStyle={{ gap: space.sm }}
        renderItem={({ item }) => (
          <Tile
            cell={item}
            onRecord={() => router.push({ pathname: '/rooms/record/[id]', params: { id: room.id } })}
          />
        )}
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

function Tile({ cell, onRecord }: { cell: Cell; onRecord: () => void }) {
  if (cell.kind === 'invite') {
    return (
      <Pressable style={[styles.tile, styles.inviteTile]} onPress={() => {}}>
        <Text style={styles.plus}>+</Text>
        <Text style={styles.tileMeta}>{t('inviteFriend')}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      style={[styles.tile, cell.isMe && styles.myTile]}
      onPress={cell.isMe ? onRecord : undefined}
    >
      {cell.clip && <ClipPlayer uri={cell.clip.uri} style={StyleSheet.absoluteFill} />}
      <Text style={[styles.tileName, cell.clip && styles.onVideo]}>{cell.name}</Text>
      <View style={styles.tileFooter}>
        {cell.isMe && !cell.clip && <Ionicons name="videocam" size={16} color={colors.accent} />}
        <Text style={[styles.tileMeta, cell.clip && styles.onVideo]}>
          {cell.clip
            ? cell.isMe
              ? t('retake')
              : ''
            : cell.isMe
              ? t('tapToRecord')
              : t('noClipYet')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toolbarRight: { flexDirection: 'row', gap: space.lg },
  badge: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary },
  header: { gap: space.xs },
  hour: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  streakOff: { color: colors.textMuted },
  tileFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onVideo: { textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 },
  tile: {
    flex: 1,
    // Clips are landscape, so tiles are too.
    aspectRatio: 16 / 9,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.sm,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  myTile: { borderColor: colors.accent, borderWidth: 2 },
  inviteTile: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderColor: colors.border, borderWidth: 1 },
  plus: { color: colors.accent, fontSize: 28, fontWeight: '300' },
  tileName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  tileMeta: { color: colors.textMuted, fontSize: 13 },
});
