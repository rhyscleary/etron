import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheetFooter, useBottomSheet } from '@gorhom/bottom-sheet';
import { RectButton } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Extrapolate, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedRectButton = Animated.createAnimatedComponent(RectButton);

const Footer = ({ animatedFooterPosition, haptics = true, lastIndex = 0 }) => {
  const { bottom: bottomSafeArea } = useSafeAreaInsets();
  const { expand, collapse, animatedIndex } = useBottomSheet();

  // chevron - two bars rotate between index 0 and index 1 states
  const ANGLE_30 = Math.PI / 6;
  const BAR_WIDTH = 14;
  const SHIFT_MAGNITUDE = (BAR_WIDTH * Math.sin(ANGLE_30)) / 2;

  const leftBarAnimatedStyle = useAnimatedStyle(() => {
    const leftRotate = interpolate(
      animatedIndex.value,
      [0, 1],
      [-ANGLE_30, ANGLE_30],
      Extrapolate.CLAMP
    );
    return {
      transform: [
        { rotate: `${leftRotate}rad` },
        { translateX: -5 },
      ],
    };
  });

  const rightBarAnimatedStyle = useAnimatedStyle(() => {
    const rightRotate = interpolate(
      animatedIndex.value,
      [0, 1],
      [ANGLE_30, -ANGLE_30],
      Extrapolate.CLAMP
    );
    return {
      transform: [
        { rotate: `${rightRotate}rad` },
        { translateX: 5 },
      ],
    };
  });
  const chevronContainerStyle = useMemo(
    () => [styles.chevronContainer],
    []
  );

  // TODO: if needed change handle indicator to same centering
  const chevronShiftAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          animatedIndex.value,
          [0, 1],
          [-SHIFT_MAGNITUDE, SHIFT_MAGNITUDE],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  // visible only near 0 lastIndex snap points
  const containerAnimatedStyle = useAnimatedStyle(
    () => {
      if (lastIndex <= 1) {
        return { opacity: 1 }; // only one or two snap points - always visible
      }
      const midFadeInStart = 0.6; // distamce from 0 before starting to hide
      const midFadeOutEnd = lastIndex - 0.6; // distance to last before showing again
      return {
        opacity: interpolate(
          animatedIndex.value,
          [0, midFadeInStart, midFadeOutEnd, lastIndex],
          [1, 0, 0, 1],
          Extrapolate.CLAMP
        ),
      };
    },
    [animatedIndex, lastIndex]
  );
  const containerStyle = useMemo(
    () => [containerAnimatedStyle, styles.container],
    [containerAnimatedStyle]
  );

  // TODO: test different haptics (light, medium, heavy, rigid, etc.), create haptics utility if being used in app more.
  const triggerHaptic = useCallback(() => {
    if (!haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [haptics]);

  const handleArrowPress = useCallback(() => {
    triggerHaptic();
    if (animatedIndex.value === 0) {
      expand();
    } else {
      collapse();
    }
  }, [expand, collapse, animatedIndex, triggerHaptic]);

  return (
    <BottomSheetFooter
      bottomInset={bottomSafeArea}
      animatedFooterPosition={animatedFooterPosition}
    >
      <AnimatedRectButton style={containerStyle} onPress={handleArrowPress}>
        <Animated.View style={[chevronContainerStyle, chevronShiftAnimatedStyle]} pointerEvents="none">
          <Animated.View style={[styles.bar, leftBarAnimatedStyle]} />
          <Animated.View style={[styles.bar, rightBarAnimatedStyle]} />
        </Animated.View>
      </AnimatedRectButton>
    </BottomSheetFooter>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#80f',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 8.0,
    elevation: 2,
  },
  chevronContainer: {
    width: 26,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bar: {
    position: 'absolute',
    width: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
});

export default Footer;