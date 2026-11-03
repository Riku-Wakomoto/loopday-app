import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '../../../i18n';
import { COUNTRIES, LAUNCH_COUNTRY } from '../../../lib/countries';
import { useAppState, type Message } from '../../../state/AppState';
import { colors, radius, space } from '../../../theme';

const HEART = '❤️';

// The group's chat. Messages are in memory until the Supabase milestone.
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rooms, messages, sendMessage, toggleReaction, profile } = useAppState();
  const room = rooms.find((r) => r.id === id);
  const list = messages[id] ?? [];
  const [text, setText] = useState('');

  const send = () => {
    const body = text.trim();
    if (!body) return;
    sendMessage(id, body);
    setText('');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {room?.name ?? t('messages')}
          </Text>
          <View style={{ width: 26 }} />
        </View>

        <FlatList
          data={[...list].reverse()}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('noMessages')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Bubble
              message={item}
              mine={item.author === profile?.displayName}
              onHeart={() => toggleReaction(id, item.id, HEART)}
            />
          )}
        />

        <View style={styles.inputBar}>
          <Pressable hitSlop={8} onPress={() => {}} accessibilityLabel="camera">
            <Ionicons name="camera-outline" size={26} color={colors.textMuted} />
          </Pressable>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={t('messagePlaceholder')}
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={send}
            returnKeyType="send"
            multiline
          />
          <Pressable
            hitSlop={8}
            onPress={send}
            disabled={!text.trim()}
            accessibilityLabel={t('send')}
          >
            <Ionicons name="arrow-up-circle" size={32} color={text.trim() ? colors.accent : colors.border} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble(props: { message: Message; mine: boolean; onHeart: () => void }) {
  const { message, mine } = props;
  const hearts = Object.values(message.reactions).filter((e) => e === HEART).length;
  const time = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: COUNTRIES[LAUNCH_COUNTRY].timeZone,
  }).format(new Date(message.sentAt));

  return (
    <View style={[styles.item, mine && styles.itemMine]}>
      {!mine && <Text style={styles.author}>{message.author}</Text>}
      <Pressable
        onLongPress={props.onHeart}
        style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}
      >
        <Text style={[styles.text, mine && styles.textMine]}>{message.text}</Text>
      </Pressable>
      <View style={[styles.meta, mine && styles.metaMine]}>
        <Text style={styles.time}>{time}</Text>
        <Pressable hitSlop={8} onPress={props.onHeart} style={styles.heart}>
          <Ionicons
            name={hearts ? 'heart' : 'heart-outline'}
            size={16}
            color={hearts ? colors.secondary : colors.textMuted}
          />
          {hearts > 0 && <Text style={styles.time}>{hearts}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  list: { padding: space.md, gap: space.md, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg, transform: [{ scaleY: -1 }] },
  emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
  item: { alignItems: 'flex-start', gap: 4, maxWidth: '80%' },
  itemMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  author: { color: colors.textMuted, fontSize: 12 },
  bubble: { borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOther: { backgroundColor: colors.surfaceRaised },
  bubbleMine: { backgroundColor: colors.accent },
  text: { color: colors.text, fontSize: 16, lineHeight: 22 },
  textMine: { color: colors.accentText },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  metaMine: { flexDirection: 'row-reverse' },
  time: { color: colors.textMuted, fontSize: 11 },
  heart: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: space.md,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
  },
});
