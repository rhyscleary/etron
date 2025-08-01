// Author(s): Rhys Cleary, Holly Wyatt

import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TextInput, useTheme } from "react-native-paper";

const TextField = ({
    label,
    value,
    placeholder,
    error,
    onChangeText,
    secureTextEntry = false
}) => {
    const theme = useTheme();
    const [hidePassword, setHidePassword] = useState(secureTextEntry);
    const isPassword = secureTextEntry === true;

    return (
        <View style={styles.componentContainer}>
            {label ? (
                <View
                    style={[
                        styles.labelContainer,
                        { backgroundColor: theme.colors.background },
                    ]}
                >
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                        {label}
                    </Text>
                </View>
            ) : null}

            <TextInput
                mode="outlined"
                value={value}
                placeholder={placeholder}
                {...(error === true ? { error: true } : {})}
                onChangeText={onChangeText}
                outlineStyle={{
                    borderWidth: 2,
                }}
                secureTextEntry={isPassword ? hidePassword : false}
                right={
                    isPassword ? (
                        <TextInput.Icon
                            icon={hidePassword ? "eye-off" : "eye"}
                            onPress={() => setHidePassword(!hidePassword)}
                        />
                    ) : null
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    componentContainer: {
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