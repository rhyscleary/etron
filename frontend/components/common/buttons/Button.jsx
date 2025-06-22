// Author(s): Rhys Cleary

import { View, StyleSheet} from 'react-native';
import { Button, useTheme } from 'react-native-paper';

const BasicButton = ({
    danger = false,
    label,
    onPress,
    width = 145
}) => {
    const theme = useTheme();

    return (
        <View>
            <Button 
                compact  
                mode="contained" 
                textColor={theme.colors.text} 
                buttonColor={danger ? (
                    theme.colors.error
                ) : (
                    theme.colors.primary
                )}
                style={[styles.button, {width}]}
                onPress={onPress}
            >
                {label}
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 10,
    },
});

export default BasicButton;