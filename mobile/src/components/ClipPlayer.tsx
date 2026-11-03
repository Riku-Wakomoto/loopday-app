import { useVideoPlayer, VideoView } from 'expo-video';
import type { StyleProp, ViewStyle } from 'react-native';

// Loops a clip silently, like a live tile. Sound plays only in the vlog.
export function ClipPlayer(props: { uri: string; style?: StyleProp<ViewStyle>; muted?: boolean }) {
  const player = useVideoPlayer(props.uri, (p) => {
    p.loop = true;
    p.muted = props.muted ?? true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={props.style}
      contentFit="cover"
      nativeControls={false}
      allowsPictureInPicture={false}
      pointerEvents="none"
    />
  );
}
