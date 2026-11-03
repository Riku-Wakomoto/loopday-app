import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions, useMicrophonePermissions, type CameraType } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatHour } from '../../../components/ClipCaption';
import { ClipPlayer } from '../../../components/ClipPlayer';
import { PrimaryButton } from '../../../components/ui';
import { t } from '../../../i18n';
import { COUNTRIES, LAUNCH_COUNTRY } from '../../../lib/countries';
import { localHour } from '../../../lib/day';
import { useAppState } from '../../../state/AppState';
import { colors, radius, space } from '../../../theme';

const CLIP_SECONDS = 2;
const CAPTION_MAX = 30;

// Records this hour's 2-second clip, then lets you keep it or retake.
export default function RecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addClip } = useAppState();
  const [cameraPermission, requestCamera] = useCameraPermissions();
  const [micPermission, requestMic] = useMicrophonePermissions();
  const camera = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [taken, setTaken] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const hour = localHour(new Date(), COUNTRIES[LAUNCH_COUNTRY].timeZone);
  const progress = useRef(new Animated.Value(0)).current;

  // The camera is required; without the microphone the clip is recorded silent.
  const granted = cameraPermission?.granted ?? false;
  const micGranted = micPermission?.granted ?? false;

  // Ask for the microphone once the camera is allowed, without blocking.
  useEffect(() => {
    if (granted && micPermission && !micPermission.granted && micPermission.canAskAgain) {
      requestMic();
    }
  }, [granted, micPermission, requestMic]);

  // Some devices are slow to report the camera as ready; don't lock the
  // shutter forever if the event never arrives.
  useEffect(() => {
    if (!granted || taken) return;
    const timer = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(timer);
  }, [granted, taken, facing]);

  useEffect(() => {
    if (!recording) return;
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: CLIP_SECONDS * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [recording, progress]);

  const record = async () => {
    if (!camera.current || recording) return;
    setRecording(true);
    try {
      const video = await camera.current.recordAsync({ maxDuration: CLIP_SECONDS });
      if (video?.uri) setTaken(video.uri);
      else Alert.alert(t('recordFailed'));
    } catch (e) {
      Alert.alert(t('recordFailed'), e instanceof Error ? e.message : String(e));
    } finally {
      setRecording(false);
    }
  };

  if (!granted) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.permission}>
          <Ionicons name="videocam-outline" size={48} color={colors.accent} style={{ alignSelf: 'center' }} />
          <Text style={styles.permissionText}>{t('recordPermission')}</Text>
          <PrimaryButton
            label={t('allowCamera')}
            onPress={async () => {
              // Once denied, iOS only lets the user change it in Settings.
              if (cameraPermission && !cameraPermission.canAskAgain) {
                Linking.openSettings();
                return;
              }
              const result = await requestCamera();
              if (result.granted && !micGranted) await requestMic();
            }}
          />
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ alignSelf: 'center' }}>
            <Text style={styles.cancel}>{t('cancel')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.frame}>
        {taken ? (
          <ClipPlayer uri={taken} style={StyleSheet.absoluteFill} muted={false} />
        ) : (
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing={facing}
            mode="video"
            mute={!micGranted}
            mirror={facing === 'front'}
            onCameraReady={() => setReady(true)}
          />
        )}
        <Animated.View
          style={[
            styles.progress,
            { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            !recording && { opacity: 0 },
          ]}
        />
      </View>

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.overlayInner}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <View style={styles.topBar}>
          <Pressable hitSlop={12} onPress={() => router.back()} accessibilityLabel={t('cancel')}>
            <Ionicons name="close" size={30} color="#fff" />
          </Pressable>
          <Text style={styles.hint}>{recording ? t('recording') : taken ? '' : t('recordHint')}</Text>
          <View style={{ width: 30 }} />
        </View>

        {taken && (
          <Pressable style={styles.captionArea} onPress={Keyboard.dismiss}>
            <Text style={styles.captionTime}>{formatHour(hour)}</Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder={t('captionPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.7)"
              maxLength={CAPTION_MAX}
              returnKeyType="done"
              blurOnSubmit
              style={styles.captionInput}
            />
          </Pressable>
        )}

        {taken ? (
          <View style={styles.reviewBar}>
            <Pressable
              style={styles.secondary}
              onPress={() => {
                setTaken(null);
                setCaption('');
              }}
            >
              <Ionicons name="refresh" size={20} color={colors.text} />
              <Text style={styles.secondaryText}>{t('retake')}</Text>
            </Pressable>
            <Pressable
              style={styles.primary}
              onPress={() => {
                addClip(id, taken, caption.trim());
                router.back();
              }}
            >
              <Text style={styles.primaryText}>{t('useClip')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.shutterBar}>
            <View style={{ width: 44 }} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('tapToRecord')}
              onPress={record}
              disabled={recording}
              style={[styles.shutter, recording && styles.shutterOn, !ready && styles.notReady]}
            >
              <View style={[styles.shutterInner, recording && styles.shutterInnerOn]} />
            </Pressable>
            <Pressable
              hitSlop={12}
              disabled={recording}
              onPress={() => {
                setReady(false);
                setFacing((f) => (f === 'back' ? 'front' : 'back'));
              }}
              accessibilityLabel={t('flipCamera')}
              style={styles.flip}
            >
              <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
            </Pressable>
          </View>
        )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  frame: { flex: 1 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'space-between' },
  overlayInner: { flex: 1, justifyContent: 'space-between' },
  captionArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  captionTime: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowRadius: 6,
  },
  captionInput: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 220,
    paddingVertical: space.sm,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowRadius: 6,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingTop: space.sm,
  },
  hint: { color: '#fff', fontSize: 15, fontWeight: '600', textShadowColor: '#000', textShadowRadius: 4 },
  progress: { position: 'absolute', top: 0, left: 0, height: 4, backgroundColor: colors.accent },
  shutterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingBottom: space.lg,
  },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOn: { borderColor: colors.accent },
  notReady: { opacity: 0.5 },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.secondary },
  shutterInnerOn: { width: 30, height: 30, borderRadius: 8 },
  flip: { width: 44, alignItems: 'center' },
  reviewBar: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.lg },
  secondary: {
    flex: 1,
    flexDirection: 'row',
    gap: space.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(24,33,51,0.85)',
    borderRadius: radius.pill,
    paddingVertical: space.md,
  },
  secondaryText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  primary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: space.md,
  },
  primaryText: { color: colors.accentText, fontSize: 16, fontWeight: '700' },
  permission: { flex: 1, alignItems: 'stretch', justifyContent: 'center', gap: space.lg, padding: space.lg },
  permissionText: { color: colors.text, fontSize: 16, textAlign: 'center', lineHeight: 23 },
  cancel: { color: colors.textMuted, fontSize: 16 },
});
