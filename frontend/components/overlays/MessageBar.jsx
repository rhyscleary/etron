import { StyleSheet, View } from "react-native";
import { Icon, Snackbar, Text } from "react-native-paper";

const MessageBar = ({
    visible,
    message,
    duration = 5000,
    onDismiss
}) => {
    return (
        <Snackbar
            visible={visible}
            onDismiss={onDismiss}
            duration={duration}
            icon="close"
            onIconPress={onDismiss}
        >
            <View style={styles.barContainer}>
                <Icon source="information-outline" size={20} />
                <Text>{message}</Text>
            </View>
        </Snackbar>
    );
};

const styles = StyleSheet.create({
    barContainer: {
        flexDirection: "row",
        backgroundColor: "transparent"
    }
});

export default MessageBar;