import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ElementRef } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipCaption, formatHour } from '../../../components/ClipCaption';
import { ClipPlayer } from '../../../components/ClipPlayer';
import { FaceReactionSheet } from '../../../components/FaceReactionSheet';
import { SafetySheet, type SafetyTarget } from '../../../components/SafetySheet';
import { t } from '../../../i18n';
import { COUNTRIES, LAUNCH_COUNTRY } from '../../../lib/countries';
import { useAppState, type Message } from '../../../state/AppState';
import { colors, radius, space } from '../../../theme';

// The group's chat. Messages are in memory until the Supabase milestone.
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rooms, messages, sendMessage, toggleHeart, setFaceReaction, me, blocked } = useAppState();
  const room = rooms.find((r) => r.id === id);
  // Messages from members I blocked are hidden.
  const list = (messages[id] ?? []).filter((m) => !blocked.includes(m.author));
  const [safety, setSafety] = useState<SafetyTarget | null>(null);
  const [text, setText] = useState('');
  // The message being reacted to with a selfie.
  const [faceFor, setFaceFor] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const input = useRef<ElementRef<typeof TextInput>>(null);
  const byId = new Map(list.map((m) => [m.id, m]));

  const send = () => {
    const body = text.trim();
    if (!body) return;
    sendMessage(id, body, replyTo?.id);
    setText('');
    setReplyTo(null);
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
              mine={item.author === me}
              me={me}
              quoted={item.replyTo ? byId.get(item.replyTo) : undefined}
              onHeart={() => toggleHeart(id, item.id)}
              onFace={() => setFaceFor(item.id)}
              onReply={() => {
                setReplyTo(item);
                input.current?.focus();
              }}
              onReport={() =>
                setSafety({
                  roomId: id,
                  member: item.author,
                  messageId: item.id,
                  clipRecordedAt: item.clip?.recordedAt,
                })
              }
            />
          )}
        />

        {replyTo && (
          <View style={styles.replyBar}>
            <Ionicons name="arrow-undo" size={14} color={colors.accent} />
            <Text style={styles.replyBarText} numberOfLines={1}>
              {`${t('replyingTo', { name: replyTo.author })}: ${preview(replyTo)}`}
            </Text>
            <Pressable hitSlop={8} onPress={() => setReplyTo(null)} accessibilityLabel={t('cancel')}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        )}
        <View style={styles.inputBar}>
          <Pressable
            hitSlop={8}
            onPress={() => router.push({ pathname: '/rooms/record/[id]', params: { id } })}
            accessibilityLabel={t('tapToRecord')}
          >
            <Ionicons name="camera-outline" size={26} color={colors.textMuted} />
          </Pressable>
          <TextInput
            ref={input}
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
      <SafetySheet target={safety} onClose={() => setSafety(null)} />
      <FaceReactionSheet
        visible={faceFor !== null}
        onClose={() => setFaceFor(null)}
        onTaken={(uri) => faceFor && setFaceReaction(id, faceFor, uri)}
      />
    </SafeAreaView>
  );
}

function preview(m: Message): string {
  if (m.clip) return `🎬 ${formatHour(m.clip.hour)}${m.clip.caption ? ` ${m.clip.caption}` : ''}`;
  return m.text;
}

