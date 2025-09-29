import React, { useMemo, useState } from "react";
import { StyleSheet, Pressable } from "react-native";
import { useTheme } from 'react-native-paper';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { hexToRgba } from '../../utils/color';

const Backdrop = ({
  animatedIndex,
  style,
  blurIntensity = 70,
  blurTint = "dark",
  blockAboveIndex = 0,
  onPress, // optional - can close sheet
}) => {
  // TODO: move to utils
  const theme = useTheme();
  // prefer theme backdrop color else derive from primary
  const overlayColor = useMemo(() => {
    // TODO: input any needed colors
    // const base = theme?.colors?.backdrop || theme?.colors?.primary || '#000000';
    const base = theme?.colors?.focusedBackground || theme?.colors?.primary || '#000000';
    return hexToRgba(base, 0.35);
  }, [theme]);
  const opacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  const [blocking, setBlocking] = useState(false);
  const isBlocking = useDerivedValue(() => animatedIndex.value > blockAboveIndex, [blockAboveIndex]);
  useAnimatedReaction(
    () => isBlocking.value,
    (val) => {
      if (val !== blocking) {
        runOnJS(setBlocking)(val);
      }
    },
    [blocking]
  );
  const pointerEvents = blocking ? 'auto' : 'none';

  const containerStyle = useMemo(
    () => [style, styles.container, opacityStyle],
    [style, opacityStyle]
  );

  const Inner = (
    <Animated.View style={containerStyle} pointerEvents={pointerEvents}>
      <BlurView
        intensity={blurIntensity}
        tint={blurTint}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, styles.tintOverlay, { backgroundColor: overlayColor }]} />
    </Animated.View>
  );

  if (onPress && pointerEvents === 'auto') {
    return (
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress}>
        {Inner}
      </Pressable>
    );
  }
  return Inner;
};

export default Backdrop;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    flex: 1,
  },
  tintOverlay: {
  },
});