import React, { useMemo, useRef, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

export const transformOrigin = ({ x, y }, ...transformations) => {
  "worklet";
  return [
    { translateX: x },
    { translateY: y },
    ...transformations,
    { translateX: x * -1 },
    { translateY: y * -1 },
  ];
};

const ANGLE_30 = Math.PI / 6;

const Handle = ({ style, animatedIndex, haptics = true }) => {
  const hasFiredRef = useRef(false);

  // TODO: test different haptics (light, medium, heavy, rigid, etc.), create haptics utility if being used in app more.
  const fireHaptic = useCallback(() => {
    if (!haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [haptics]);

  // animations
  const indicatorTransformOriginY = useDerivedValue(() =>
    interpolate(animatedIndex.value, [0, 1, 2], [-1, 0, 1], Extrapolate.CLAMP)
  );

  const containerStyle = useMemo(() => [styles.header, style], [style]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const borderTopRadius = interpolate(
      animatedIndex.value,
      [1, 2],
      [20, 0],
      Extrapolate.CLAMP
    );
    return {
      borderTopLeftRadius: borderTopRadius,
      borderTopRightRadius: borderTopRadius,
    };
  });

  const leftIndicatorStyle = useMemo(
    () => ({ ...styles.indicator, ...styles.leftIndicator }),
    []
  );
  const leftIndicatorAnimatedStyle = useAnimatedStyle(() => {
    const leftIndicatorRotate = interpolate(
      animatedIndex.value,
      [0, 1, 2],
      [-ANGLE_30, 0, ANGLE_30],
      Extrapolate.CLAMP
    );
    return {
      transform: transformOrigin(
        { x: 0, y: indicatorTransformOriginY.value },
        { rotate: `${leftIndicatorRotate}rad` },
        { translateX: -5 }
      ),
    };
  });

  const rightIndicatorStyle = useMemo(
    () => ({ ...styles.indicator, ...styles.rightIndicator }),
    []
  );
  const rightIndicatorAnimatedStyle = useAnimatedStyle(() => {
    const rightIndicatorRotate = interpolate(
      animatedIndex.value,
      [0, 1, 2],
      [ANGLE_30, 0, -ANGLE_30],
      Extrapolate.CLAMP
    );
    return {
      transform: transformOrigin(
        { x: 0, y: indicatorTransformOriginY.value },
        { rotate: `${rightIndicatorRotate}rad` },
        { translateX: 5 }
      ),
    };
  });

  const onTouchStart = () => {
    if (!hasFiredRef.current) {
      hasFiredRef.current = true;
      fireHaptic();
    }
  };
  const onTouchEnd = () => {
    hasFiredRef.current = false;
  };

  return (
    <Animated.View
      style={[containerStyle, containerAnimatedStyle]}
      renderToHardwareTextureAndroid
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Animated.View style={[leftIndicatorStyle, leftIndicatorAnimatedStyle]} />
      <Animated.View style={[rightIndicatorStyle, rightIndicatorAnimatedStyle]} />
    </Animated.View>
  );
};

export default Handle;

const styles = StyleSheet.create({
  header: {
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#999",
  },
  indicator: {
    position: "absolute",
    width: 10,
    height: 4,
    backgroundColor: "#999",
  },
  leftIndicator: {
    borderTopStartRadius: 2,
    borderBottomStartRadius: 2,
  },
  rightIndicator: {
    borderTopEndRadius: 2,
    borderBottomEndRadius: 2,
  },
});