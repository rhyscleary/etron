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
import ContentsSearchBar from './contents-search-bar';

const AnimatedRectButton = Animated.createAnimatedComponent(RectButton);

const ANGLE_30 = Math.PI / 6;
const BAR_WIDTH = 14;
const SHIFT_MAGNITUDE = (BAR_WIDTH * Math.sin(ANGLE_30)) / 2;

const Footer = ({
  animatedFooterPosition,
  haptics = true,
  lastIndex = 0,
  variant = 'default',
  placement = 'right',
  // search variant props
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search',
  onSearchFocus,
  onSearchBlur,
}) => {
  const { bottom: bottomSafeArea } = useSafeAreaInsets();
  const theme = useTheme();
  const colors = theme?.colors ?? {};
  const { expand, collapse, animatedIndex } = useBottomSheet();

  const leftBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(animatedIndex.value, [0, 1], [-ANGLE_30, ANGLE_30], Extrapolate.CLAMP)}rad` },
      { translateX: -5 },
    ],
  }));

  const rightBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(animatedIndex.value, [0, 1], [ANGLE_30, -ANGLE_30], Extrapolate.CLAMP)}rad` },
      { translateX: 5 },
    ],
  }));

  const chevronShiftAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(animatedIndex.value, [0, 1], [-SHIFT_MAGNITUDE, SHIFT_MAGNITUDE], Extrapolate.CLAMP),
    }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => {
    if (lastIndex <= 1) return { opacity: 1 };
    
    const midFadeInStart = 0.6;
    const midFadeOutEnd = lastIndex - 0.6;
    return {
      opacity: interpolate(
        animatedIndex.value,
        [0, midFadeInStart, midFadeOutEnd, lastIndex],
        [1, 0, 0, 1],
        Extrapolate.CLAMP
      ),
    };
  }, [lastIndex]);
  const triggerHaptic = useCallback(() => {
    if (haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  }, [haptics]);

  const variantStyle = useMemo(() => {
    if (variant === 'none' || variant === 'search') return null;
    if (variant === 'translucent') return styles.translucent;
    if (variant === 'minimal') return styles.minimal;
    return [styles.default, { backgroundColor: colors.primary || '#666' }];
  }, [variant, colors.primary]);

  const placementStyle = useMemo(() => {
    if (placement === 'left') return styles.placeLeft;
    if (placement === 'center') return styles.placeCenter;
    return styles.placeRight;
  }, [placement]);

  const containerStyle = useMemo(
    () => [containerAnimatedStyle, styles.container, placementStyle, variantStyle],
    [containerAnimatedStyle, placementStyle, variantStyle]
  );

  const handleArrowPress = useCallback(() => {
    triggerHaptic();
    animatedIndex.value === 0 ? expand() : collapse();
  }, [expand, collapse, animatedIndex, triggerHaptic]);

  if (variant === 'none') return null;

  if (variant === 'search') {
    return (
      <BottomSheetFooter
        bottomInset={bottomSafeArea}
        animatedFooterPosition={animatedFooterPosition}
      >
        <Animated.View style={[containerAnimatedStyle, styles.searchFooterContainer]}>
          <ContentsSearchBar
            value={searchValue}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            showShadow={true}
          />
        </Animated.View>
      </BottomSheetFooter>
    );
  }

  return (
    <BottomSheetFooter
      bottomInset={bottomSafeArea}
      animatedFooterPosition={animatedFooterPosition}
    >
      <AnimatedRectButton
        style={containerStyle}
        onPress={handleArrowPress}
        accessibilityRole="button"
      >
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
                    colors.surfaceVariant || colors.surface || '#1c1c1c',
                    0.18
                  ),
                  borderColor: withAlpha(colors.outlineVariant || '#ffffff', 0.15),
                },
              ]}
              pointerEvents="none"
            />
          </>
        )}
        <Animated.View
          style={[
            styles.chevronContainer,
            chevronShiftAnimatedStyle,
          ]}
          pointerEvents="none"
        >
          <Animated.View style={[
            styles.bar,
            variant === 'minimal' && styles.barMinimal,
            variant === 'minimal' && styles.barMinimalShadow,
            { backgroundColor: colors.icon || colors.onSurface || '#fff' },
            leftBarAnimatedStyle,
          ]} />
          <Animated.View style={[
            styles.bar,
            variant === 'minimal' && styles.barMinimal,
            variant === 'minimal' && styles.barMinimalShadow,
            { backgroundColor: colors.icon || colors.onSurface || '#fff' },
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
  searchFooterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default React.memo(Footer);