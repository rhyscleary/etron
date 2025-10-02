import React, { useMemo, useRef, useCallback } from "react";
import { StyleSheet } from "react-native";
import { useTheme, Appbar } from "react-native-paper";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
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
  onLayout,
  ...restProps
}) => {
  const hasFiredRef = useRef(false);
  const theme = useTheme();
  const colors = theme?.colors ?? {};

  // TODO: test different haptics (light, medium, heavy, rigid, etc.), create haptics utility if being used in app more.
  const fireHaptic = useCallback(() => {
    if (!haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [haptics]);

  // animations
  // Reduced to two indices (0 collapsed, 1 expanded)
  const indicatorTransformOriginY = useDerivedValue(() =>
    interpolate(animatedIndex.value, [0, 1], [-1, 0], Extrapolate.CLAMP)
  );

  const containerStyle = useMemo(
    () => [
      styles.header,
      variant === 'standard' ? styles.standardHandle : styles.compactHandleWrapper,
      { backgroundColor: useSolidBackground || variant === 'standard' ? (colors.surface ?? colors.background ?? '#444') : 'transparent' },
      style,
    ],
    [style, colors.surface, colors.background, useSolidBackground, variant]
  );

  const containerAnimatedStyle = useAnimatedStyle(() => {
    // With only two indices (0 collapsed, 1 expanded) interpolate directly across [0,1]
    const borderTopRadius = interpolate(
      animatedIndex.value,
      [0, 1],
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
      [0, 1],
      [-ANGLE_30, 0],
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
      [0, 1],
      [ANGLE_30, 0],
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

  const onTouchStart = useCallback(() => {
    if (!hasFiredRef.current) {
      hasFiredRef.current = true;
      fireHaptic();
    }
  }, [fireHaptic]);

  const onTouchEnd = useCallback(() => {
    hasFiredRef.current = false;
  }, []);

  const handlePressClose = useCallback(() => {
    if (typeof onClose === 'function') onClose();
  }, [onClose]);

  if (variant === 'compact') {
    return (
      <Animated.View
        {...restProps}
        style={[containerStyle, containerAnimatedStyle]}
        onLayout={onLayout}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Animated.View style={styles.compactWrapper} pointerEvents="box-none">
          <Appbar.Header
            statusBarHeight={0}
            style={styles.compactAppbar}
          >
            {title ? (
              <Appbar.Content title={title} titleStyle={[styles.compactTitle, { color: colors.text || colors.onSurface || '#fff' }]} />
            ) : null}
            {showClose ? (
              <Appbar.Action
                icon={closeIcon}
                accessibilityLabel={'Close'}
                onPress={handlePressClose}
                rippleColor={colors.backdrop}
              />
            ) : null}
          </Appbar.Header>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      {...restProps}
      style={[containerStyle, containerAnimatedStyle]}
      onLayout={onLayout}
      renderToHardwareTextureAndroid
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
        <Animated.View style={[leftIndicatorStyle, leftIndicatorAnimatedStyle, { backgroundColor: colors.buttonBackground || colors.outline || '#999' }]} />
        <Animated.View style={[rightIndicatorStyle, rightIndicatorAnimatedStyle, { backgroundColor: colors.buttonBackground || colors.outline || '#999' }]} />
    </Animated.View>
  );
};

  export default React.memo(Handle);

const styles = StyleSheet.create({
  header: {
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  standardHandle: {
    paddingVertical: 14,
    width: '100%',
  },
  compactHandleWrapper: {
    paddingTop: 4,
    width: '100%',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  compactAppbar: {
    paddingHorizontal: 12,
    paddingVertical: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    width: '100%',
    height: 44,
    minHeight: 44,
  },
  compactWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  compactTitle: {
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 20,
  },
  indicator: {
    position: "absolute",
    width: 10,
    height: 4,
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