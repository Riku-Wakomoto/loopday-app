import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';
import { REPORT_REASONS, useAppState, type ReportReason } from '../state/AppState';
import { colors, radius, space } from '../theme';

export interface SafetyTarget {
  roomId: string;
  member: string;
  messageId?: string;
  clipRecordedAt?: number;
}

const REASON_LABEL: Record<ReportReason, Parameters<typeof t>[0]> = {
  nudity: 'reasonNudity',
  bullying: 'reasonBullying',
  violence: 'reasonViolence',
  privacy: 'reasonPrivacy',
  illegal: 'reasonIllegal',
  other: 'reasonOther',
};

// Report a clip or message, or block the member who posted it. Required for
// apps with user-generated content (App Store guideline 1.2, Play UGC policy).
export function SafetySheet(props: { target: SafetyTarget | null; onClose: () => void }) {
  const { report, block } = useAppState();
  const [step, setStep] = useState<'menu' | 'reasons'>('menu');
  const target = props.target;

  useEffect(() => {
    if (target) setStep('menu');
  }, [target]);

  const close = () => props.onClose();

  return (
    <Modal visible={target !== null} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={styles.sheet}>
        {target && step === 'menu' && (
          <>
            <Row label={t('report')} onPress={() => setStep('reasons')} />
            <Row
              label={t('blockMember', { name: target.member })}
              danger
              onPress={() =>
                Alert.alert(t('blockMember', { name: target.member }), t('blockConfirm'), [
                  { text: t('cancel'), style: 'cancel' },
                  {
                    text: t('block'),
                    style: 'destructive',
                    onPress: () => {
                      block(target.member);
                      close();
                    },
                  },
                ])
              }
            />
          </>
        )}
        {target && step === 'reasons' && (
          <>
            <Text style={styles.title}>{t('reportWhy')}</Text>
            {REPORT_REASONS.map((reason) => (
              <Row
                key={reason}
                label={t(REASON_LABEL[reason])}
                onPress={() => {
                  report({
                    roomId: target.roomId,
                    reportedMember: target.member,
                    messageId: target.messageId,
                    clipRecordedAt: target.clipRecordedAt,
                    reason,
                  });
                  close();
                  Alert.alert(t('reportThanksTitle'), t('reportThanks'));
                }}
              />
            ))}
          </>
        )}
        <Pressable onPress={close} hitSlop={8}>
          <Text style={styles.cancel}>{t('cancel')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function Row(props: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.rowLabel, props.danger && { color: colors.danger }]}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    paddingBottom: space.xl,
    gap: space.sm,
  },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: space.xs },
  row: { backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: space.md },
  rowLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  cancel: { color: colors.textMuted, fontSize: 16, textAlign: 'center', marginTop: space.sm },
});
