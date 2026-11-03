import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

// The time and one-line caption laid over a clip, centred.
export function ClipCaption(props: {
  hour: number;
  caption?: string;
  size?: 'small' | 'large';
  style?: StyleProp<ViewStyle>;
}) {
  const large = props.size !== 'small';
  return (
    <View style={[styles.wrap, props.style]} pointerEvents="none">
      <Text style={[styles.time, large ? styles.timeLarge : styles.timeSmall]}>{formatHour(props.hour)}</Text>
      {!!props.caption && (
        <Text style={[styles.caption, large ? styles.captionLarge : styles.captionSmall]} numberOfLines={1}>
          {props.caption}
        </Text>
      )}
    </View>
  );
}

const shadow = { textShadowColor: 'rgba(0,0,0,0.75)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } };

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  time: { color: '#fff', fontWeight: '800', letterSpacing: 1, fontVariant: ['tabular-nums'], ...shadow },
  timeLarge: { fontSize: 34 },
  timeSmall: { fontSize: 16 },
  caption: { color: '#fff', fontWeight: '600', textAlign: 'center', ...shadow },
  captionLarge: { fontSize: 22, marginTop: 2 },
  captionSmall: { fontSize: 12 },
});
