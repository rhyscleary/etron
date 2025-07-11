// Author(s): Rhys Cleary

import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const SafeView = ({ children}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View
            style={{ 
                flex: 1,  
                backgroundColor: theme.colors.background,
                paddingTop: insets.top,
                paddingHorizontal: 20
            }}
        >
            {children}
        </View>
    );
};

export default SafeView;
