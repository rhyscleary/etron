import React, { useMemo, useState } from "react";
import { StyleSheet, Pressable } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

const Backdrop = ({
  animatedIndex,
  style,
  blurIntensity = 70,
  blurTint = "dark",
  blockAboveIndex = 0,
  onPress, // optional - can close sheet
}) => {
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
      <Animated.View style={[StyleSheet.absoluteFill, styles.tintOverlay]} />
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
    backgroundColor: "rgba(168,181,235,0.35)", // previous #a8b5eb with alpha
  },
});