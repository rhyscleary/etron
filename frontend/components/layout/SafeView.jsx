// Author(s): Rhys Cleary

import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const SafeView = ({ children}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView
            style={{ flex: 1, paddingHorizontal: 10, backgroundColor: theme.colors.background }}
        >
            {children}
        </SafeAreaView>
    );
};

export default SafeView;
