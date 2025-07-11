import { StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";


export const commonStyles = StyleSheet.create({
    screen: {
        flex: 1
    },
    scrollableContentContainer: {
        paddingBottom: 100,
    },
    inlineButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginVertical: 30,
        gap: 32
    }
});

