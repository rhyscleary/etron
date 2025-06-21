// Author(s): Rhys Cleary

import { View, Text, StyleSheet } from "react-native";
import { TextInput, useTheme } from "react-native-paper";

const TextField = ({
    label,
    value,
    placeholder,
    error
}) => {
    const theme = useTheme();

    return (
        <View style={styles.componentContainer}>
            <View style={[styles.labelContainer, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.label, {color: theme.colors.text}]}> {label} </Text>
            </View>
            <TextInput
            mode="outlined"
            value={value}
            placeholder={placeholder}
            {...(error === true ? {error: true} : {})}

            label={null}
        />
        </View>
    );
};

const styles = StyleSheet.create({
    componentContainer: {
        marginVertical: 20,
        position: 'relative'
    },
    labelContainer: {
        position: 'absolute',
        top: -10,
        left: 12,
        zIndex: 1
    },
    label: {
        fontSize: 14
    }
});

export default TextField;