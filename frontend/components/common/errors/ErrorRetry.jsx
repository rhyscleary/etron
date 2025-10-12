import { View, StyleSheet } from 'react-native';
import { Chip, Text } from 'react-native-paper';

const ErrorRetry = ({ message = "Something went wrong.", onRetry }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.message}>{message}</Text>
            {onRetry && (
                <Chip
                    mode="outlined"
                    onPress={onRetry}
                    style={styles.chip}
                >
                    Retry
                </Chip>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 100,
    },
    message: {
        fontSize: 16,
    },
    chip: {
        marginTop: 8,
    },
});

export default ErrorRetry;