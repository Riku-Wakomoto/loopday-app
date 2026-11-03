import type { ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, space } from '../theme';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen}>
      {/* Keeps the bottom button above the keyboard, and tapping outside a
          field closes the keyboard. */}
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.inner}>{children}</View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && styles.muted]}>{children}</Text>;
}

export function PrimaryButton(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      disabled={props.disabled}
      style={({ pressed }) => [
        styles.button,
        props.disabled && styles.buttonDisabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.buttonLabel}>{props.label}</Text>
    </Pressable>
  );
}

export function TextLink(props: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={props.onPress} hitSlop={8}>
      <Text style={styles.link}>{props.label}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      {...props}
      style={[styles.field, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.md },
  title: { color: colors.text, fontSize: 28, fontWeight: '700', textAlign: 'auto' },
  body: { color: colors.text, fontSize: 16, lineHeight: 23, textAlign: 'auto' },
  muted: { color: colors.textMuted },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
  buttonLabel: { color: colors.accentText, fontSize: 17, fontWeight: '700' },
  link: { color: colors.accent, fontSize: 16, textAlign: 'center' },
  field: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 18,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    textAlign: 'auto',
  },
});
