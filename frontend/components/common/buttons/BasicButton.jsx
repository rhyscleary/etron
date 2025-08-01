// Author(s): Rhys Cleary

import { View, StyleSheet} from 'react-native';
import { Button, useTheme } from 'react-native-paper';

const BasicButton = ({
    danger = false,
    altBackground = false,
    altText = false,
    label,
    onPress,
    fullWidth = false,
    style,
    disabled = false,
}) => {
    const theme = useTheme();
    
    let buttonColor;
    if (danger) {
        buttonColor = theme.colors.error;
    } else if (altBackground) {
        buttonColor = theme.colors.buttonBackgroundAlt;
    } else {
        buttonColor = theme.colors.primary;
    }

    let textColor = altText
        ? theme.colors.altText
        : theme.colors.text;

    return (
        <View>
            <Button 
                compact  
                mode="contained" 
                textColor={textColor}  
                buttonColor={buttonColor}
                disabled={disabled}
                style={[
                    styles.button,
                    fullWidth ? styles.fullWidth : styles.fixedWidth,
                    style
                ]}
                onPress={onPress}
                //disabled={disabled}
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
    fixedWidth: {
        width: 145,
    },
    fullWidth: {
        width: '100%',
    },
});

export default BasicButton;