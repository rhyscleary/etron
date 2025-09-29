import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BottomSheetFooter, useBottomSheet } from '@gorhom/bottom-sheet';
import { RectButton } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Extrapolate, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTheme } from 'react-native-paper';
import { withAlpha } from '../../utils/color';

const AnimatedRectButton = Animated.createAnimatedComponent(RectButton);

const Footer = ({
  animatedFooterPosition,
  haptics = true,
  lastIndex = 0,
  variant = 'default',
  placement = 'right',
}) => {
  const { bottom: bottomSafeArea } = useSafeAreaInsets();
  const theme = useTheme();
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

  if (variant === 'none') {
    return null;
  }

  const variantStyle = useMemo(() => {
    switch (variant) {
      case 'translucent':
        return styles.translucent;
      case 'minimal':
        return styles.minimal;
      case 'default':
      default:
        return [
          styles.default,
          { backgroundColor: theme.colors?.primary || '#666' },
        ];
    }
  }, [variant, theme.colors]);

  const placementStyle = useMemo(() => {
    switch (placement) {
      case 'left':
        return styles.placeLeft;
      case 'center':
        return styles.placeCenter;
      case 'right':
      default:
        return styles.placeRight;
    }
  }, [placement]);

  return (
    <BottomSheetFooter
      bottomInset={bottomSafeArea}
      animatedFooterPosition={animatedFooterPosition}
    >
      <AnimatedRectButton style={[containerStyle, placementStyle, variantStyle]} onPress={handleArrowPress}>
        {variant === 'translucent' && (
          <>
            <BlurView
              intensity={40}
              tint={Platform.OS === 'ios' ? 'systemThinMaterialDark' : 'dark'}
              style={[StyleSheet.absoluteFill, styles.translucentBlur]}
            />
            <View
              style={[
                styles.translucentOverlay,
                {
                  backgroundColor: withAlpha(
                    theme.colors?.surfaceVariant || theme.colors?.surface || '#1c1c1c',
                    0.18
                  ),
                  borderColor: withAlpha(theme.colors?.outlineVariant || '#ffffff', 0.15),
                },
              ]}
              pointerEvents="none"
            />
          </>
        )}
        <Animated.View
          style={[
            chevronContainerStyle,
            chevronShiftAnimatedStyle,
          ]}
          pointerEvents="none"
        >
          <Animated.View style={[
            styles.bar,
            variant === 'minimal' && styles.barMinimal,
            variant === 'minimal' && styles.barMinimalShadow,
            { backgroundColor: theme.colors?.icon || theme.colors?.onSurface || '#fff' },
            leftBarAnimatedStyle,
          ]} />
          <Animated.View style={[
            styles.bar,
            variant === 'minimal' && styles.barMinimal,
            variant === 'minimal' && styles.barMinimalShadow,
            { backgroundColor: theme.colors?.icon || theme.colors?.onSurface || '#fff' },
            rightBarAnimatedStyle,
          ]} />
        </Animated.View>
      </AnimatedRectButton>
    </BottomSheetFooter>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 0,
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  placeLeft: {
    alignSelf: 'flex-start',
    marginLeft: 24,
  },
  placeCenter: {
    alignSelf: 'center',
  },
  placeRight: {
    alignSelf: 'flex-end',
    marginRight: 24,
  },
  default: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 8.0,
    elevation: 2,
  },
  translucent: {
    // background handled by BlurView
  },
  minimal: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    overflow: 'visible',
    opacity: 0.5,
  },
  translucentBlur: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  translucentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
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
  },
  barMinimal: {},
  barMinimalShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});

export default Footer;