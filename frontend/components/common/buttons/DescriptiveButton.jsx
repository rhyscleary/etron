// Author(s): Rhys Cleary

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';

const DescriptiveButton = ({
    icon,
    label,
    description,
    onPress

}) => {
    const theme = useTheme();

    return (
        <Pressable onPress={onPress} style={[styles.descriptiveButton, {borderColor: theme.colors.outline}]}>
            <View 
                mode="outlined" 
                style={styles.innerContainer}
            >
                {icon ? (
                    <Icon source={icon} size={28} color={theme.colors.icon} />
                ) : null}

                <View style={styles.textContainer}>
                    <Text style={[styles.labelText, { color: theme.colors.text }]}>{label}</Text>
                    {description ? (
                        <Text style={[styles.descriptionText, { color: theme.colors.text }]}>{description}</Text> 
                    ) : null}
                </View>

                <Icon source="chevron-right" size={28} color={theme.colors.icon} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    descriptiveButton: {
        borderRadius: 10,
        width: '100%',
        borderWidth: 1,
        marginVertical: 6,
    },
    innerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    textContainer: {
        flex: 1,
        flexShrink: 1,
        marginLeft: 14,
        marginRight: 14
    },
    labelText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    descriptionText: {
        fontSize: 14
    },
});

export default DescriptiveButton;