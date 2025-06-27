// Author(s): Rhys Cleary

import { Children } from "react";
import { View } from "react-native";

const StackLayout = ({
    children,
    spacing = 0,
    stackStyle,
    childStyle
}) => {
    const childrenArray = Children.toArray(children);
    
    return (
        <View style={stackStyle}>
            {childrenArray.map((child, index) => {
                const isLast = index === childrenArray.length - 1;

                return (
                    <View key={index} style={[childStyle, !isLast ? {marginBottom: spacing} : null ]}>
                        {child}
                    </View>
                );
            })}
        </View>
    );
};

export default StackLayout;