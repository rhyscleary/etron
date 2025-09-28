import React, { useMemo, useRef, useCallback } from "react";
import { StyleSheet } from "react-native";
import { useTheme, IconButton } from "react-native-paper";
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

const Handle = ({
  style,
  animatedIndex,
  haptics = true,
  useSolidBackground = false,
  variant = 'standard', // 'standard' | 'compact'
  title,
  showClose = true,
  closeIcon = 'close',
  onClose,
}) => {
  const hasFiredRef = useRef(false);
  const theme = useTheme();

  // TODO: test different haptics (light, medium, heavy, rigid, etc.), create haptics utility if being used in app more.
  const fireHaptic = useCallback(() => {
    if (!haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [haptics]);

  // animations
  const indicatorTransformOriginY = useDerivedValue(() =>
    interpolate(animatedIndex.value, [0, 1, 2], [-1, 0, 1], Extrapolate.CLAMP)
  );

  const containerStyle = useMemo(
    () => [
      styles.header,
      { backgroundColor: useSolidBackground ? (theme?.colors?.buttonBackground || '#444') : 'transparent' },
      style,
    ],
    [style, theme?.colors?.buttonBackground, useSolidBackground]
  );

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

  const handlePressClose = useCallback(() => {
    if (typeof onClose === 'function') onClose();
  }, [onClose]);

  if (variant === 'compact') {
    return (
      <Animated.View
        style={[containerStyle, containerAnimatedStyle, styles.compactContainer]}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {title ? (
          <Animated.Text style={styles.compactTitle} numberOfLines={1}>{title}</Animated.Text>
        ) : null}
        {true ? (
          <IconButton
            icon={closeIcon}
            size={18}
            onPress={handlePressClose}
            accessibilityLabel={'Close'}
            style={styles.compactCloseBtn}
            rippleColor={theme.colors?.backdrop}
          />
        ) : null}
      </Animated.View>
    );
  }

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
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  compactTitle: {
    flex: 1,
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 20,
  },
  compactCloseBtn: {
    margin: 0,
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