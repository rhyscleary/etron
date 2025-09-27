import React, { useMemo } from "react";
import Animated, {
  useAnimatedStyle,
  interpolateColor,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

const Background = ({ style, animatedIndex }) => {
  const colorAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      animatedIndex.value,
      [0, 1],
      ["#a8b5eb", "#000000ff"]
    ),
  }));
  
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