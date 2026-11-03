import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { t } from '../i18n';
import { colors, radius, space } from '../theme';
import { PrimaryButton } from './ui';

const SPEEDS = ['speedSlow', 'speedNormal', 'speedFast'] as const;
const BACKGROUNDS = ['#0E1420', '#F4F1EA', '#FFB547', '#FF7A6B', '#5B8CFF', '#3DBE8B'];

// Options for exporting the day's vlog. Rendering comes with the recording
// milestone; for now the options are kept and the button explains that.
export function ExportSheet(props: { visible: boolean; onClose: () => void }) {
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>('speedNormal');
  const [showNames, setShowNames] = useState(true);
  const [hideTime, setHideTime] = useState(false);
  const [background, setBackground] = useState(BACKGROUNDS[0]);
  const [credit, setCredit] = useState(true);

  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
      <Pressable style={styles.backdrop} onPress={props.onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <Text style={styles.title}>{t('exportTitle')}</Text>

        <Text style={styles.label}>{t('exportSpeed')}</Text>
        <View style={styles.segment}>
          {SPEEDS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setSpeed(s)}
              style={[styles.segmentItem, speed === s && styles.segmentOn]}
            >
              <Text style={[styles.segmentText, speed === s && styles.segmentTextOn]}>{t(s)}</Text>
            </Pressable>
          ))}
        </View>

        <Row label={t('exportShowNames')} value={showNames} onChange={setShowNames} />
        <Row label={t('exportHideTime')} value={hideTime} onChange={setHideTime} />

        <Text style={styles.label}>{`${t('exportBackground')} · ${t('exportBackgroundColor')}`}</Text>
        <View style={styles.swatches}>
          {BACKGROUNDS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setBackground(c)}
              style={[styles.swatch, { backgroundColor: c }, background === c && styles.swatchOn]}
            />
          ))}
        </View>

        <Row label={t('exportCredit')} value={credit} onChange={setCredit} />
        <Text style={styles.note}>{t('exportCreditNote')}</Text>

        <PrimaryButton
          label={t('share')}
          onPress={() => Alert.alert(t('exportTitle'), t('exportNotReady'))}
        />
      </View>
    </Modal>
  );
}

function Row(props: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{props.label}</Text>
      <Switch
        value={props.value}
        onValueChange={props.onChange}
        trackColor={{ true: colors.accent, false: colors.border }}
      />
    </View>
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
    gap: space.md,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  label: { color: colors.textMuted, fontSize: 14 },
  segment: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: radius.pill, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center' },
  segmentOn: { backgroundColor: colors.surfaceRaised },
  segmentText: { color: colors.textMuted, fontSize: 15 },
  segmentTextOn: { color: colors.text, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  rowLabel: { color: colors.text, fontSize: 16, flex: 1 },
  swatches: { flexDirection: 'row', gap: space.sm },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: colors.border },
  swatchOn: { borderColor: colors.accent, borderWidth: 3 },
  note: { color: colors.textMuted, fontSize: 12, marginTop: -space.sm },
});