function Bubble(props: {
  message: Message;
  mine: boolean;
  me: string;
  quoted?: Message;
  onHeart: () => void;
  onFace: () => void;
  onReply: () => void;
  onReport: () => void;
}) {
  const { message, mine } = props;
  const entries = Object.entries(message.reactions);
  const hearts = entries.filter(([, r]) => r.kind === 'heart').length;
  const faces = entries.flatMap(([name, r]) => (r.kind === 'face' ? [{ name, uri: r.uri }] : []));
  const myHeart = message.reactions[props.me]?.kind === 'heart';
  const time = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: COUNTRIES[LAUNCH_COUNTRY].timeZone,
  }).format(new Date(message.sentAt));

  if (message.clip) {
    return (
      <View style={styles.clipItem}>
        <Pressable onLongPress={props.onFace} style={styles.clipCard}>
          <ClipPlayer uri={message.clip.uri} style={StyleSheet.absoluteFill} />
          <View style={styles.clipShade} />
          <ClipCaption hour={message.clip.hour} caption={message.clip.caption} />
          <View style={styles.clipAuthor}>
            <Avatar name={message.author} />
            <Text style={styles.clipAuthorName} numberOfLines={1}>
              {message.author}
            </Text>
          </View>
          <View style={styles.clipActions}>
            <Pressable hitSlop={10} onPress={props.onReply} accessibilityLabel={t('reply')}>
              <Ionicons name="arrow-undo-outline" size={26} color="#fff" />
            </Pressable>
            <Pressable hitSlop={10} onPress={props.onHeart} style={styles.clipHeart}>
              <Ionicons name={myHeart ? 'heart' : 'heart-outline'} size={26} color={myHeart ? colors.secondary : '#fff'} />
              {hearts > 0 && <Text style={styles.clipCount}>{hearts}</Text>}
            </Pressable>
            <Pressable hitSlop={10} onPress={props.onFace} accessibilityLabel={t('faceReaction')}>
              <Ionicons name="happy-outline" size={26} color="#fff" />
            </Pressable>
            {!mine && (
              <Pressable hitSlop={10} onPress={props.onReport} accessibilityLabel={t('report')}>
                <Ionicons name="flag-outline" size={22} color="#fff" />
              </Pressable>
            )}
          </View>
        </Pressable>
        {faces.length > 0 && (
          <View style={styles.clipFaces}>
            {faces.map((f, i) => (
              <Image
                key={f.name}
                source={{ uri: f.uri }}
                style={[styles.clipFace, { marginTop: i === 0 ? 0 : -14 }]}
                accessibilityLabel={f.name}
              />
            ))}
          </View>
        )}
        <Text style={[styles.time, styles.clipTime]}>{time}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.item, mine && styles.itemMine]}>
      {!mine && <Text style={styles.author}>{message.author}</Text>}
      {props.quoted && (
        <View style={[styles.quote, mine && styles.quoteMine]}>
          <Text style={styles.quoteText} numberOfLines={1}>
            {`${props.quoted.author}: ${preview(props.quoted)}`}
          </Text>
        </View>
      )}
      <Pressable
        onLongPress={props.onFace}
        style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}
      >
        <Text style={[styles.text, mine && styles.textMine]}>{message.text}</Text>
      </Pressable>
      {faces.length > 0 && (
        <View style={[styles.faces, mine && styles.metaMine]}>
          {faces.map((f) => (
            <Image key={f.name} source={{ uri: f.uri }} style={styles.face} accessibilityLabel={f.name} />
          ))}
        </View>
      )}
      <View style={[styles.meta, mine && styles.metaMine]}>
        <Text style={styles.time}>{time}</Text>
        <Pressable hitSlop={8} onPress={props.onHeart} style={styles.heart}>
          <Ionicons
            name={myHeart ? 'heart' : 'heart-outline'}
            size={16}
            color={hearts ? colors.secondary : colors.textMuted}
          />
          {hearts > 0 && <Text style={styles.time}>{hearts}</Text>}
        </Pressable>
        <Pressable hitSlop={8} onPress={props.onFace} accessibilityLabel={t('faceReaction')}>
          <Ionicons name="happy-outline" size={17} color={colors.textMuted} />
        </Pressable>
        <Pressable hitSlop={8} onPress={props.onReply} accessibilityLabel={t('reply')}>
          <Ionicons name="arrow-undo-outline" size={16} color={colors.textMuted} />
        </Pressable>
        {!mine && (
          <Pressable hitSlop={8} onPress={props.onReport} accessibilityLabel={t('report')}>
            <Ionicons name="flag-outline" size={15} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Until profile photos exist, members get a coloured initial.
const AVATAR_COLORS = ['#FFB547', '#FF7A6B', '#5B8CFF', '#3DBE8B', '#B07CFF', '#F06FB0'];
function Avatar({ name }: { name: string }) {
  const color = AVATAR_COLORS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      <Text style={styles.avatarText}>{[...name][0]?.toUpperCase() ?? '?'}</Text>
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
  faces: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  face: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: colors.accent },
  clipItem: { alignSelf: 'stretch', gap: 4 },
  clipCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  clipShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.12)' },
  clipAuthor: {
    position: 'absolute',
    top: space.sm,
    left: space.sm,
    right: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  clipAuthorName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowRadius: 4,
    flexShrink: 1,
  },
  clipActions: {
    position: 'absolute',
    right: space.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    gap: space.md,
    alignItems: 'center',
  },
  clipHeart: { alignItems: 'center' },
  clipCount: { color: '#fff', fontSize: 11, fontWeight: '700' },
  clipFaces: { position: 'absolute', left: -6, top: -10 },
  clipFace: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: colors.background },
  clipTime: { alignSelf: 'flex-end' },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarText: { color: colors.accentText, fontWeight: '800', fontSize: 14 },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    paddingLeft: space.sm,
    paddingVertical: 2,
  },
  quoteMine: { alignSelf: 'flex-end' },
  quoteText: { color: colors.textMuted, fontSize: 12 },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
  },
  replyBarText: { flex: 1, color: colors.textMuted, fontSize: 13 },
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
