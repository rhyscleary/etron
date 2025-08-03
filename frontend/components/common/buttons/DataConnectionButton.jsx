import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Image} from 'react-native';
import { useTheme } from 'react-native-paper';

const activeIcon = require('../../../assets/images/check.png');
const inactiveIcon = require('../../../assets/images/cross.png');

const DataConnectionButton = ({
    label="Data Connection 1", //Temporary, remove string when fully implementing
    height = 50,
}) => {
    const [isActive, setIsActive] = useState(false);

    const onPress = () => {     //Temp toggle until fully implemented
        setIsActive(prev => !prev);
    }

    const theme = useTheme();

    return (
        <TouchableOpacity 
            onPress={onPress} 
            style={[
                styles.connectionButton,
                { borderColor: theme.colors.outline },
                { height },  
                { backgroundColor: theme.colors.background }
            ]}>
            <View style={styles.content}>
                <Image
                    source={isActive ? activeIcon : inactiveIcon}
                    style={styles.icon}
                    resizeMode="contain"
                />
                <Text 
                    style={[
                        styles.label, 
                        { color: theme.colors.text }
                    ]}
                >
                    {label}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    connectionButton: {
        borderRadius: 8,
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
        marginHorizontal: 20,
        marginVertical: 5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        width: 24,
        height: 24,
        marginRight: 10,
        marginTop: 1,
    },
    label: {
        fontSize: 16,
    },
});

export default DataConnectionButton;