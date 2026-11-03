import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';
import { colors, radius, space } from '../theme';
import { PrimaryButton } from './ui';

// Takes a selfie with the front camera and hands back its file, to be used
// as a reaction on a message.
export function FaceReactionSheet(props: {
  visible: boolean;
  onClose: () => void;
  onTaken: (uri: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const take = async () => {
    if (!camera.current || busy) return;
    setBusy(true);
    try {
      // Reactions show as small circles, so a low-quality photo is enough.
      const photo = await camera.current.takePictureAsync({ quality: 0.3, skipProcessing: true });
      if (photo?.uri) props.onTaken(photo.uri);
      props.onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
      <Pressable style={styles.backdrop} onPress={props.onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{t('faceReaction')}</Text>
        {permission?.granted ? (
          <>
            <View style={styles.circle}>
              {props.visible && (
                <CameraView
                  ref={camera}
                  style={StyleSheet.absoluteFill}
                  facing="front"
                  mirror
                  onCameraReady={() => setReady(true)}
                />
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('takeReaction')}
              disabled={!ready || busy}
              onPress={take}
              style={({ pressed }) => [styles.shutter, (!ready || busy) && styles.off, pressed && styles.off]}
            >
              <View style={styles.shutterInner} />
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.body}>{t('cameraNeeded')}</Text>
            <View style={{ alignSelf: 'stretch' }}>
              <PrimaryButton
                label={t('allowCamera')}
                onPress={() =>
                  permission && !permission.canAskAgain ? Linking.openSettings() : requestPermission()
                }
              />
            </View>
          </>
        )}
        <Pressable onPress={props.onClose} hitSlop={8}>
          <Text style={styles.cancel}>{t('cancel')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const SIZE = 220;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    paddingBottom: space.xl + space.md,
    gap: space.md,
    alignItems: 'center',
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  body: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  shutter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent },
  off: { opacity: 0.5 },
  cancel: { color: colors.textMuted, fontSize: 16 },
});
