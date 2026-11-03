import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { currentLanguage, t } from '../i18n';
import { colors, radius, space } from '../theme';

// Month view of the group's days. Days in `markedDays` (YYYY-MM-DD, in the
// group's 4:00-to-4:00 day) get a mark; today is highlighted.
export function CalendarSheet(props: {
  visible: boolean;
  onClose: () => void;
  today: string;
  markedDays: Set<string>;
}) {
  const [ty, tm] = props.today.split('-').map(Number);
  const [month, setMonth] = useState({ y: ty, m: tm });

  const weeks = useMemo(() => {
    const first = new Date(Date.UTC(month.y, month.m - 1, 1)).getUTCDay();
    const days = new Date(Date.UTC(month.y, month.m, 0)).getUTCDate();
    const cells: (number | null)[] = [
      ...Array<null>(first).fill(null),
      ...Array.from({ length: days }, (_, i) => i + 1),
    ];
    while (cells.length % 7) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [month]);

  const locale = currentLanguage();
  const title = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(month.y, month.m - 1, 1)),
  );
  // 2026-11-01 is a Sunday, so these are Sunday-first weekday names.
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2026, 10, 1 + i)),
    ),
  );
  const shift = (d: number) =>
    setMonth(({ y, m }) => {
      const n = y * 12 + (m - 1) + d;
      return { y: Math.floor(n / 12), m: (n % 12) + 1 };
    });
  const key = (d: number) =>
    `${month.y}-${String(month.m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
      <Pressable style={styles.backdrop} onPress={props.onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.monthRow}>
          <Pressable hitSlop={12} onPress={() => shift(-1)}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.month}>{title}</Text>
          <Pressable hitSlop={12} onPress={() => shift(1)}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.row}>
          {weekdays.map((w, i) => (
            <Text key={i} style={styles.weekday}>{w}</Text>
          ))}
        </View>
        {weeks.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((d, c) => {
              if (d === null) return <View key={c} style={styles.cell} />;
              const k = key(d);
              const isToday = k === props.today;
              const marked = props.markedDays.has(k);
              return (
                <View key={c} style={styles.cell}>
                  <View style={[styles.day, isToday && styles.today]}>
                    <Text style={[styles.dayText, isToday && styles.todayText]}>{d}</Text>
                  </View>
                  <View style={[styles.mark, marked && styles.markOn]} />
                </View>
              );
            })}
          </View>
        ))}
        <Text style={styles.hint}>{t('calendarDayHint')}</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    paddingBottom: space.xl + space.md,
    gap: space.sm,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  month: { color: colors.text, fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', color: colors.textMuted, fontSize: 12 },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 4, gap: 3 },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  today: { backgroundColor: colors.accent },
  dayText: { color: colors.text, fontSize: 15 },
  todayText: { color: colors.accentText, fontWeight: '700' },
  mark: { width: 6, height: 6, borderRadius: 3 },
  markOn: { backgroundColor: colors.secondary },
  hint: { color: colors.textMuted, fontSize: 13, marginTop: space.sm, textAlign: 'center' },
});
