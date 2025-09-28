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
  // Fallback color in case theme is undefined or missing background
  const endColor = theme?.colors?.background || '#383838';

  const colorAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      animatedIndex.value,
      [0, 1],
      ["#4c5063", endColor]
    ),
  }), [endColor]);
  
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