import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Field, PrimaryButton, Screen, TextLink, Title } from '../../components/ui';
import { t } from '../../i18n';
import { useAppState } from '../../state/AppState';
import { colors, radius, space } from '../../theme';

// Capacity includes the creator. 20 is the MVP group limit.
const SIZES = [
  { capacity: 1, label: () => t('roomSizeSolo') },
  { capacity: 2, label: () => '2' },
  { capacity: 3, label: () => '3' },
  { capacity: 4, label: () => '4' },
  { capacity: 5, label: () => '5' },
  { capacity: 20, label: () => t('roomSizeLarge') },
];

export default function NewRoom() {
  const { createRoom } = useAppState();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(3);

  return (
    <Screen>
      <Title>{t('newRoomTitle')}</Title>
      <Field value={name} onChangeText={setName} placeholder={t('roomNamePlaceholder')} maxLength={40} />
      <Body muted>{t('roomSize')}</Body>
      <View style={styles.sizes}>
        {SIZES.map((s) => (
          <Pressable
            key={s.capacity}
            accessibilityRole="radio"
            accessibilityState={{ selected: capacity === s.capacity }}
            onPress={() => setCapacity(s.capacity)}
            style={[styles.chip, capacity === s.capacity && styles.chipOn]}
          >
            <Text style={[styles.chipText, capacity === s.capacity && styles.chipTextOn]}>
              {s.label()}
            </Text>
          </Pressable>
        ))}
      </View>
      {capacity > 1 && (
        <Body muted>{t('roomSizeSummary', { count: capacity === 20 ? '5–19' : capacity - 1 })}</Body>
      )}
      <View style={{ flex: 1 }} />
      <PrimaryButton
        label={t('createRoom')}
        disabled={name.trim().length === 0}
        onPress={() => {
          const room = createRoom(name.trim(), capacity);
          router.replace({ pathname: '/rooms/[id]', params: { id: room.id } });
        }}
      />
      <TextLink label={t('back')} onPress={() => router.back()} />
      <View style={{ height: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sizes: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: 12,
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 17, fontWeight: '600' },
  chipTextOn: { color: colors.accentText },
});
