import React, { useMemo } from "react";
import Animated, {
  useAnimatedStyle,
  interpolateColor,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useTheme } from 'react-native-paper';

const Background = ({ style, animatedIndex }) => {
  const theme = useTheme();
  // fallback color
  const endColor = theme?.colors?.background || theme?.colors.surface || '#383838';
  // get start color otherwise fallback
  const startColor = theme?.colors?.focusedBackground || theme?.colors?.surface || '#4c5063';

  const colorAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      animatedIndex.value,
      [0, 1],
      [startColor, endColor]
    ),
  }), [startColor, endColor]);
  
  const radiusAnimatedStyle = useAnimatedStyle(() => {
    const r = interpolate(animatedIndex.value, [1, 2], [20, 0], Extrapolate.CLAMP);
    return {
      borderTopLeftRadius: r,
      borderTopRightRadius: r,
      overflow: 'hidden',
    };
  });

  const containerStyle = useMemo(
    () => [style, colorAnimatedStyle, radiusAnimatedStyle],
    [style, colorAnimatedStyle, radiusAnimatedStyle]
  );

  return <Animated.View pointerEvents="none" style={containerStyle} />;
};

export default Background;